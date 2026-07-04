"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Message, WEBSOCKET_EVENTS } from "@/lib/messagingApi";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4000";

interface UseMessagingSocketOptions {
  conversationId: string | null;
  onNewMessage?: (message: Message) => void;
  onTyping?: (data: { userId: number; isTyping: boolean }) => void;
}

export function useMessagingSocket({
  conversationId,
  onNewMessage,
  onTyping,
}: UseMessagingSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const prevConvRef = useRef<string | null>(null);

  // Connect socket once
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("riva_access_token") : null;
    if (!token) return;

    // The backend ChatGateway lives on the "/chat" namespace — connecting to the
    // default namespace means none of its handlers (auth/join/typing) ever run.
    const socket = io(`${WS_URL}/chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, []);

  // Join/leave conversation rooms
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;

    // Leave previous room
    if (prevConvRef.current && prevConvRef.current !== conversationId) {
      socket.emit(WEBSOCKET_EVENTS.CONVERSATION_LEAVE, {
        conversationId: prevConvRef.current,
      });
    }

    // Join new room
    if (conversationId) {
      socket.emit(WEBSOCKET_EVENTS.CONVERSATION_JOIN, { conversationId });
    }

    prevConvRef.current = conversationId;
  }, [conversationId, isConnected]);

  // Listen for incoming messages
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      onNewMessage?.(message);
    };

    socket.on(WEBSOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    return () => {
      socket.off(WEBSOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    };
  }, [onNewMessage]);

  // Listen for typing indicators.
  // Backend emits two separate events (no boolean flag): user:typing to start and
  // user:stopped:typing to stop. Map each onto the { userId, isTyping } shape the
  // consumer expects, deriving isTyping from which event fired.
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleTypingStart = (data: { userId: number }) => {
      onTyping?.({ userId: data.userId, isTyping: true });
    };
    const handleTypingStop = (data: { userId: number }) => {
      onTyping?.({ userId: data.userId, isTyping: false });
    };

    socket.on(WEBSOCKET_EVENTS.USER_TYPING, handleTypingStart);
    socket.on(WEBSOCKET_EVENTS.USER_STOPPED_TYPING, handleTypingStop);
    return () => {
      socket.off(WEBSOCKET_EVENTS.USER_TYPING, handleTypingStart);
      socket.off(WEBSOCKET_EVENTS.USER_STOPPED_TYPING, handleTypingStop);
    };
  }, [onTyping]);

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      const socket = socketRef.current;
      if (!socket || !conversationId) return;
      socket.emit(
        isTyping ? WEBSOCKET_EVENTS.TYPING_START : WEBSOCKET_EVENTS.TYPING_STOP,
        { conversationId }
      );
    },
    [conversationId]
  );

  return { isConnected, emitTyping };
}
