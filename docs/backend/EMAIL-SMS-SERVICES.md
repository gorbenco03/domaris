# 📧📱🔔 Email, SMS & Push Services - Documentație

**Versiune:** 1.1.0  
**Data:** 22 Ianuarie 2026

---

## 🎯 Prezentare Generală

Backend-ul include servicii abstractizate pentru Email, SMS și Push Notifications:

### Email (`EmailService`)

- **console** - Pentru development (log în terminal)
- **sendgrid** - Pentru producție cu SendGrid
- **ses** - Pentru producție cu AWS SES

### SMS (`SmsService`)

- **console** - Pentru development (log în terminal)
- **twilio** - Pentru producție cu Twilio

### Push Notifications (`PushNotificationService`)

- **console** - Pentru development (log în terminal)
- **firebase** - Pentru producție cu Firebase Cloud Messaging (Android + iOS)

---

## ⚙️ Configurare

### Development (default)

În development, emailurile, SMS-urile și push notifications sunt loggate în consolă:

```env
# .env
EMAIL_PROVIDER=console
SMS_PROVIDER=console
PUSH_PROVIDER=console
```

### Production - SendGrid

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
EMAIL_FROM=noreply@domaris.ro
EMAIL_FROM_NAME=Domaris
```

### Production - AWS SES

```env
EMAIL_PROVIDER=ses
AWS_SES_REGION=eu-central-1
EMAIL_FROM=noreply@domaris.ro
EMAIL_FROM_NAME=Domaris
# Necesită și AWS credentials configure
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

### Production - Twilio

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+40700000000
```

### Production - Firebase

```env
PUSH_PROVIDER=firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=base64-encoded-private-key
```

---

## 📨 Metode Disponibile

### EmailService

```typescript
// Injectare
constructor(private readonly emailService: EmailService) {}

// Email generic
await emailService.send({
  to: 'user@example.com',
  subject: 'Subject',
  text: 'Plain text',
  html: '<p>HTML content</p>',
});

// Template: Cod verificare email
await emailService.sendVerificationCode(email, code, userName?);

// Template: Cod resetare parolă
await emailService.sendPasswordResetCode(email, code, userName?);

// Template: Email de bun venit
await emailService.sendWelcomeEmail(email, userName);

// Template: Notificare mesaj nou
await emailService.sendNewMessageNotification(email, senderName, propertyTitle, messagePreview);

// Template: Notificare cerere vizionare
await emailService.sendViewingRequestNotification(email, requesterName, propertyTitle, proposedDate);
```

### SmsService

```typescript
// Injectare
constructor(private readonly smsService: SmsService) {}

// SMS generic
await smsService.send({
  to: '+40700000000',
  message: 'Mesajul tău',
});

// Template: Cod OTP
await smsService.sendOtpCode(phone, code);

// Template: Cod verificare telefon
await smsService.sendVerificationCode(phone, code);

// Template: Reminder vizionare
await smsService.sendViewingReminder(phone, propertyAddress, dateTime);

// Template: Schimbare status vizionare
await smsService.sendViewingStatusChange(phone, 'confirmed' | 'cancelled' | 'rescheduled', propertyTitle);
```

### PushNotificationService

```typescript
// Injectare
constructor(private readonly pushService: PushNotificationService) {}

// Trimite către un utilizator (toate dispozitivele)
await pushService.sendToUser({
  userId: 123,
  notification: {
    title: 'Titlu notificare',
    body: 'Conținut notificare',
    data: { type: 'custom', id: '456' },
  },
  type: NotificationTypes.SYSTEM,
  saveToDatabase: true,
});

// Template: Mesaj nou
await pushService.notifyNewMessage(recipientId, senderName, preview, conversationId, propertyId?);

// Template: Cerere vizionare (către proprietar)
await pushService.notifyViewingRequest(ownerId, requesterName, propertyTitle, viewingId, date);

// Template: Vizionare confirmată
await pushService.notifyViewingConfirmed(seekerId, propertyTitle, viewingId, date);

// Template: Vizionare anulată
await pushService.notifyViewingCancelled(userId, propertyTitle, viewingId, reason?);

// Template: Reminder vizionare (1 oră înainte)
await pushService.notifyViewingReminder(userId, propertyTitle, address, viewingId, time);

// Template: Verificare aprobată
await pushService.notifyVerificationApproved(userId, level);

// Template: Proprietate salvată în favorite
await pushService.notifyPropertyFavorited(ownerId, propertyTitle, propertyId, count);
```

---

## 🎨 Templates Email

Toate template-urile de email includ:

- Design responsive pentru mobile
- Gradient-uri moderne
- Branding Domaris consistent
- Footer cu drepturi de autor
- Link-uri de dezabonare (unde e cazul)

### Template-uri Disponibile:

1. **Verificare Email** - Cod de 6 cifre, expiră în 10 minute
2. **Resetare Parolă** - Cod de resetare, warning de securitate
3. **Bun Venit** - Prezentare funcționalități, CTA pentru explorare
4. **Mesaj Nou** - Preview mesaj, link către conversație
5. **Cerere Vizionare** - Data propusă, butoane Accept/Refuză

---

## 🔔 Tipuri de Notificări Push

```typescript
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
  SYSTEM: 'system',
};
```

---

## 🔒 Securitate

- Codurile OTP expiră în 10 minute
- Codurile sunt stocate în Redis criptat
- Max 5 încercări pe cod
- Email enumeration prevention (always return success for forgot password)
- Normalizare automată a numerelor de telefon (format internațional)
- Push tokens invalide sunt șterse automat

---

## 📊 Utilizare în Cod

### Integrare în AuthService

```typescript
// auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService
  ) {}

  async sendEmailVerificationCode(email: string) {
    const code = await this.generateOtp();
    await this.emailService.sendVerificationCode(email, code);
    // ...
  }

  async sendPhoneOtp(phone: string) {
    const code = await this.generateOtp();
    await this.smsService.sendOtpCode(phone, code);
    // ...
  }
}
```

### Integrare în ChatGateway

```typescript
// chat.gateway.ts
@WebSocketGateway()
export class ChatGateway {
  constructor(private readonly pushService: PushNotificationService) {}

  async notifyOfflineRecipient(
    senderId: number,
    conversationId: number,
    message: Message
  ) {
    const isOnline = await this.isUserOnline(recipientId);

    if (!isOnline) {
      await this.pushService.notifyNewMessage(
        recipientId,
        senderName,
        message.content,
        conversationId
      );
    }
  }
}
```

---

## 🧪 Testing

În development, toate mesajele sunt afișate în consolă:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 EMAIL (Console Provider - Development)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: user@example.com
From: Domaris <noreply@domaris.ro>
Subject: Cod de verificare - Domaris
─────────────────────────────────────────────────────
Text: Codul tău de verificare este: 123456.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 SMS (Console Provider - Development)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: +40700000000
Message: Codul tău Domaris este: 123456.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔔 PUSH NOTIFICATION (Console Provider - Development)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Platform: ios
Token: abc123...
Title: Mesaj de la Ion
Body: Bună! Sunt interesat de apartament.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📝 Fișiere

| Fișier                        | Descriere                            |
| ----------------------------- | ------------------------------------ |
| `core/email/email.service.ts` | Serviciu principal pentru email      |
| `core/sms/sms.service.ts`     | Serviciu principal pentru SMS        |
| `core/push/push.service.ts`   | Serviciu principal pentru Push       |
| `core/messaging.module.ts`    | Modul care exportă toate serviciile  |
| `.env`                        | Configurare provideri și credentials |

---

**Document actualizat:** 22 Ianuarie 2026  
**Autor:** Claude AI
