import { DynamicModule, Module, Provider } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js'

export interface AuthModuleOptions {
    isGlobal?: boolean;
    secret: string;
    expiresIn: number;
    refreshExpiresIn: number;
    audience: string;
    type: string;
}

import { AuthController } from './auth.controller';

@Module({})
export class AuthModule {
    static forRoot(options: AuthModuleOptions): DynamicModule {
        const providers: Provider[] = [
            {
                provide: 'AUTH_OPTIONS',
                useValue: options,
            },
            AuthService,
            {
                provide: APP_GUARD,
                useClass: AuthGuard,
            },
        ];

        return {
            module: AuthModule,
            controllers: [AuthController],
            providers,
            exports: [AuthService],
            global: !!options.isGlobal,
        };
    }
}