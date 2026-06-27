import { create } from "zustand";
import axiosInstance from "@/lib/axios";
import { useAuthStore } from "./authStore";
import { db } from "@/lib/db";
import { dedupeMessages, normalizeMessageId } from "@/lib/messageUtils";
import {
  enrichChats,
  prepareChatsForStorage,
  sortChats,
} from "@/lib/chatUtils";
import { generateDefaultAvatar, getAvatarUrl } from "@/lib/avatar";

const persistChatsToDb = async (chats) => {
  try {
    const persistable = prepareChatsForStorage(chats);
    // Sort by updatedAt descending
    persistable.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    
    // LRU Eviction: Keep only top 100
    const topChats = persistable.slice(0, 100);
    const chatsToDelete = persistable.slice(100);

    if (topChats.length > 0) {
      await db.chats.bulkPut(topChats);
    }
    if (chatsToDelete.length > 0) {
      const idsToDelete = chatsToDelete.map(c => c._id);
      await db.chats.bulkDelete(idsToDelete);
    }
  } catch (error) {
    console.error("Failed to persist chats to IndexedDB", error);
  }
};

const cleanupLocalMessages = async (chatId) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const localMessages = await db.messages.where("chatId").equals(chatId).toArray();
    
    // 1. Delete messages older than 30 days
    const expiredIds = localMessages
      .filter(m => new Date(m.createdAt || Date.now()) < thirtyDaysAgo)
      .map(m => m._id);
      
    if (expiredIds.length > 0) {
      await db.messages.bulkDelete(expiredIds);
    }

    // 2. Keep only 500 most recent
    const remainingMessages = localMessages.filter(m => !expiredIds.includes(m._id));
    if (remainingMessages.length > 500) {
      remainingMessages.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const excessMessages = remainingMessages.slice(500);
      const excessIds = excessMessages.map(m => m._id);
      await db.messages.bulkDelete(excessIds);
    }
  } catch (error) {
    console.error("Failed to cleanup local messages", error);
  }
};

export const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  isMessagesLoading: false,
  hasMoreMessages: false,
  isFetchingMore: false,

  setChats: (chats) => {
    const sorted = sortChats(chats);
    set({ chats: sorted });
    void persistChatsToDb(sorted);
  },

  setActiveChat: async (chat) => {
    set({ activeChat: chat });

    if (!chat) {
      set({ messages: [], hasMoreMessages: false });
      return;
    }

    if (chat.isPendingInvite) {
      set({
        messages: chat.latestMessage ? [chat.latestMessage] : [],
        isMessagesLoading: false,
        hasMoreMessages: false,
      });
      return;
    }

    if (chat.isGhost) {
      set({ messages: [], hasMoreMessages: false });
      return;
    }

    await get().fetchMessages(chat._id);
  },

  setMessages: (messages) => set({ messages: dedupeMessages(messages) }),

  setLoading: (status) => set({ isMessagesLoading: status }),

  fetchChats: async () => {
    try {
      const currentUser = useAuthStore.getState().user;
      const localChats = sortChats(
        enrichChats(
          await db.chats.orderBy("updatedAt").reverse().toArray(),
          currentUser,
        ),
      );
      if (localChats.length > 0) {
        set({ chats: localChats });
      }

      const response = await axiosInstance.get("/chats");
      if (response.data?.success) {
        const chats = sortChats(enrichChats(response.data.chats, currentUser));
        set({ chats });
        await persistChatsToDb(chats);
      }
    } catch (error) {
      console.error("Failed to fetch chats", error);
    }
  },

  fetchMessages: async (chatId) => {
    if (!chatId || String(chatId).startsWith("pending_")) return;

    set({ isMessagesLoading: true, hasMoreMessages: false });

    // 1. INSTANT LOAD: Try to get from local IndexedDB first
    const localMessages = dedupeMessages(
      await db.messages.where("chatId").equals(chatId).toArray(),
    );
    localMessages.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    
    if (localMessages.length > 0) {
      set({ messages: localMessages, isMessagesLoading: false });
    }

    void cleanupLocalMessages(chatId);

    // 2. BACKGROUND SYNC: Fetch from server
    try {
      const response = await axiosInstance.get(`/messages/${chatId}?limit=100`);
      if (response.data?.success) {
        const serverMessages = dedupeMessages(response.data.messages);
        set({ 
          messages: serverMessages,
          hasMoreMessages: response.data.hasMore
        });

        // Persist to IndexedDB
        await db.messages.bulkPut(serverMessages);
      }
    } catch (error) {
      console.error("Failed to sync messages", error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  fetchMoreMessages: async () => {
    const { activeChat, messages, isFetchingMore, hasMoreMessages } = get();
    if (!activeChat || isFetchingMore || !hasMoreMessages || messages.length === 0) return;

    set({ isFetchingMore: true });
    try {
      const oldestMessageDate = messages[0].createdAt;
      const response = await axiosInstance.get(`/messages/${activeChat._id}?limit=100&before=${encodeURIComponent(oldestMessageDate)}`);
      
      if (response.data?.success) {
        const olderMessages = dedupeMessages(response.data.messages);
        
        set((state) => ({
          messages: dedupeMessages([...olderMessages, ...state.messages]),
          hasMoreMessages: response.data.hasMore
        }));

        await db.messages.bulkPut(olderMessages);
        void cleanupLocalMessages(activeChat._id);
      }
    } catch (error) {
      console.error("Failed to fetch more messages", error);
    } finally {
      set({ isFetchingMore: false });
    }
  },

  addLiveMessage: async (newMessage) => {
    const newMessageId = normalizeMessageId(newMessage?._id);
    if (!newMessageId) return;

    // 1. Persist to local DB (_id is the primary key in Dexie v2)
    await db.messages.put(newMessage);

    const chatExists = get().chats.some((c) => c._id === newMessage.chatId);
    if (!chatExists) {
      set((state) => {
        const { activeChat, messages } = state;
        if (!activeChat || newMessage.chatId !== activeChat._id) {
          return {};
        }

        const exists = messages.some(
          (msg) => normalizeMessageId(msg._id) === newMessageId,
        );
        return exists ? {} : { messages: [...messages, newMessage] };
      });

      await get().fetchChats();
      return;
    }

    // 2. Atomically update messages + sidebar to avoid duplicate inserts from races
    set((state) => {
      const { activeChat, messages, chats } = state;
      const nextState = {};

      if (activeChat && newMessage.chatId === activeChat._id) {
        const exists = messages.some(
          (msg) => normalizeMessageId(msg._id) === newMessageId,
        );
        if (!exists) {
          nextState.messages = [...messages, newMessage];
        }
      }

      const updatedChats = sortChats(
        chats.map((chat) => {
          if (chat._id === newMessage.chatId) {
            return {
              ...chat,
              latestMessage: newMessage,
              updatedAt: newMessage.createdAt || new Date().toISOString(),
              unreadCount:
                activeChat?._id !== chat._id ? (chat.unreadCount || 0) + 1 : 0,
            };
          }
          return chat;
        }),
      );

      nextState.chats = updatedChats;
      return nextState;
    });

    await persistChatsToDb(get().chats);
  },

  clearUnreadCount: (chatId) => {
    const { chats } = get();
    const updatedChats = chats.map((chat) =>
      chat._id === chatId ? { ...chat, unreadCount: 0 } : chat,
    );
    set({ chats: updatedChats });
    void persistChatsToDb(updatedChats);
  },

  addPendingInviteChat: (shadowMessage, targetEmail) => {
    const email = targetEmail.toLowerCase().trim();
    const displayName = email.split("@")[0] || email;

    const pendingChat = {
      _id: `pending_${email}`,
      isPendingInvite: true,
      targetEmail: email,
      chatName: displayName,
      avatar: generateDefaultAvatar(displayName, email),
      latestMessage: shadowMessage,
      participants: [],
      isOnline: false,
      unreadCount: 0,
      updatedAt: shadowMessage.createdAt || new Date().toISOString(),
    };

    set((state) => {
      const withoutDuplicate = state.chats.filter(
        (chat) => chat._id !== pendingChat._id,
      );
      const updatedChats = sortChats([pendingChat, ...withoutDuplicate]);
      return { chats: updatedChats };
    });

    void persistChatsToDb(get().chats);
    return pendingChat;
  },

  resolvePendingInvite: async ({ chatId, targetEmail } = {}) => {
    const normalizedEmail = targetEmail?.toLowerCase().trim();
    const { activeChat } = get();
    const wasViewingPending =
      activeChat?.isPendingInvite &&
      (!normalizedEmail || activeChat.targetEmail === normalizedEmail);

    if (normalizedEmail) {
      const pendingId = `pending_${normalizedEmail}`;

      // 1. Remove it from the live UI state
      set((state) => ({
        chats: state.chats.filter((chat) => chat._id !== pendingId),
        activeChat: wasViewingPending ? null : state.activeChat,
      }));

      // 2. THE FIX: Explicitly delete the ghost chat from local IndexedDB
      try {
        await db.chats.delete(pendingId);
      } catch (err) {
        console.error("Failed to delete pending chat from local DB", err);
      }
    }

    await get().fetchChats();

    if (wasViewingPending && chatId) {
      const realChat = get().chats.find((chat) => chat._id === chatId);
      if (realChat) {
        await get().setActiveChat(realChat);
      }
    }
  },

  // For your Soft Delete / Restore feature
  updateMessage: (messageId, updates) => {
    const { messages } = get();
    set({
      messages: messages.map((msg) =>
        msg._id === messageId ? { ...msg, ...updates } : msg,
      ),
    });
  },

  updateParticipantProfile: ({ userId, username, bio, profilePic }) => {
    const currentUser = useAuthStore.getState().user;
    const myId = String(currentUser?.id || currentUser?._id || "");
    const targetId = String(userId);

    const patchChat = (chat) => {
      if (!chat || chat.isPendingInvite || chat.isGhost) return chat;

      const participants = chat.participants?.map((participant) => {
        const participantId =
          typeof participant === "object" && participant !== null
            ? participant._id
            : participant;

        if (String(participantId) !== targetId) return participant;

        return {
          ...participant,
          username: username ?? participant.username,
          bio: bio ?? participant.bio,
          profilePic: profilePic ?? participant.profilePic,
        };
      });

      const otherParticipant = participants?.find((participant) => {
        const participantId =
          typeof participant === "object" && participant !== null
            ? participant._id
            : participant;
        return String(participantId) !== myId;
      });

      if (!otherParticipant || String(otherParticipant._id) !== targetId) {
        return { ...chat, participants };
      }

      const chatName = username || otherParticipant.username || chat.chatName;

      return {
        ...chat,
        participants,
        chatName,
        avatar: getAvatarUrl(otherParticipant),
      };
    };

    const updatedChats = get().chats.map(patchChat);
    const updatedActiveChat = patchChat(get().activeChat);

    set({
      chats: updatedChats,
      activeChat: updatedActiveChat,
    });
    void persistChatsToDb(updatedChats);
  },

  updateUserPresence: (userId, isOnline) => {
    const currentUser = useAuthStore.getState().user;
    const myId = String(currentUser?.id || currentUser?._id || "");
    const targetId = String(userId);

    const applyPresence = (chat) => {
      if (!chat) return chat;

      let otherId = "";
      if (chat.receiverId) {
        otherId = String(chat.receiverId);
      } else if (chat.participants?.length) {
        const otherParticipant = chat.participants.find((p) => {
          const pId = typeof p === "object" && p !== null ? p._id : p;
          return String(pId) !== myId;
        });
        otherId = String(
          typeof otherParticipant === "object" && otherParticipant !== null
            ? otherParticipant._id
            : otherParticipant || "",
        );
      }

      return otherId === targetId ? { ...chat, isOnline } : chat;
    };

    const updatedChats = get().chats.map(applyPresence);
    const updatedActiveChat = applyPresence(get().activeChat);

    set({
      chats: updatedChats,
      activeChat: updatedActiveChat,
    });
    void persistChatsToDb(updatedChats);
  },

  markMessagesAsRead: (chatId, readBy) => {
    const currentUser = useAuthStore.getState().user;
    const myId = String(currentUser?.id || currentUser?._id || "");
    const readerId = String(readBy);

    set((state) => {
      // 1. Update the sidebar preview (chats array)
      const updatedChats = state.chats.map((chat) => {
        if (chat._id === chatId && chat.latestMessage) {
          const msg = chat.latestMessage;
          const senderId =
            typeof msg.senderId === "object" && msg.senderId !== null
              ? msg.senderId._id
              : msg.senderId;

          const isMyMessage = String(senderId) === myId;
          const wasReadByRecipient = readerId !== myId;

          if (isMyMessage && wasReadByRecipient && msg.status !== "read") {
            return {
              ...chat,
              latestMessage: { ...msg, status: "read" },
            };
          }
        }
        return chat;
      });

      // 2. Update the active chat window (messages array) if currently viewing it
      let updatedMessages = state.messages;
      if (state.activeChat?._id === chatId) {
        updatedMessages = state.messages.map((msg) => {
          const senderId =
            typeof msg.senderId === "object" && msg.senderId !== null
              ? msg.senderId._id
              : msg.senderId;

          const isMyMessage = String(senderId) === myId;
          const wasReadByRecipient = readerId !== myId;

          if (isMyMessage && wasReadByRecipient && msg.status !== "read") {
            // Background update to Dexie to keep local storage in sync
            if (msg._id) {
              db.messages
                .update(msg._id, { status: "read" })
                .catch(console.error);
            }
            return { ...msg, status: "read" };
          }
          return msg;
        });
      }

      // 3. Persist the updated sidebar to IndexedDB so it survives navigation
      void persistChatsToDb(updatedChats);

      return {
        chats: updatedChats,
        messages: updatedMessages,
      };
    });
  },
}));
