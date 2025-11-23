import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const IS_AUTH_ONLY_KEY = 'isAuthOnly';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const AuthOnly = () => SetMetadata(IS_AUTH_ONLY_KEY, true);


