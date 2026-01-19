export interface LoginResponse {
    accessToken: string;
    user: any; // typed as User but avoiding circular imports if needed, though interfaces are fine
}

export interface RegisterDto {
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: 'tenant' | 'landlord';
}

export interface LoginDto {
    email: string;
    password?: string;
}
