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

  // Find the other participant carefully
  const otherParticipant = chat.participants?.find((p) => {
    const pId = typeof p === "object" && p !== null ? p._id : p;
    return String(pId) !== String(currentUser?.id || currentUser?._id);
  });

  // Extract info 
  const pUsername = otherParticipant?.username;
  const pEmail = otherParticipant?.email;
  const pId = otherParticipant?._id || otherParticipant; 

  const chatName =
    pUsername ||
    (pEmail ? pEmail.split("@")[0] : null) ||
    chat.chatName ||
    "Unknown User";

  const hasUploadedPic =
    otherParticipant?.profilePic?.url &&
    !otherParticipant.profilePic.url.includes("ui-avatars.com");

  const avatar = hasUploadedPic
    ? otherParticipant.profilePic.url
    : generateDefaultAvatar(chatName, pEmail || String(pId) || chatName);

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
