"use client";

import { createContext, useContext } from "react";
import { useSocket } from "../hooks/useSocket";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  // This hook (which we built earlier) automatically connects
  // when it detects a valid JWT token in Zustand.
  const socket = useSocket();

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

// Custom hook to easily grab the socket anywhere in your UI
export const useGlobalSocket = () => {
  return useContext(SocketContext);
};
