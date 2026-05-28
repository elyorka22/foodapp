import { Injectable } from '@nestjs/common';

type MemoryEntry = { value: string; expiresAt: number };

/** In-memory cache for MVP (no Redis container required). */
@Injectable()
export class RedisCacheService {
  private readonly memory = new Map<string, MemoryEntry>();

  async get<T>(key: string): Promise<T | null> {
    const row = this.memory.get(key);
    if (!row || row.expiresAt < Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return JSON.parse(row.value) as T;
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    this.memory.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.memory.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const prefix = pattern.replace('*', '');
    for (const key of [...this.memory.keys()]) {
      if (key.startsWith(prefix)) this.memory.delete(key);
    }
  }

  async ping(): Promise<boolean> {
    return true;
  }
}
