"use client";

import { createContext, useContext } from "react";
import { useSocket } from "../hooks/useSocket";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socket = useSocket();

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useGlobalSocket = () => {
  return useContext(SocketContext);
};
