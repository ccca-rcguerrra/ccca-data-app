import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private client: RedisClientType;

    constructor(private configService: ConfigService) {}

    async onModuleInit() {
        await this.connect();
    }

    async onModuleDestroy() {
        await this.disconnect();
    }

    async get<T>(key: string): Promise<T | undefined> {
        try {
            const value = await this.client.get(key);
            if (value === null) return undefined;
            try {
                return JSON.parse(value) as T;
            } catch {
                return value as T;
            }
        } catch (error) {
            this.logger.error(`Error getting key ${key}:`, error);
            return undefined;
        }
    }

    /**
     * Sets a value — fire-and-forget for cache; failures are logged but not propagated.
     * Use setCritical() when the caller must know if the write failed.
     */
    async set(key: string, value: any, ttl?: number): Promise<void> {
        try {
            await this.writeToRedis(key, value, ttl);
        } catch (error) {
            this.logger.error(`Error setting key ${key}:`, error);
        }
    }

    /**
     * Sets a value and propagates errors — for writes where failure must be visible to the caller.
     */
    async setCritical(key: string, value: any, ttl?: number): Promise<void> {
        await this.writeToRedis(key, value, ttl);
    }

    async del(key: string): Promise<void> {
        try {
            await this.client.del(key);
        } catch (error) {
            this.logger.error(`Error deleting key ${key}:`, error);
        }
    }

    async delMultiple(keys: string[]): Promise<void> {
        try {
            if (keys.length > 0) {
                const pipeline = this.client.multi();
                keys.forEach((key) => pipeline.del(key));
                await pipeline.exec();
            }
        } catch (error) {
            this.logger.error(`Error deleting multiple keys:`, error);
        }
    }

    /**
     * Clears keys by prefix (safe) or the entire database (when no prefix is given).
     * In environments where Bull/Socket.IO share the same Redis db, always pass a prefix.
     */
    async reset(prefix?: string): Promise<void> {
        try {
            if (prefix) {
                const keys = await this.keys(`${prefix}:*`);
                if (keys.length) await this.delMultiple(keys);
            } else {
                await this.client.flushDb();
            }
        } catch (error) {
            this.logger.error('Error resetting Redis:', error);
            throw error;
        }
    }

    async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== undefined) return cached;

        const value = await factory();
        await this.set(key, value, ttl);
        return value;
    }

    async has(key: string): Promise<boolean> {
        try {
            const exists = await this.client.exists(key);
            return exists === 1;
        } catch (error) {
            this.logger.error(`Error checking existence of key ${key}:`, error);
            return false;
        }
    }

    async getTTL(key: string): Promise<number | undefined> {
        try {
            const ttl = await this.client.ttl(key);
            return ttl > 0 ? ttl : undefined;
        } catch (error) {
            this.logger.error(`Error getting TTL for key ${key}:`, error);
            return undefined;
        }
    }

    async mget<T>(keys: string[]): Promise<(T | undefined)[]> {
        try {
            const values = await this.client.mGet(keys);
            return values.map((value) => {
                if (value === null) return undefined;
                try {
                    return JSON.parse(value) as T;
                } catch {
                    return value as T;
                }
            });
        } catch (error) {
            this.logger.error(`Error getting multiple keys:`, error);
            return keys.map(() => undefined);
        }
    }

    async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<void> {
        try {
            const serializedPairs: Record<string, string> = {};
            for (const [key, value] of Object.entries(keyValuePairs)) {
                serializedPairs[key] = typeof value === 'string' ? value : this.safeStringify(value);
            }
            await this.client.mSet(serializedPairs);

            if (ttl) {
                const pipeline = this.client.multi();
                Object.keys(keyValuePairs).forEach((key) => pipeline.expire(key, ttl));
                await pipeline.exec();
            }
        } catch (error) {
            this.logger.error(`Error setting multiple keys:`, error);
        }
    }

    /**
     * incr/decr propagate errors intentionally — callers depend on the returned value.
     */
    async incr(key: string, amount: number = 1): Promise<number> {
        try {
            return await this.client.incrBy(key, amount);
        } catch (error) {
            this.logger.error(`Error incrementing key ${key}:`, error);
            throw error;
        }
    }

    async decr(key: string, amount: number = 1): Promise<number> {
        try {
            return await this.client.decrBy(key, amount);
        } catch (error) {
            this.logger.error(`Error decrementing key ${key}:`, error);
            throw error;
        }
    }

    /**
     * Returns keys matching a pattern using SCAN (non-blocking).
     * Never use KEYS in production — it blocks Redis while scanning.
     */
    async keys(pattern: string): Promise<string[]> {
        try {
            const keys: string[] = [];
            for await (const batch of this.client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
                keys.push(...batch);
            }
            return keys;
        } catch (error) {
            this.logger.error(`Error scanning keys with pattern "${pattern}":`, error);
            return [];
        }
    }

    // ── Redis Set operations (for presence tracking) ──────────────────────────

    async sadd(key: string, ...members: string[]): Promise<number> {
        try {
            return await this.client.sAdd(key, members);
        } catch (error) {
            this.logger.error(`Error adding to set ${key}:`, error);
            return 0;
        }
    }

    async srem(key: string, ...members: string[]): Promise<number> {
        try {
            return await this.client.sRem(key, members);
        } catch (error) {
            this.logger.error(`Error removing from set ${key}:`, error);
            return 0;
        }
    }

    async smembers(key: string): Promise<string[]> {
        try {
            return await this.client.sMembers(key);
        } catch (error) {
            this.logger.error(`Error getting members of set ${key}:`, error);
            return [];
        }
    }

    isConnected(): boolean {
        return this.client?.isOpen || false;
    }

    private async connect(): Promise<void> {
        try {
            const redisHost = this.configService.get<string>('APP_REDIS_HOST', 'localhost');
            const redisPort = this.configService.get<string>('APP_REDIS_PORT', '6379');
            const redisDb = Number.parseInt(
                this.configService.get<string>('APP_REDIS_DB', '0'),
                10,
            );

            const redisUrl = `redis://${redisHost}:${redisPort}`;

            this.client = createClient({
                url: redisUrl,
                database: Number.isFinite(redisDb) ? redisDb : 0,
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            this.logger.error('Redis connection failed after 10 retries');
                            return new Error('Redis connection failed');
                        }
                        return Math.min(retries * 100, 3000);
                    },
                },
            }) as RedisClientType;

            this.client.on('error', (err: Error) => this.logRedisClientError(err));
            this.client.on('connect', () => this.logger.log('Redis client connected'));
            this.client.on('ready', () => this.logger.log('Redis client ready'));
            this.client.on('end', () => this.logger.verbose('Redis client disconnected'));

            await this.client.connect();
        } catch (error) {
            this.logger.error('Failed to connect to Redis:', error);
            throw error;
        }
    }

    private async disconnect(): Promise<void> {
        if (this.client?.isOpen) {
            await this.client.quit();
        }
    }

    /**
     * Avoid ERROR spam during auto-reconnect: "Socket closed unexpectedly" is transient.
     */
    private logRedisClientError(err: Error): void {
        const name = err?.constructor?.name ?? '';
        const msg = String(err?.message ?? err);
        const isTransientSocket =
            name === 'SocketClosedUnexpectedlyError' ||
            /socket closed unexpectedly/i.test(msg);
        if (isTransientSocket) {
            this.logger.warn(`Redis connection interrupted (reconnecting): ${msg}`);
            return;
        }
        this.logger.error('Redis Client Error:', err);
    }

    private async writeToRedis(key: string, value: any, ttl?: number): Promise<void> {
        const serialized = typeof value === 'string' ? value : this.safeStringify(value);
        if (ttl) {
            await this.client.setEx(key, ttl, serialized);
        } else {
            await this.client.set(key, serialized);
        }
    }

    private safeStringify(value: any): string {
        const seen = new WeakSet();
        return JSON.stringify(value, (_key, val) => {
            if (val != null && typeof val === 'object') {
                if (seen.has(val)) return '[Circular Reference]';
                seen.add(val);
            }
            return val;
        });
    }
}
