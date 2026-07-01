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
                    
                    // WARNING: in-memory fallback loses data on restart and does NOT
                    // work across multiple server instances. Redis is REQUIRED in production.
                    // If NODE_ENV=production and Redis is unavailable, the app will NOT start.
                    if (process.env.NODE_ENV === 'production') {
                        throw new Error(
                            '[RedisModule] Redis is required in production but failed to connect. ' +
                            'Check REDIS_HOST / REDIS_PORT / REDIS_PASSWORD and ensure Redis is running.'
                        );
                    }

                    console.warn('⚠️ [RedisModule] Using InMemoryRedis fallback (development only)');

                    const store = new Map<string, any>();
                    const expireTimers = new Map<string, NodeJS.Timeout>();

                    const scheduleExpiry = (key: string, seconds: number) => {
                        const existing = expireTimers.get(key);
                        if (existing) clearTimeout(existing);
                        const timer = setTimeout(() => {
                            store.delete(key);
                            expireTimers.delete(key);
                        }, seconds * 1000);
                        expireTimers.set(key, timer);
                    };

                    return {
                        set: async (key: string, value: string) => {
                            store.set(key, value);
                            return 'OK';
                        },
                        get: async (key: string) => {
                            const val = store.get(key);
                            return typeof val === 'string' ? val : null;
                        },
                        del: async (key: string) => {
                            const existed = store.has(key);
                            store.delete(key);
                            const timer = expireTimers.get(key);
                            if (timer) { clearTimeout(timer); expireTimers.delete(key); }
                            return existed ? 1 : 0;
                        },
                        exists: async (key: string) => {
                            return store.has(key) ? 1 : 0;
                        },
                        setex: async (key: string, seconds: number, value: string) => {
                            store.set(key, value);
                            scheduleExpiry(key, seconds);
                            return 'OK';
                        },
                        expire: async (key: string, seconds: number) => {
                            if (store.has(key)) {
                                scheduleExpiry(key, seconds);
                                return 1;
                            }
                            return 0;
                        },
                        // Atomic increment — used by OTP attempt tracking
                        incr: async (key: string) => {
                            const current = store.get(key);
                            const next = (parseInt(typeof current === 'string' ? current : '0', 10) || 0) + 1;
                            store.set(key, next.toString());
                            return next;
                        },
                        // Set operations
                        sadd: async (key: string, ...members: string[]) => {
                            let set = store.get(key);
                            if (!(set instanceof Set)) {
                                set = new Set();
                                store.set(key, set);
                            }
                            let added = 0;
                            for (const member of members) {
                                if (!set.has(member)) {
                                    set.add(member);
                                    added++;
                                }
                            }
                            return added;
                        },
                        srem: async (key: string, ...members: string[]) => {
                            const set = store.get(key);
                            if (!(set instanceof Set)) return 0;
                            let removed = 0;
                            for (const member of members) {
                                if (set.has(member)) {
                                    set.delete(member);
                                    removed++;
                                }
                            }
                            return removed;
                        },
                        scard: async (key: string) => {
                            const set = store.get(key);
                            return (set instanceof Set) ? set.size : 0;
                        },
                        smembers: async (key: string) => {
                            const set = store.get(key);
                            return (set instanceof Set) ? Array.from(set) : [];
                        }
                    };
                }
            },
        },
    ],
    exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
