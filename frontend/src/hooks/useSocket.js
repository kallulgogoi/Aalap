import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { useAudio } from "./useAudio";

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const token = useAuthStore((state) => state.token);
  const addLiveMessage = useChatStore((state) => state.addLiveMessage);
  const updateUserPresence = useChatStore((state) => state.updateUserPresence);
  const markMessagesAsRead = useChatStore((state) => state.markMessagesAsRead);
  const resolvePendingInvite = useChatStore(
    (state) => state.resolvePendingInvite,
  );
  const updateParticipantProfile = useChatStore(
    (state) => state.updateParticipantProfile,
  );
  const { playNotification } = useAudio();

  useEffect(() => {
    // Prevent connection if the user is not logged in
    if (!token) return;

    const socketInstance = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
      {
        auth: { token },
        reconnection: true,
      },
    );

    socketInstance.on("connect", () => {
      console.log("Real-time Socket connected:", socketInstance.id);
    });

    // Central listener for all incoming messages
    socketInstance.on("receive_message", (newMessage) => {
      // Play chime if sender is not the current user
      const currentUser = useAuthStore.getState().user;
      const senderIdStr =
        typeof newMessage.senderId === "object" && newMessage.senderId !== null
          ? newMessage.senderId._id
          : newMessage.senderId;

      if (senderIdStr !== currentUser?.id && senderIdStr !== currentUser?._id) {
        playNotification();
      }

      // Instantly push the message into the Zustand store to update the UI
      addLiveMessage(newMessage);
    });

    // Presence update listener
    socketInstance.on("user_presence_change", ({ userId, status }) => {
      updateUserPresence(userId, status === "online");
    });

    // Read receipt update listener
    socketInstance.on("receipts_updated", ({ chatId, readBy }) => {
      markMessagesAsRead(chatId, readBy);
    });

    socketInstance.on("shadow_resolved", (payload) => {
      resolvePendingInvite(payload);
    });

    socketInstance.on("profile_updated", (payload) => {
      const currentUser = useAuthStore.getState().user;
      const myId = String(currentUser?.id || currentUser?._id || "");

      if (String(payload.userId) === myId) {
        useAuthStore.getState().updateUser({
          username: payload.username,
          bio: payload.bio,
          profilePic: payload.profilePic,
        });
      }

      updateParticipantProfile(payload);
    });

    setSocket(socketInstance);

    // Disconnects the socket when the user logs out or closes the app
    return () => {
      socketInstance.disconnect();
    };
  }, [
    token,
    addLiveMessage,
    updateUserPresence,
    markMessagesAsRead,
    resolvePendingInvite,
    updateParticipantProfile,
    playNotification,
  ]);

  return socket;
};
