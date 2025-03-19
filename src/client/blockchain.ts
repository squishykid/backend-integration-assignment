import {
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

export enum Result {
  Success,
  Error,
}

type SuccessResponse<T> = {
  result: Result.Success;
  data: T;
};

type ErrorResponse = {
  result: Result.Error;
  error: Error | AxiosError;
};

export type Response<T> = SuccessResponse<T> | ErrorResponse;

export class Blockchain {
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
  ): Promise<Response<T>> => {
    let res: AxiosResponse<unknown>;
    try {
      res = await this.axios.get(path);
    } catch (e: unknown) {
      if (isAxiosError(e)) {
        return {
          result: Result.Error,
          error: e,
        };
      }
      throw e;
    }

    const parsed = schema.safeParse(res.data);
    if (parsed.success) {
      return {
        result: Result.Success,
        data: parsed.data,
      };
    } else {
      return {
        result: Result.Error,
        error: parsed.error,
      };
    }
  };

  getBlock = async (hash: string): Promise<Response<RawBlock>> => {
    return this.get("rawblock/" + hash, RawBlockSchema);
  };

  latestBlock = async (): Promise<Response<LatestBlock>> => {
    return this.get("latestblock", LatestBlockSchema);
  };
}
