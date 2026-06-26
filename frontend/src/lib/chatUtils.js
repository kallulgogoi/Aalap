import { generateDefaultAvatar } from "@/lib/avatar";

export const enrichChat = (chat, currentUser) => {
  if (chat.isPendingInvite) {
    const email = chat.targetEmail || chat.chatName || "Invite";
    const displayName = chat.chatName || email.split("@")[0] || email;

    return {
      ...chat,
      chatName: displayName,
      avatar: chat.avatar || generateDefaultAvatar(displayName, email),
      latestMessage: chat.latestMessage,
      updatedAt:
        chat.updatedAt ||
        chat.latestMessage?.createdAt ||
        new Date().toISOString(),
    };
  }

  const otherParticipant = chat.participants?.find(
    (p) => p._id !== currentUser?.id && p._id !== currentUser?._id,
  );

  const chatName = otherParticipant
    ? otherParticipant.username
    : chat.chatName || "Unknown User";

  const avatar = otherParticipant
    ? otherParticipant.profilePic?.url ||
      generateDefaultAvatar(
        chatName,
        otherParticipant.email || String(otherParticipant._id),
      )
    : chat.avatar ||
      generateDefaultAvatar(chatName, chat.targetEmail || chatName);

  return {
    ...chat,
    chatName,
    avatar,
    latestMessage: chat.latestMessage ?? chat.lastMessage,
    updatedAt:
      chat.updatedAt ||
      chat.latestMessage?.createdAt ||
      chat.lastMessage?.createdAt ||
      new Date().toISOString(),
  };
};

export const enrichChats = (chats = [], currentUser) =>
  chats.map((chat) => enrichChat(chat, currentUser));

export const sortChats = (chats = []) =>
  [...chats].sort(
    (a, b) =>
      new Date(b.latestMessage?.createdAt || b.updatedAt || 0) -
      new Date(a.latestMessage?.createdAt || a.updatedAt || 0),
  );

export const prepareChatsForStorage = (chats = []) =>
  chats
    .filter((chat) => chat?._id && !chat.isGhost)
    .map((chat) => ({
      ...chat,
      updatedAt:
        chat.updatedAt ||
        chat.latestMessage?.createdAt ||
        new Date().toISOString(),
    }));
