import { useEffect, useRef } from "react";

export const useChatScroll = (dependency) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      // Instantly snaps to the bottom of the scrollable container
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;

      // Note: If you prefer a smooth gliding animation, you can change the above line to:
      // scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [dependency]);

  return scrollRef;
};
