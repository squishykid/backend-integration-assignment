import {
  BlocksOnDay,
  BlocksOnDaySchema,
  IBlockchain,
  LatestBlock,
  LatestBlockSchema,
  RawBlock,
  RawBlockSchema,
} from "./blockchain.types";
import axios, {
  AxiosInstance,
  AxiosResponse,
  isAxiosError,
} from "axios";
import axiosRetry from "axios-retry";
import { ZodType } from "zod";
import { Result, Outcome } from "../helper.type";
import pLimit, { LimitFunction } from "p-limit";

export class Blockchain implements IBlockchain {
  readonly urlBase: string;
  readonly axios: AxiosInstance;
  readonly #limit: LimitFunction
  constructor(urlBase: string = "https://blockchain.info", concurrency = 50) {
    this.axios = axios.create({
      baseURL: urlBase,
    });
    axiosRetry(this.axios, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
    });
    this.urlBase = urlBase;
    this.#limit = pLimit(concurrency)
  }

  private get = async <T>(
    path: string,
    schema: ZodType<T>,
  ): Promise<Result<T>> => {
    let res: AxiosResponse<unknown>;
    try {
      await this.#limit(async () => {
        console.log("limits", this.#limit.pendingCount);
        res = await this.axios.get(path);
      })
    } catch (e: unknown) {
      if (isAxiosError(e)) {
        return {
          result: Outcome.Error,
          error: e,
        };
      }
      throw e;
    }

    const parsed = schema.safeParse(res.data);
    if (parsed.success) {
      return {
        result: Outcome.Success,
        data: parsed.data,
      };
    } else {
      return {
        result: Outcome.Error,
        error: parsed.error,
      };
    }
  };

  getBlock = async (hash: string): Promise<Result<RawBlock>> => {
    return this.get("rawblock/" + hash, RawBlockSchema);
  };

  getBlocksForDay = async (dayInMs: number): Promise<Result<BlocksOnDay>> => {
    return this.get(`blocks/${dayInMs}?format=json`, BlocksOnDaySchema);
  };
}
