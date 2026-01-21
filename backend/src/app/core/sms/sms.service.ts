/**
 * 📱 SMS SERVICE - Serviciu pentru trimitere SMS
 * 
 * Suportă multiple provideri:
 * - console: Pentru development (log în terminal)
 * - twilio: Pentru producție cu Twilio
 * 
 * Configurare prin variabile de mediu:
 * - SMS_PROVIDER: console | twilio
 * - TWILIO_ACCOUNT_SID: Account SID pentru Twilio
 * - TWILIO_AUTH_TOKEN: Auth token pentru Twilio
 * - TWILIO_PHONE_NUMBER: Număr de telefon Twilio
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsOptions {
  to: string;
  message: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly provider: string;
  private readonly fromPhone: string;

  constructor(private readonly configService: ConfigService) {
    this.provider = configService.get<string>('SMS_PROVIDER') || 'console';
    this.fromPhone = configService.get<string>('TWILIO_PHONE_NUMBER') || '+40700000000';
  }

  /**
   * Trimite un SMS
   */
  async send(options: SmsOptions): Promise<boolean> {
    // Normalize phone number
    const phone = this.normalizePhoneNumber(options.to);

    try {
      switch (this.provider) {
        case 'twilio':
          return await this.sendWithTwilio(phone, options.message);
        case 'console':
        default:
          return await this.sendWithConsole(phone, options.message);
      }
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}:`, error);
      return false;
    }
  }

  // ============================================================================
  // TEMPLATE SMS
  // ============================================================================

  /**
   * Trimite cod OTP
   */
  async sendOtpCode(phone: string, code: string): Promise<boolean> {
    return this.send({
      to: phone,
      message: `Codul tău Domaris este: ${code}. Expiră în 10 minute. Nu-l împărtăși cu nimeni.`,
    });
  }

  /**
   * Trimite cod de verificare telefon
   */
  async sendVerificationCode(phone: string, code: string): Promise<boolean> {
    return this.send({
      to: phone,
      message: `Codul tău de verificare Domaris: ${code}. Valabil 10 minute.`,
    });
  }

  /**
   * Trimite notificare vizionare
   */
  async sendViewingReminder(
    phone: string,
    propertyAddress: string,
    dateTime: string,
  ): Promise<boolean> {
    return this.send({
      to: phone,
      message: `Reminder: Ai o vizionare la ${propertyAddress}, ${dateTime}. - Domaris`,
    });
  }

  /**
   * Trimite notificare schimbare status vizionare
   */
  async sendViewingStatusChange(
    phone: string,
    status: 'confirmed' | 'cancelled' | 'rescheduled',
    propertyTitle: string,
  ): Promise<boolean> {
    const statusMessages = {
      confirmed: `✅ Vizionarea ta pentru "${propertyTitle}" a fost confirmată!`,
      cancelled: `❌ Vizionarea pentru "${propertyTitle}" a fost anulată.`,
      rescheduled: `📅 Vizionarea pentru "${propertyTitle}" a fost reprogramată. Verifică detaliile în app.`,
    };

    return this.send({
      to: phone,
      message: `${statusMessages[status]} - Domaris`,
    });
  }

  // ============================================================================
  // PROVIDERS
  // ============================================================================

  private async sendWithConsole(phone: string, message: string): Promise<boolean> {
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log('📱 SMS (Console Provider - Development)');
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log(`To: ${phone}`);
    this.logger.log(`From: ${this.fromPhone}`);
    this.logger.log('─────────────────────────────────────────────────────');
    this.logger.log(`Message: ${message}`);
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return true;
  }

  private async sendWithTwilio(phone: string, message: string): Promise<boolean> {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      this.logger.error('Twilio credentials not configured');
      return false;
    }

    // Dynamic import to avoid bundling issues
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);

    await client.messages.create({
      body: message,
      from: fromNumber,
      to: phone,
    });

    this.logger.log(`✅ SMS sent to ${phone} via Twilio`);
    return true;
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Normalizează numărul de telefon la format internațional
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-numeric characters except +
    let normalized = phone.replace(/[^\d+]/g, '');

    // If starts with 0, assume Romania and replace with +40
    if (normalized.startsWith('0') && !normalized.startsWith('00')) {
      normalized = '+40' + normalized.substring(1);
    }

    // If starts with 40 without +, add +
    if (normalized.startsWith('40') && !normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }

    // If no country code, assume Romania
    if (!normalized.startsWith('+')) {
      normalized = '+40' + normalized;
    }

    return normalized;
  }
}
