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

const persistChatsToDb = async (chats) => {
  try {
    const persistable = prepareChatsForStorage(chats);
    if (persistable.length > 0) {
      await db.chats.bulkPut(persistable);
    }
  } catch (error) {
    console.error("Failed to persist chats to IndexedDB", error);
  }
};

export const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  isMessagesLoading: false,

  setChats: (chats) => {
    const sorted = sortChats(chats);
    set({ chats: sorted });
    void persistChatsToDb(sorted);
  },

  setActiveChat: async (chat) => {
    set({ activeChat: chat });
    if (chat && !chat.isGhost) {
      await get().fetchMessages(chat._id);
    } else {
      set({ messages: [] });
    }
  },

  setMessages: (messages) => set({ messages: dedupeMessages(messages) }),

  setLoading: (status) => set({ isMessagesLoading: status }),

  fetchChats: async () => {
    try {
      const localChats = sortChats(await db.chats.orderBy("updatedAt").reverse().toArray());
      if (localChats.length > 0) {
        set({ chats: localChats });
      }

      const response = await axiosInstance.get("/chats");
      if (response.data?.success) {
        const currentUser = useAuthStore.getState().user;
        const chats = sortChats(enrichChats(response.data.chats, currentUser));
        set({ chats });
        await persistChatsToDb(chats);
      }
    } catch (error) {
      console.error("Failed to fetch chats", error);
    }
  },

  fetchMessages: async (chatId) => {
    set({ isMessagesLoading: true });

    // 1. INSTANT LOAD: Try to get from local IndexedDB first
    const localMessages = dedupeMessages(
      await db.messages.where("chatId").equals(chatId).toArray(),
    );
    if (localMessages.length > 0) {
      set({ messages: localMessages, isMessagesLoading: false });
    }

    // 2. BACKGROUND SYNC: Fetch from server
    try {
      const response = await axiosInstance.get(`/messages/${chatId}`);
      if (response.data?.success) {
        const serverMessages = dedupeMessages(response.data.messages);
        set({ messages: serverMessages });

        // Persist to IndexedDB
        await db.messages.bulkPut(serverMessages);
      }
    } catch (error) {
      console.error("Failed to sync messages", error);
    } finally {
      set({ isMessagesLoading: false });
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
  // When a user reads a chat, clear the badge
  clearUnreadCount: (chatId) => {
    const { chats } = get();
    const updatedChats = chats.map((chat) =>
      chat._id === chatId ? { ...chat, unreadCount: 0 } : chat,
    );
    set({ chats: updatedChats });
    void persistChatsToDb(updatedChats);
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
      if (state.activeChat?._id !== chatId) {
        return {};
      }

      return {
        messages: state.messages.map((msg) => {
          const senderId =
            typeof msg.senderId === "object" && msg.senderId !== null
              ? msg.senderId._id
              : msg.senderId;

          const isMyMessage = String(senderId) === myId;
          const wasReadByRecipient = readerId !== myId;

          if (isMyMessage && wasReadByRecipient && msg.status !== "read") {
            return { ...msg, status: "read" };
          }

          return msg;
        }),
      };
    });
  },
}));
