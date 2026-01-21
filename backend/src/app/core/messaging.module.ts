/**
 * 📧📱🔔 MESSAGING MODULE - Email, SMS & Push Services
 * 
 * Modul global pentru servicii de comunicare.
 * Include EmailService, SmsService și PushNotificationService.
 */

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';
import { PushNotificationService } from './push/push.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailService, SmsService, PushNotificationService],
  exports: [EmailService, SmsService, PushNotificationService],
})
export class MessagingModule {}

