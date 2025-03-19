// get/set block
// get/set

import { CachedBlock, ICache } from "./cache.type";
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
    this.#redis.set(block.hash, JSON.stringify(block));
    return {
      result: Outcome.Success,
      data: undefined,
    };
  };
}
