export interface Notification {
    id: number;
    userId: number;
    title: string;
    body: string;
    type: string;
    isRead: boolean;
    metadata?: any;
    createdAt: string | Date;
}

export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    marketing: boolean;
}
