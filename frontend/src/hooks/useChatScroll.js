import { useEffect, useRef } from "react";

export const useChatScroll = (messages, activeChatId) => {
  const scrollRef = useRef(null);
  const snapshotRef = useRef({
    chatId: null,
    count: 0,
    lastId: null,
  });

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const count = messages?.length || 0;
    const lastMessage = count > 0 ? messages[count - 1] : null;
    const lastId = lastMessage?._id ? String(lastMessage._id) : null;
    const previous = snapshotRef.current;

    const chatChanged = activeChatId !== previous.chatId;
    const messageAdded =
      activeChatId === previous.chatId && count > previous.count;

    if (chatChanged || messageAdded) {
      container.scrollTop = container.scrollHeight;
    }

    snapshotRef.current = {
      chatId: activeChatId,
      count,
      lastId,
    };
  }, [messages, activeChatId]);

  return scrollRef;
};
