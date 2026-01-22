/**
 * 📧 EMAIL SERVICE - Serviciu pentru trimitere emailuri
 * 
 * Suportă multiple provideri:
 * - console: Pentru development (log în terminal)
 * - sendgrid: Pentru producție cu SendGrid
 * - ses: Pentru producție cu AWS SES
 * 
 * Configurare prin variabile de mediu:
 * - EMAIL_PROVIDER: console | sendgrid | ses
 * - SENDGRID_API_KEY: API key pentru SendGrid
 * - AWS_SES_REGION: Regiune AWS pentru SES
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailTemplate {
  name: string;
  data: Record<string, any>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly provider: string;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    this.provider = configService.get<string>('EMAIL_PROVIDER') || 'console';
    this.fromEmail = configService.get<string>('EMAIL_FROM') || 'noreply@domaris.ro';
    this.fromName = configService.get<string>('EMAIL_FROM_NAME') || 'Domaris';
  }

  /**
   * Trimite un email
   */
  async send(options: EmailOptions): Promise<boolean> {
    const emailData = {
      ...options,
      from: options.from || `${this.fromName} <${this.fromEmail}>`,
    };

    try {
      switch (this.provider) {
        case 'sendgrid':
          return await this.sendWithSendGrid(emailData);
        case 'ses':
          return await this.sendWithSES(emailData);
        case 'console':
        default:
          return await this.sendWithConsole(emailData);
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  // ============================================================================
  // TEMPLATE EMAILS
  // ============================================================================

  /**
   * Trimite cod de verificare email
   */
  async sendVerificationCode(email: string, code: string, userName?: string): Promise<boolean> {
    return this.send({
      to: email,
      subject: 'Cod de verificare - Domaris',
      html: this.getVerificationCodeTemplate(code, userName),
      text: `Codul tău de verificare este: ${code}. Acesta expiră în 10 minute.`,
    });
  }

  /**
   * Trimite cod de resetare parolă
   */
  async sendPasswordResetCode(email: string, code: string, userName?: string): Promise<boolean> {
    return this.send({
      to: email,
      subject: 'Resetare parolă - Domaris',
      html: this.getPasswordResetTemplate(code, userName),
      text: `Codul tău de resetare a parolei este: ${code}. Acesta expiră în 10 minute.`,
    });
  }

  /**
   * Trimite email de bun venit
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    return this.send({
      to: email,
      subject: 'Bun venit pe Domaris! 🏠',
      html: this.getWelcomeTemplate(userName),
      text: `Bun venit pe Domaris, ${userName}! Contul tău a fost creat cu succes.`,
    });
  }

  /**
   * Trimite notificare de mesaj nou
   */
  async sendNewMessageNotification(
    email: string,
    senderName: string,
    propertyTitle: string,
    messagePreview: string,
  ): Promise<boolean> {
    return this.send({
      to: email,
      subject: `Mesaj nou de la ${senderName} - Domaris`,
      html: this.getNewMessageTemplate(senderName, propertyTitle, messagePreview),
      text: `Ai primit un mesaj nou de la ${senderName} pentru proprietatea "${propertyTitle}": ${messagePreview}`,
    });
  }

  /**
   * Trimite notificare de vizionare nouă
   */
  async sendViewingRequestNotification(
    email: string,
    requesterName: string,
    propertyTitle: string,
    proposedDate: string,
  ): Promise<boolean> {
    return this.send({
      to: email,
      subject: `Cerere vizionare de la ${requesterName} - Domaris`,
      html: this.getViewingRequestTemplate(requesterName, propertyTitle, proposedDate),
      text: `${requesterName} dorește să vizioneze proprietatea "${propertyTitle}" pe ${proposedDate}.`,
    });
  }

  // ============================================================================
  // PROVIDERS
  // ============================================================================

  private async sendWithConsole(options: EmailOptions): Promise<boolean> {
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log('📧 EMAIL (Console Provider - Development)');
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log(`To: ${options.to}`);
    this.logger.log(`From: ${options.from}`);
    this.logger.log(`Subject: ${options.subject}`);
    this.logger.log('─────────────────────────────────────────────────────');
    if (options.text) {
      this.logger.log(`Text: ${options.text}`);
    }
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return true;
  }

  private async sendWithSendGrid(options: EmailOptions): Promise<boolean> {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!apiKey) {
      this.logger.error('SENDGRID_API_KEY not configured');
      return false;
    }

    // Dynamic import to avoid bundling issues
    const sgMail = await import('@sendgrid/mail');
    sgMail.default.setApiKey(apiKey);

    await sgMail.default.send({
      to: options.to,
      from: options.from || this.fromEmail || '',
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    this.logger.log(`✅ Email sent to ${options.to} via SendGrid`);
    return true;
  }

  private async sendWithSES(options: EmailOptions): Promise<boolean> {
    const AWS = await import('aws-sdk');
    const ses = new AWS.SES({
      region: this.configService.get<string>('AWS_SES_REGION') || 'eu-central-1',
    });

    await ses.sendEmail({
      Source: options.from || `${this.fromName} <${this.fromEmail}>`,
      Destination: {
        ToAddresses: [options.to],
      },
      Message: {
        Subject: { Data: options.subject },
        Body: {
          ...(options.text && { Text: { Data: options.text } }),
          ...(options.html && { Html: { Data: options.html } }),
        },
      },
    }).promise();

    this.logger.log(`✅ Email sent to ${options.to} via AWS SES`);
    return true;
  }

  // ============================================================================
  // EMAIL TEMPLATES
  // ============================================================================

  private getVerificationCodeTemplate(code: string, userName?: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cod de verificare</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🏠 Domaris</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Platforma ta imobiliară</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">
          ${userName ? `Salut, ${userName}! 👋` : 'Salut! 👋'}
        </h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          Am primit o cerere de verificare a adresei tale de email. Folosește codul de mai jos pentru a continua:
        </p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 0 0 30px 0;">
          <span style="color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #999999; font-size: 14px; text-align: center; margin: 0 0 20px 0;">
          ⏰ Acest cod expiră în <strong>10 minute</strong>
        </p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
        <p style="color: #999999; font-size: 13px; margin: 0;">
          Dacă nu ai solicitat acest cod, poți ignora acest email în siguranță.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #fafafa; padding: 20px 30px; text-align: center;">
        <p style="color: #999999; font-size: 12px; margin: 0;">
          © 2026 Domaris. Toate drepturile rezervate.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private getPasswordResetTemplate(code: string, userName?: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resetare parolă</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔐 Resetare Parolă</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">
          ${userName ? `Salut, ${userName}!` : 'Salut!'}
        </h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          Am primit o cerere de resetare a parolei pentru contul tău. Folosește codul de mai jos:
        </p>
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 0 0 30px 0;">
          <span style="color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #999999; font-size: 14px; text-align: center; margin: 0 0 20px 0;">
          ⏰ Acest cod expiră în <strong>10 minute</strong>
        </p>
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="color: #856404; font-size: 14px; margin: 0;">
            ⚠️ <strong>Important:</strong> Dacă nu ai solicitat resetarea parolei, te rugăm să ignori acest email și să-ți securizezi contul.
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #fafafa; padding: 20px 30px; text-align: center;">
        <p style="color: #999999; font-size: 12px; margin: 0;">
          © 2026 Domaris. Toate drepturile rezervate.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private getWelcomeTemplate(userName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bun venit pe Domaris!</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 50px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🎉 Bun venit!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0 0; font-size: 18px;">Ne bucurăm că ești alături de noi</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">
          Salut, ${userName}! 👋
        </h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
          Contul tău Domaris a fost creat cu succes. Acum poți:
        </p>
        <ul style="color: #666666; font-size: 15px; line-height: 2; padding-left: 20px;">
          <li>🔍 <strong>Căuta proprietăți</strong> - Filtre avansate pentru găsirea locuinței perfecte</li>
          <li>❤️ <strong>Salva favorite</strong> - Ține evidența proprietăților care îți plac</li>
          <li>💬 <strong>Contacta proprietari</strong> - După verificarea contului</li>
          <li>🏠 <strong>Posta anunțuri</strong> - După verificarea identității</li>
        </ul>
        <div style="text-align: center; margin: 35px 0;">
          <a href="https://domaris.ro" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
            Explorează Domaris →
          </a>
        </div>
        <p style="color: #999999; font-size: 14px; text-align: center;">
          Ai întrebări? Răspundem la <a href="mailto:support@domaris.ro" style="color: #667eea;">support@domaris.ro</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #fafafa; padding: 20px 30px; text-align: center;">
        <p style="color: #999999; font-size: 12px; margin: 0;">
          © 2026 Domaris. Toate drepturile rezervate.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private getNewMessageTemplate(senderName: string, propertyTitle: string, messagePreview: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mesaj nou</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">💬 Mesaj nou</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <p style="color: #666666; font-size: 16px; margin: 0 0 15px 0;">
          <strong>${senderName}</strong> ți-a trimis un mesaj pentru:
        </p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 0 0 20px 0;">
          <p style="color: #333333; font-size: 16px; font-weight: 600; margin: 0;">
            🏠 ${propertyTitle}
          </p>
        </div>
        <div style="background-color: #e8f4fd; border-left: 4px solid #667eea; padding: 15px; border-radius: 4px; margin: 0 0 25px 0;">
          <p style="color: #333333; font-size: 15px; font-style: italic; margin: 0;">
            "${messagePreview.length > 150 ? messagePreview.substring(0, 150) + '...' : messagePreview}"
          </p>
        </div>
        <div style="text-align: center;">
          <a href="https://domaris.ro/messages" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 14px; font-weight: 600;">
            Vezi conversația →
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #fafafa; padding: 15px 30px; text-align: center;">
        <p style="color: #999999; font-size: 11px; margin: 0;">
          © 2026 Domaris. <a href="https://domaris.ro/settings/notifications" style="color: #999999;">Dezabonare</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private getViewingRequestTemplate(requesterName: string, propertyTitle: string, proposedDate: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cerere vizionare</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📅 Cerere vizionare</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <p style="color: #666666; font-size: 16px; margin: 0 0 20px 0;">
          <strong>${requesterName}</strong> dorește să vizioneze proprietatea ta:
        </p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 0 0 20px 0;">
          <p style="color: #333333; font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">
            🏠 ${propertyTitle}
          </p>
          <p style="color: #667eea; font-size: 16px; margin: 0;">
            📆 Data propusă: <strong>${proposedDate}</strong>
          </p>
        </div>
        <div style="text-align: center;">
          <a href="https://domaris.ro/viewings" style="display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-size: 14px; font-weight: 600; margin: 5px;">
            ✓ Acceptă
          </a>
          <a href="https://domaris.ro/viewings" style="display: inline-block; background: #e0e0e0; color: #666666; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-size: 14px; font-weight: 600; margin: 5px;">
            ✗ Refuză
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #fafafa; padding: 15px 30px; text-align: center;">
        <p style="color: #999999; font-size: 11px; margin: 0;">
          © 2026 Domaris. <a href="https://domaris.ro/settings/notifications" style="color: #999999;">Dezabonare</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}
