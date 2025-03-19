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
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  isAxiosError,
} from "axios";
import axiosRetry from "axios-retry";
import { ZodType } from "zod";
import { Result, Outcome } from "../helper.type";

export class Blockchain implements IBlockchain {
  readonly urlBase: string;
  readonly axios: AxiosInstance;
  constructor(urlBase: string = "https://blockchain.info") {
    this.axios = axios.create({
      baseURL: urlBase,
    });
    axiosRetry(this.axios, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
    });
    this.urlBase = urlBase;
  }

  private get = async <T>(
    path: string,
    schema: ZodType<T>,
  ): Promise<Result<T>> => {
    let res: AxiosResponse<unknown>;
    try {
      res = await this.axios.get(path);
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

  latestBlock = async (): Promise<Result<LatestBlock>> => {
    return this.get("latestblock", LatestBlockSchema);
  };

  getBlocksForDay = async (dayInMs: number): Promise<Result<BlocksOnDay>> => {
    return this.get(`blocks/${dayInMs}?format=json`, BlocksOnDaySchema);
  };
}
