import { CachedBlock, CachedDay, ICache } from "./cache.type";
import { Outcome, Result } from "../helper.type";
import { Redis } from "ioredis";
export class Cache implements ICache {
  readonly #redis: Redis;

  constructor(redis: Redis) {
    this.#redis = redis;
  }

  getBlock = async (hash: string): Promise<Result<CachedBlock>> => {
    const cached = await this.#redis.get(hash);
    if (!cached) {
      return {
        result: Outcome.Error,
        error: null,
      };
    }
    return {
      result: Outcome.Success,
      data: JSON.parse(cached),
    };
  };

  upsertBlock = async (block: CachedBlock): Promise<Result<void>> => {
    await this.#redis.set(block.hash, JSON.stringify(block));
    return {
      result: Outcome.Success,
      data: undefined,
    };
  };

  getDay = async (timestampMs: number): Promise<Result<CachedDay>> => {
    const cached = await this.#redis.get(`${timestampMs}`);
    if (!cached) {
      return {
        result: Outcome.Error,
        error: null,
      };
    }
    return {
      result: Outcome.Success,
      data: {
        totalTxSize: parseInt(cached, 10),
      },
    };
  };

  upsertDay = async (
    timestampMs: number,
    day: CachedDay,
    ttl: number,
  ): Promise<Result<void>> => {
    ttl = Math.floor(ttl);
    if (ttl > -1) {
      await this.#redis.set(`${timestampMs}`, `${day.totalTxSize}`, "PX", ttl);
    } else {
      await this.#redis.set(`${timestampMs}`, `${day.totalTxSize}`);
    }
    return {
      result: Outcome.Success,
      data: undefined,
    };
  };
}
