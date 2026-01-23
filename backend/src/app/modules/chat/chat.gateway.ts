/**
 * 💬 CHAT GATEWAY - WebSocket Real-time Messaging
 * 
 * Evenimente disponibile:
 * 
 * CLIENT -> SERVER:
 * - join_conversation: Se alătură unei conversații pentru a primi mesaje
 * - leave_conversation: Părăsește o conversație
 * - send_message: Trimite un mesaj
 * - typing_start: Notifică că utilizatorul scrie
 * - typing_stop: Notifică că utilizatorul a terminat de scris
 * - mark_read: Marchează mesajele ca citite
 * 
 * SERVER -> CLIENT:
 * - new_message: Mesaj nou primit
 * - message_sent: Confirmarea că mesajul a fost trimis
 * - user_typing: Un utilizator scrie
 * - user_stopped_typing: Un utilizator a terminat de scris
 * - messages_read: Mesaje marcate ca citite
 * - user_online: Un utilizator s-a conectat
 * - user_offline: Un utilizator s-a deconectat
 * - error: Eroare
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { jwtVerify } from 'jose';
import Redis from 'ioredis';
import { ChatService } from './chat.service';
import { User } from '../../db/entities/user.entity';
import { PushNotificationService } from '../../core/push/push.service';

// Types for WebSocket events
interface JoinConversationPayload {
  conversationId: number;
}

interface SendMessagePayload {
  conversationId: number;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'VIEWING_REQUEST';
  localId?: string; // For client-side message tracking
}

interface TypingPayload {
  conversationId: number;
}

interface MarkReadPayload {
  conversationId: number;
}

@WebSocketGateway({
  cors: {
    origin: '*', // În producție, restricționează la domeniul tău
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  
  // Map pentru tracking utilizatori conectați: socketId -> userId
  private connectedUsers: Map<string, number> = new Map();
  
  // Map pentru tracking utilizatori în conversații: conversationId -> Set<socketId>
  private conversationSockets: Map<number, Set<string>> = new Map();

  constructor(
    private readonly chatService: ChatService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly pushService: PushNotificationService,
  ) {}

  // ============================================================================
  // CONNECTION LIFECYCLE
  // ============================================================================

  /**
   * Handler pentru conexiune nouă
   * Autentifică utilizatorul prin JWT din query sau header
   */
  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Connection rejected - no token: ${client.id}`);
        client.emit('error', { code: 'AUTH_REQUIRED', message: 'Token de autentificare necesar' });
        client.disconnect();
        return;
      }

      const user = await this.verifyTokenAndGetUser(token);
      if (!user) {
        this.logger.warn(`Connection rejected - invalid token: ${client.id}`);
        client.emit('error', { code: 'AUTH_INVALID', message: 'Token invalid' });
        client.disconnect();
        return;
      }

      // Salvăm asocierea socket -> user
      this.connectedUsers.set(client.id, user.id);
      
      // Salvăm în Redis pentru tracking cross-instance
      await this.redisClient.sadd(`user:${user.id}:sockets`, client.id);
      await this.redisClient.set(`socket:${client.id}:user`, user.id.toString());

      // Join room personală pentru notificări directe
      client.join(`user:${user.id}`);

      // Notifică contactele că utilizatorul e online
      await this.broadcastUserStatus(user.id, 'online');

      this.logger.log(`✅ User ${user.id} (${user.email}) connected: ${client.id}`);
      
      // Trimite confirmarea conexiunii
      client.emit('connected', {
        userId: user.id,
        socketId: client.id,
      });

    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      this.logger.error(`Connection error: ${error.message}`);
      client.emit('error', { code: 'CONNECTION_ERROR', message: 'Eroare la conectare' });
      client.disconnect();
    }
  }

  /**
   * Handler pentru deconectare
   */
  async handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    
    if (userId) {
      // Elimină din toate conversațiile
      for (const [convId, sockets] of this.conversationSockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.conversationSockets.delete(convId);
        }
      }

      // Elimină din Redis
      await this.redisClient.srem(`user:${userId}:sockets`, client.id);
      await this.redisClient.del(`socket:${client.id}:user`);

      // Verifică dacă utilizatorul mai are alte conexiuni
      const remainingSockets = await this.redisClient.scard(`user:${userId}:sockets`);
      if (remainingSockets === 0) {
        // Utilizatorul e complet offline
        await this.broadcastUserStatus(userId, 'offline');
        this.logger.log(`👋 User ${userId} is now offline`);
      }

      this.connectedUsers.delete(client.id);
      this.logger.log(`User ${userId} disconnected: ${client.id}`);
    }
  }

  // ============================================================================
  // MESSAGE HANDLERS
  // ============================================================================

  /**
   * Join conversation - Alătură-te unei conversații pentru a primi mesaje
   */
  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinConversationPayload,
  ) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) {
      return { error: 'Not authenticated' };
    }

    try {
      // Verifică dacă utilizatorul are acces la conversație
      const conversation = await this.chatService.getConversation(userId, payload.conversationId);
      if (!conversation) {
        return { error: 'Conversation not found or access denied' };
      }

      // Join room conversație
      const roomName = `conversation:${payload.conversationId}`;
      client.join(roomName);

      // Track în memorie
      if (!this.conversationSockets.has(payload.conversationId)) {
        this.conversationSockets.set(payload.conversationId, new Set());
      }
      this.conversationSockets.get(payload.conversationId)!.add(client.id);

      this.logger.debug(`User ${userId} joined conversation ${payload.conversationId}`);

      return { success: true, conversationId: payload.conversationId };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      this.logger.error(`Join conversation error: ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * Leave conversation - Părăsește o conversație
   */
  @SubscribeMessage('conversation:leave')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinConversationPayload,
  ) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) {
      return { error: 'Not authenticated' };
    }

    const roomName = `conversation:${payload.conversationId}`;
    client.leave(roomName);

    // Remove din tracking
    const sockets = this.conversationSockets.get(payload.conversationId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.conversationSockets.delete(payload.conversationId);
      }
    }

    return { success: true };
  }

  /**
   * Send message - Trimite un mesaj în conversație
   */
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) {
      return { error: 'Not authenticated' };
    }

    try {
      // Salvează mesajul în baza de date
      const message = await this.chatService.sendMessage(
        userId,
        payload.conversationId,
        payload.content,
        payload.type || 'TEXT',
      );

      // Broadcast către toți din conversație
      const roomName = `conversation:${payload.conversationId}`;
      
      // Emit 'message:new' instead of 'new_message' to match frontend listener
      this.server.to(roomName).emit('message:new', message);

      // Confirmă sender-ului
      client.emit('message:sent', {
        localId: payload.localId, // pentru matching pe client
        message,
      });

      // Notifică destinatarul dacă nu e în conversație
      await this.notifyOfflineRecipient(userId, payload.conversationId, message);

      return { success: true, message };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      this.logger.error(`Send message error: ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * Typing start - Notifică că utilizatorul scrie
   */
  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) return;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'firstName', 'avatar'],
    });

    const roomName = `conversation:${payload.conversationId}`;
    client.to(roomName).emit('user:typing', {
      conversationId: payload.conversationId,
      userId,
      userName: user?.firstName || 'User',
      avatar: user?.avatar,
    });
  }

  /**
   * Typing stop - Notifică că utilizatorul a terminat de scris
   */
  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) return;

    const roomName = `conversation:${payload.conversationId}`;
    client.to(roomName).emit('user:stopped:typing', {
      conversationId: payload.conversationId,
      userId,
    });
  }

  /**
   * Mark read - Marchează mesajele ca citite
   */
  @SubscribeMessage('message:read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MarkReadPayload,
  ) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) {
      return { error: 'Not authenticated' };
    }

    try {
      await this.chatService.markAsRead(userId, payload.conversationId);

      // Notifică ceilalți din conversație
      const roomName = `conversation:${payload.conversationId}`;
      client.to(roomName).emit('message:read_receipt', {
        conversationId: payload.conversationId,
        readBy: userId,
        readAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      this.logger.error(`Mark read error: ${error.message}`);
      return { error: error.message };
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Extrage token-ul JWT din handshake
   */
  private extractToken(client: Socket): string | null {
    // Din query string: ?token=xxx
    const queryToken = client.handshake.query?.token as string;
    if (queryToken) return queryToken;

    // Din auth payload (socket.io client auth)
    const authToken = (client.handshake.auth as any)?.token;
    if (authToken) return authToken;

    // Din header Authorization: Bearer xxx
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * Verifică token-ul și returnează utilizatorul
   */
  private async verifyTokenAndGetUser(token: string): Promise<User | null> {
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'default-secret-change-in-production'
      );

      const { payload } = await jwtVerify(token, secret, {
        audience: 'domaris',
      });

      if (!payload.sub) return null;

      const user = await User.findByPk(parseInt(payload.sub as string));
      return user;
    } catch {
      return null;
    }
  }

  /**
   * Broadcast status utilizator către contactele sale
   */
  private async broadcastUserStatus(userId: number, status: 'online' | 'offline') {
    // Găsește toate conversațiile utilizatorului
    const result = await this.chatService.getUserConversations(userId, { limit: 100 });
    
    // Notifică fiecare partener de conversație
    for (const conv of result.data || []) {
      const partnerId = conv.otherParticipant?.id;
      if (partnerId) {
        this.server.to(`user:${partnerId}`).emit(status === 'online' ? 'user_online' : 'user_offline', {
          userId,
        });
      }
    }
  }

  /**
   * Notifică destinatarul despre mesaj nou
   */
  private async notifyOfflineRecipient(
    senderId: number,
    conversationId: number,
    message: { content?: string },
  ) {
    // Găsește conversația pentru a identifica destinatarul
    const conversation = await this.chatService.getConversation(senderId, conversationId);
    if (!conversation) return;

    const recipientId = conversation.otherParticipant?.id;
    if (!recipientId) return;

    // Trimite notificare în room-ul personal al utilizatorului
    // (în caz că e conectat dar nu e în conversația respectivă)
    this.server.to(`user:${recipientId}`).emit('new_message_notification', {
      conversationId,
      message,
      preview: message.content?.substring(0, 100),
    });

    // Verifică dacă destinatarul e în conversația respectivă (vede mesajele în timp real)
    const conversationSockets = this.conversationSockets.get(conversationId);
    const recipientSocketIds = await this.redisClient.smembers(`user:${recipientId}:sockets`);
    const isInConversation = recipientSocketIds.some(socketId => conversationSockets?.has(socketId));

    // Dacă destinatarul NU e în conversația respectivă, creăm notificare în baza de date
    if (!isInConversation) {
      const sender = await User.findByPk(senderId, {
        attributes: ['firstName', 'lastName'],
      });
      
      const senderName = sender 
        ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Utilizator'
        : 'Utilizator';

      // Verifică dacă destinatarul e conectat la WebSocket
      const isOnline = await this.isUserOnline(recipientId);

      // notifyNewMessage salvează în DB și trimite push doar dacă user e offline
      await this.pushService.notifyNewMessage(
        recipientId,
        senderName,
        message.content || 'Ai primit un mesaj nou',
        conversationId,
        conversation.property?.id,
      );
    }
  }

  // ============================================================================
  // PUBLIC METHODS (for use from other services)
  // ============================================================================

  /**
   * Trimite un mesaj către o conversație specifică
   * Folosit de alte servicii pentru notificări
   */
  async sendToConversation(conversationId: number, event: string, data: unknown) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  /**
   * Trimite un mesaj direct către un utilizator
   */
  async sendToUser(userId: number, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Verifică dacă un utilizator e online
   */
  async isUserOnline(userId: number): Promise<boolean> {
    const socketsCount = await this.redisClient.scard(`user:${userId}:sockets`);
    return socketsCount > 0;
  }
}
