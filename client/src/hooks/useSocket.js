import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useSocket() {
  const socketRef = useRef(null);

  if (!socketRef.current) {
    socketRef.current = io();
  }

  useEffect(() => {
    return () => {
      socketRef.current.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socketRef.current;
}
