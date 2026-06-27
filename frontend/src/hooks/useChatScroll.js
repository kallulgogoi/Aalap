import { useEffect, useRef, useState, useLayoutEffect } from "react";

export const useChatScroll = (messages, activeChatId, onLoadMore) => {
  const scrollRef = useRef(null);
  const snapshotRef = useRef({
    chatId: null,
    count: 0,
    lastId: null,
    scrollHeight: 0,
  });
  const [isNearTop, setIsNearTop] = useState(false);

  // Handle maintaining scroll position when older messages are prepended
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const count = messages?.length || 0;
    const lastMessage = count > 0 ? messages[count - 1] : null;
    const lastId = lastMessage?._id ? String(lastMessage._id) : null;
    const previous = snapshotRef.current;

    const chatChanged = activeChatId !== previous.chatId;
    const isNewMessageAtBottom =
      activeChatId === previous.chatId && 
      count > previous.count && 
      lastId !== previous.lastId;

    if (chatChanged || isNewMessageAtBottom) {
      // Scroll to bottom on new chat or new message
      container.scrollTop = container.scrollHeight;
    } else if (
      activeChatId === previous.chatId && 
      count > previous.count && 
      lastId === previous.lastId
    ) {
      // Older messages were prepended (infinite scroll)
      // Adjust scroll position to maintain view
      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - previous.scrollHeight;
      container.scrollTop += heightDifference;
    }

    snapshotRef.current = {
      chatId: activeChatId,
      count,
      lastId,
      scrollHeight: container.scrollHeight,
    };
  }, [messages, activeChatId]);

  // Handle scroll events to detect top
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Detect if we are close to the top (e.g., within 50px)
      if (container.scrollTop < 50) {
        if (!isNearTop) {
          setIsNearTop(true);
          if (onLoadMore) {
            onLoadMore();
          }
        }
      } else {
        if (isNearTop) {
          setIsNearTop(false);
        }
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [onLoadMore, isNearTop]);

  return scrollRef;
};
