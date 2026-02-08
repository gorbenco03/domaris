/**
 * 🔔 PUSH NOTIFICATION SERVICE - FCM & APNs
 * 
 * Serviciu pentru trimitere notificări push către dispozitive mobile.
 * 
 * Suportă multiple provideri:
 * - console: Pentru development (log în terminal)
 * - firebase: Pentru producție cu Firebase Cloud Messaging (Android + iOS)
 * - expo: Pentru Expo Push (token Expo)
 * 
 * Configurare prin variabile de mediu:
 * - PUSH_PROVIDER: console | firebase | expo
 * - EXPO_ACCESS_TOKEN: Optional, for Expo push API auth
 * - FIREBASE_PROJECT_ID: Project ID Firebase
 * - FIREBASE_CLIENT_EMAIL: Service account email
 * - FIREBASE_PRIVATE_KEY: Private key (base64 encoded)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Device } from '../../db/entities/device.entity';
import { Notification } from '../../db/entities/notification.entity';

// Notification payload types
export interface PushNotificationPayload {
  title: string;
  body: string;
  subtitle?: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
  imageUrl?: string;
}

export interface SendToUserOptions {
  userId: number;
  notification: PushNotificationPayload;
  saveToDatabase?: boolean;
  type?: string;
}

export interface SendToDeviceOptions {
  token: string;
  platform: 'ios' | 'android' | 'web';
  notification: PushNotificationPayload;
}

// Notification type constants
export const NotificationTypes = {
  NEW_MESSAGE: 'new_message',
  VIEWING_REQUEST: 'viewing_request',
  VIEWING_CONFIRMED: 'viewing_confirmed',
  VIEWING_CANCELLED: 'viewing_cancelled',
  VIEWING_REMINDER: 'viewing_reminder',
  PROPERTY_INQUIRY: 'property_inquiry',
  VERIFICATION_APPROVED: 'verification_approved',
  VERIFICATION_REJECTED: 'verification_rejected',
  PROPERTY_FAVORITED: 'property_favorited',
  FAVORITE_PRICE_CHANGE: 'price_change',
  SYSTEM: 'system',
} as const;

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly provider: string;
  private firebaseApp: FirebaseAdmin | null = null;

  constructor(private readonly configService: ConfigService) {
    this.provider = configService.get<string>('PUSH_PROVIDER') || 'console';
    
    if (this.provider === 'firebase') {
      this.initializeFirebase();
    }
  }

  // ============================================================================
  // MAIN METHODS
  // ============================================================================

  /**
   * Trimite notificare către un utilizator (toate dispozitivele sale)
   */
  async sendToUser(options: SendToUserOptions): Promise<boolean> {
    const { userId, notification, saveToDatabase = true, type = NotificationTypes.SYSTEM } = options;

    try {
      this.logger.debug(`🔔 Push sendToUser: user=${userId} type=${type}`);
      // Salvează notificarea în baza de date ÎNTÂI (pentru Notification Center)
      if (saveToDatabase) {
        await Notification.create({
          userId,
          title: notification.title,
          body: notification.body,
          type,
          metadata: notification.data || {},
          isRead: false,
        });
        this.logger.log(`📬 Notification saved to DB for user ${userId}: ${notification.title}`);
      }

      // Găsește toate dispozitivele utilizatorului pentru push
      const devices = await Device.findAll({
        where: { userId },
      });

      this.logger.debug(`📱 Devices for user ${userId}: ${devices.length}`);

      if (devices.length === 0) {
        this.logger.debug(`No devices registered for user ${userId} - skipping push`);
        return saveToDatabase; // Return true if we saved to DB
      }

      // Trimite către fiecare dispozitiv
      const results = await Promise.allSettled(
        devices.map(device =>
          this.sendToDevice({
            token: device.token,
            platform: device.platform,
            notification,
          })
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
      this.logger.log(`Push sent to ${successCount}/${devices.length} devices for user ${userId}`);

      return successCount > 0 || saveToDatabase;
    } catch (error) {
      this.logger.error(`Failed to send push to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Trimite notificare către un dispozitiv specific
   */
  async sendToDevice(options: SendToDeviceOptions): Promise<boolean> {
    try {
      this.logger.debug(`📨 sendToDevice provider=${this.provider} token=${options.token}`);
      switch (this.provider) {
        case 'firebase':
          return await this.sendWithFirebase(options);
        case 'expo':
          return await this.sendWithExpo(options);
        case 'console':
        default:
          return await this.sendWithConsole(options);
      }
    } catch (error) {
      this.logger.error(`Failed to send push to device:`, error);
      return false;
    }
  }

  /**
   * Trimite notificare către mai mulți utilizatori
   */
  async sendToUsers(userIds: number[], notification: PushNotificationPayload, type?: string): Promise<number> {
    const results = await Promise.allSettled(
      userIds.map(userId =>
        this.sendToUser({ userId, notification, type })
      )
    );

    return results.filter(r => r.status === 'fulfilled' && r.value).length;
  }

  // ============================================================================
  // TEMPLATE NOTIFICATIONS
  // ============================================================================

  /**
   * Notificare: Mesaj nou în chat
   */
  async notifyNewMessage(
    recipientId: number,
    senderName: string,
    messagePreview: string,
    conversationId: number,
    propertyId?: number,
  ): Promise<boolean> {
    return this.sendToUser({
      userId: recipientId,
      type: NotificationTypes.NEW_MESSAGE,
      saveToDatabase: true, // Persist in database so it shows in Notification Center history
      notification: {
        title: `Mesaj de la ${senderName}`,
        body: messagePreview.length > 100 ? messagePreview.substring(0, 97) + '...' : messagePreview,
        data: {
          type: NotificationTypes.NEW_MESSAGE,
          conversationId: String(conversationId),
          ...(propertyId && { propertyId: String(propertyId) }),
        },
        sound: 'message.wav',
      },
    });
  }

  /**
   * Notificare: Cerere vizionare nouă (către proprietar)
   */
  async notifyViewingRequest(
    ownerId: number,
    requesterName: string,
    propertyTitle: string,
    viewingId: number,
    proposedDate: string,
  ): Promise<boolean> {
    return this.sendToUser({
      userId: ownerId,
      type: NotificationTypes.VIEWING_REQUEST,
      notification: {
        title: '📅 Cerere vizionare nouă',
        body: `${requesterName} dorește să vizioneze "${propertyTitle}" pe ${proposedDate}`,
        data: {
          type: NotificationTypes.VIEWING_REQUEST,
          viewingId: String(viewingId),
        },
        sound: 'notification.wav',
      },
    });
  }

  /**
   * Notificare: Vizionare confirmată
   */
  async notifyViewingConfirmed(
    seekerId: number,
    propertyTitle: string,
    viewingId: number,
    confirmedDate: string,
  ): Promise<boolean> {
    return this.sendToUser({
      userId: seekerId,
      type: NotificationTypes.VIEWING_CONFIRMED,
      notification: {
        title: '✅ Vizionare confirmată!',
        body: `Vizionarea pentru "${propertyTitle}" a fost confirmată pentru ${confirmedDate}`,
        data: {
          type: NotificationTypes.VIEWING_CONFIRMED,
          viewingId: String(viewingId),
        },
        sound: 'success.wav',
      },
    });
  }

  /**
   * Notificare: Vizionare anulată
   */
  async notifyViewingCancelled(
    userId: number,
    propertyTitle: string,
    viewingId: number,
    reason?: string,
  ): Promise<boolean> {
    return this.sendToUser({
      userId,
      type: NotificationTypes.VIEWING_CANCELLED,
      notification: {
        title: '❌ Vizionare anulată',
        body: reason 
          ? `Vizionarea pentru "${propertyTitle}" a fost anulată: ${reason}`
          : `Vizionarea pentru "${propertyTitle}" a fost anulată`,
        data: {
          type: NotificationTypes.VIEWING_CANCELLED,
          viewingId: String(viewingId),
        },
      },
    });
  }

  /**
   * Notificare: Reminder vizionare (1 oră înainte)
   */
  async notifyViewingReminder(
    userId: number,
    propertyTitle: string,
    propertyAddress: string,
    viewingId: number,
    time: string,
  ): Promise<boolean> {
    return this.sendToUser({
      userId,
      type: NotificationTypes.VIEWING_REMINDER,
      notification: {
        title: '⏰ Reminder: Vizionare în 1 oră',
        body: `"${propertyTitle}" la ${propertyAddress}, ora ${time}`,
        data: {
          type: NotificationTypes.VIEWING_REMINDER,
          viewingId: String(viewingId),
        },
        sound: 'reminder.wav',
      },
    });
  }

  /**
   * Notificare: Verificare aprobată
   */
  async notifyVerificationApproved(
    userId: number,
    level: number,
  ): Promise<boolean> {
    const levelDescriptions: Record<number, string> = {
      1: 'Email/Telefon verificat - Acum poți contacta proprietari!',
      2: 'Identitate verificată - Acum poți posta anunțuri!',
      3: 'Proprietar verificat - Ai primit badge-ul de încredere!',
    };

    return this.sendToUser({
      userId,
      type: NotificationTypes.VERIFICATION_APPROVED,
      notification: {
        title: '🎉 Verificare aprobată!',
        body: levelDescriptions[level] || 'Contul tău a fost verificat.',
        data: {
          type: NotificationTypes.VERIFICATION_APPROVED,
          level: String(level),
        },
        sound: 'success.wav',
      },
    });
  }

  /**
   * Notificare: Proprietate adăugată la favorite
   */
  async notifyPropertyFavorited(
    ownerId: number,
    propertyTitle: string,
    propertyId: number,
    favoritesCount: number,
  ): Promise<boolean> {
    return this.sendToUser({
      userId: ownerId,
      type: NotificationTypes.PROPERTY_FAVORITED,
      saveToDatabase: favoritesCount % 5 === 0, // Salvează doar la fiecare 5 favorite
      notification: {
        title: '❤️ Cineva a salvat proprietatea ta',
        body: `"${propertyTitle}" a fost salvată în favorite (${favoritesCount} în total)`,
        data: {
          type: NotificationTypes.PROPERTY_FAVORITED,
          propertyId: String(propertyId),
        },
      },
    });
  }

  /**
   * Notificare: Prețul unei proprietăți favorite s-a schimbat
   */
  async notifyFavoritePriceChange(
    userId: number,
    propertyTitle: string,
    propertyId: number,
    oldPrice: number,
    newPrice: number,
    currency: string,
    imageUrl?: string,
  ): Promise<boolean> {
    const isPriceDrop = newPrice < oldPrice;
    const direction = isPriceDrop ? 'scăzut' : 'crescut';
    const arrow = isPriceDrop ? '↓' : '↑';
    const percent = Math.round(Math.abs((newPrice - oldPrice) / oldPrice) * 100);

    return this.sendToUser({
      userId,
      type: NotificationTypes.FAVORITE_PRICE_CHANGE,
      notification: {
        title: `${arrow} Preț ${direction} cu ${percent}%`,
        subtitle: propertyTitle,
        body: `${oldPrice.toLocaleString()} ${currency} → ${newPrice.toLocaleString()} ${currency}`,
        data: {
          type: NotificationTypes.FAVORITE_PRICE_CHANGE,
          propertyId: String(propertyId),
          oldPrice: String(oldPrice),
          newPrice: String(newPrice),
          currency,
        },
        sound: 'notification.wav',
        ...(imageUrl && { imageUrl }),
      },
    });
  }

  // ============================================================================
  // PROVIDERS
  // ============================================================================

  private async sendWithConsole(options: SendToDeviceOptions): Promise<boolean> {
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log('🔔 PUSH NOTIFICATION (Console Provider - Development)');
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log(`Platform: ${options.platform}`);
    this.logger.log(`Token: ${options.token.substring(0, 20)}...`);
    this.logger.log('─────────────────────────────────────────────────────');
    this.logger.log(`Title: ${options.notification.title}`);
    this.logger.log(`Body: ${options.notification.body}`);
    if (options.notification.data) {
      this.logger.log(`Data: ${JSON.stringify(options.notification.data)}`);
    }
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return true;
  }

  private async sendWithFirebase(options: SendToDeviceOptions): Promise<boolean> {
    if (!this.firebaseApp) {
      this.logger.error('Firebase not initialized');
      return false;
    }

    const message: FirebaseMessage = {
      token: options.token,
      notification: {
        title: options.notification.title,
        body: options.notification.body,
        ...(options.notification.imageUrl && { imageUrl: options.notification.imageUrl }),
      },
      data: options.notification.data || {},
    };

    // Platform-specific configuration
    if (options.platform === 'ios') {
      const aps: any = {
        badge: options.notification.badge,
        sound: options.notification.sound || 'default',
        'mutable-content': 1,
      };

      // Only add alert object when subtitle is present, otherwise let Firebase handle title/body
      if (options.notification.subtitle) {
        aps.alert = { subtitle: options.notification.subtitle };
      }

      message.apns = { payload: { aps } };
    } else if (options.platform === 'android') {
      message.android = {
        priority: 'high',
        notification: {
          sound: options.notification.sound || 'default',
          channelId: 'domaris_default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          ...(options.notification.imageUrl && { imageUrl: options.notification.imageUrl }),
        },
      };
    }

    try {
      const response = await this.firebaseApp.messaging().send(message);
      this.logger.log(`✅ Push sent via Firebase: ${response}`);
      return true;
    } catch (error: unknown) {
      const err = error as { code?: string };
      // Handle invalid tokens
      if (err.code === 'messaging/registration-token-not-registered' ||
          err.code === 'messaging/invalid-registration-token') {
        this.logger.warn(`Invalid token, should be removed: ${options.token.substring(0, 20)}...`);
        await this.removeInvalidToken(options.token);
      }
      throw error;
    }
  }

  private async sendWithExpo(options: SendToDeviceOptions): Promise<boolean> {
    const accessToken = this.configService.get<string>('EXPO_ACCESS_TOKEN');
    const payload: Record<string, any> = {
      to: options.token,
      title: options.notification.title,
      body: options.notification.body,
      data: options.notification.data || {},
      sound: options.notification.sound || 'default',
      ...(options.notification.subtitle && { subtitle: options.notification.subtitle }),
      ...(options.notification.imageUrl && { mutableContent: true }),
    };

    const response = await fetch('https://api.expo.dev/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      this.logger.warn(`Expo push failed with HTTP ${response.status}`);
      return false;
    }

    const result = (await response.json()) as {
      data?: { status?: string; message?: string; details?: Record<string, unknown> };
    };

    if (result.data?.status === 'error') {
      this.logger.warn(`Expo push error: ${result.data.message || 'unknown'}`);
      return false;
    }

    return true;
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private async initializeFirebase(): Promise<void> {
    try {
      const admin = await import('firebase-admin');
      
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKeyBase64 = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

      if (!projectId || !clientEmail || !privateKeyBase64) {
        this.logger.error('Firebase credentials not configured');
        return;
      }

      // Decode private key from base64
      const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');

      this.firebaseApp = admin.default.initializeApp({
        credential: admin.default.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      }) as FirebaseAdmin;

      this.logger.log('✅ Firebase initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase:', error);
    }
  }

  private async removeInvalidToken(token: string): Promise<void> {
    try {
      await Device.destroy({ where: { token } });
      this.logger.log(`Removed invalid device token`);
    } catch (error) {
      this.logger.error('Failed to remove invalid token:', error);
    }
  }

  /**
   * Actualizează badge-ul pentru un utilizator (iOS)
   */
  async updateBadge(userId: number, count: number): Promise<void> {
    const devices = await Device.findAll({
      where: { userId, platform: 'ios' },
    });

    for (const device of devices) {
      await this.sendToDevice({
        token: device.token,
        platform: 'ios',
        notification: {
          title: '',
          body: '',
          badge: count,
        },
      });
    }
  }
}

// Firebase Admin types (minimal)
interface FirebaseAdmin {
  messaging(): {
    send(message: FirebaseMessage): Promise<string>;
  };
}

interface FirebaseMessage {
  token: string;
  notification?: {
    title?: string;
    body?: string;
    imageUrl?: string;
  };
  data?: Record<string, string>;
  apns?: {
    payload: {
      aps: {
        badge?: number;
        sound?: string;
        'mutable-content'?: number;
      };
    };
  };
  android?: {
    priority?: string;
    notification?: {
      sound?: string;
      channelId?: string;
      clickAction?: string;
    };
  };
}
