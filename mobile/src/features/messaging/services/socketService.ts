/**
 * IMOBI - WebSocket Service
 * Real-time messaging with Socket.IO
 */

import { io, Socket } from 'socket.io-client';
import ENV from '@/config/env';
import { IMessage } from '../api/messagingApi';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  /**
   * Connect to WebSocket server
   */
  connect(accessToken: string) {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    console.log('[WebSocket] Connecting to:', ENV.WS_URL);

    this.socket = io(ENV.WS_URL, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected successfully');
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
    });

    this.socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if socket is connected
   */
  getIsConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Join a conversation room
   */
  joinConversation(conversationId: number) {
    if (!this.socket) {
      console.warn('[WebSocket] Socket not initialized');
      return;
    }
    console.log('[WebSocket] Joining conversation:', conversationId);
    this.socket.emit('conversation:join', { conversationId });
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(conversationId: number) {
    if (!this.socket) return;
    console.log('[WebSocket] Leaving conversation:', conversationId);
    this.socket.emit('conversation:leave', { conversationId });
  }

  /**
   * Send message via WebSocket (faster than REST)
   */
  sendMessage(conversationId: number, content: string, type: string = 'TEXT') {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }
    this.socket.emit('message:send', {
      conversationId,
      content,
      type,
    });
  }

  /**
   * Send typing indicator
   */
  sendTypingStart(conversationId: number) {
    if (!this.socket) return;
    this.socket.emit('typing:start', { conversationId });
  }

  /**
   * Send typing stop indicator
   */
  sendTypingStop(conversationId: number) {
    if (!this.socket) return;
    this.socket.emit('typing:stop', { conversationId });
  }

  /**
   * Listen for new messages
   */
  onNewMessage(callback: (message: IMessage) => void) {
    if (!this.socket) {
      console.warn('[WebSocket] Socket not initialized');
      return;
    }
    this.socket.on('message:new', callback);
  }

  /**
   * Listen for new message notification (for list view)
   */
  onNewMessageNotification(
    callback: (data: { conversationId: number; message: any; preview: string }) => void
  ) {
    if (!this.socket) return;
    this.socket.on('new_message_notification', callback);
  }

  /**
   * Listen for message read
   */
  onMessageRead(
    callback: (data: { conversationId: number; messageIds: number[] }) => void
  ) {
    if (!this.socket) return;
    this.socket.on('message:read', callback);
  }

  /**
   * Listen for typing indicator
   */
  onUserTyping(
    callback: (data: { conversationId: number; userId: number }) => void
  ) {
    if (!this.socket) return;
    this.socket.on('user:typing', callback);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    if (!this.socket) return;
    this.socket.removeAllListeners();
  }

  /**
   * Remove specific listener
   */
  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }
}

// Singleton instance
export const socketService = new SocketService();
export default socketService;
