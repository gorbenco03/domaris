import Redis from 'ioredis';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: async () => {
                console.log('🔵 [RedisModule] Attempting to connect to Redis...');
                console.log('🔵 [RedisModule] Redis config:', {
                    host: process.env.REDIS_HOST,
                    port: process.env.REDIS_PORT,
                    hasPassword: !!process.env.REDIS_PASSWORD
                });

                const client = new Redis({
                    host: process.env.REDIS_HOST,
                    port: Number(process.env.REDIS_PORT),
                    password: process.env.REDIS_PASSWORD,
                    lazyConnect: true,
                    retryStrategy: () => null,
                    reconnectOnError: () => false,
                    connectTimeout: 10000, // 10 seconds
                    commandTimeout: 5000,   // 5 seconds
                });

                try {
                    await client.connect();
                    console.log('✅ [RedisModule] Redis connected successfully');
                    return client;
                } catch (error) {
                    console.error('❌ [RedisModule] Redis connection failed:', error);
                    console.error('❌ [RedisModule] Redis error details:', {
                        message: error.message,
                        code: error.code,
                        host: process.env.REDIS_HOST,
                        port: process.env.REDIS_PORT
                    });
                    
                    // Return a mock client that won't crash the app
                    return {
                        set: async () => console.warn('⚠️ Redis not available, skipping set operation'),
                        get: async () => null,
                        del: async () => console.warn('⚠️ Redis not available, skipping del operation'),
                        exists: async () => 0
                    };
                }
            },
        },
    ],
    exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
