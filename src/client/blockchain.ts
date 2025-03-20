import {
  BlocksOnDay,
  BlocksOnDaySchema,
  IBlockchain,
  RawBlock,
  RawBlockSchema,
} from "./blockchain.types";
import axios, { AxiosInstance, AxiosResponse, isAxiosError } from "axios";
import axiosRetry from "axios-retry";
import { ZodType } from "zod";
import { Result, err, ok } from "../helper.type";
import PQueue from "p-queue";
import * as https from "https";
import * as http from "http";

export class Blockchain implements IBlockchain {
  readonly urlBase: string;
  readonly axios: AxiosInstance;
  readonly #queue: PQueue;
  constructor(urlBase: string = "https://blockchain.info", concurrency = 100) {
    this.axios = axios.create({
      baseURL: urlBase,
      httpAgent: new http.Agent({ keepAlive: true }),
      httpsAgent: new https.Agent({ keepAlive: true }),
    });
    axiosRetry(this.axios, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
    });
    this.urlBase = urlBase;
    this.#queue = new PQueue({ concurrency });
  }

  private get = async <T>(
    path: string,
    schema: ZodType<T>,
  ): Promise<Result<T>> => {
    let q;
    try {
      q = await this.#queue.add(async () => {
        return await this.axios.get(path);
      });
    } catch (e: unknown) {
      if (isAxiosError(e)) {
        return err(e);
      }
      throw e;
    }

    const res: AxiosResponse<unknown> | void = await q;
    if (typeof res !== "object") {
      throw new Error("internal type error");
    }

    const parsed = schema.safeParse(res.data);
    if (parsed.success) {
      return ok(parsed.data);
    }
    return err(parsed.error);
  };

  getBlock = async (hash: string): Promise<Result<RawBlock>> => {
    return this.get("rawblock/" + hash, RawBlockSchema);
  };

  getBlocksForDay = async (dayInMs: number): Promise<Result<BlocksOnDay>> => {
    return this.get(`blocks/${dayInMs}?format=json`, BlocksOnDaySchema);
  };
}
