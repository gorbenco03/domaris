export enum UserRole {
    TENANT = 'tenant',
    LANDLORD = 'landlord',
    ADMIN = 'admin',
}

export interface User {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    avatar?: string;
    bio?: string;
    location?: string;
    rating?: number;
    verificationLevel?: number;
    createdAt: string | Date;
    updatedAt: string | Date;
    notificationPreferences?: {
        email?: boolean;
        push?: boolean;
        marketing?: boolean;
    };
}
