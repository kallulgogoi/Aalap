export const enrichChat = (chat, currentUser) => {
  const otherParticipant = chat.participants?.find(
    (p) => p._id !== currentUser?.id && p._id !== currentUser?._id,
  );

  const chatName = otherParticipant
    ? otherParticipant.username
    : chat.chatName || "Unknown User";

  const avatar =
    otherParticipant?.profilePic?.url ||
    chat.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName)}&background=random`;

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
