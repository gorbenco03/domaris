import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
// MessagingModule este @Global() — PushNotificationService este injectat automat.
// Importul explicit nu este necesar, dar îl documentăm pentru claritate.

@Module({
    controllers: [NotificationController],
    providers: [NotificationService],
    exports: [NotificationService], // Export pentru CronModule și ViewingModule
})
export class NotificationModule { }

