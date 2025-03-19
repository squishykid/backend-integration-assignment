import { Result } from "../helper.type";
import { LatestBlock, RawBlock } from "./blockchain.types";

export type CachedTransaction = {
  hash: string;
  size: number;
};

export type CachedBlock = {
  hash: string;
  prevBlock: string;
  time: number;
  tx: CachedTransaction[];
};

export type CachedDay = CachedBlock[];

export interface ICache {
  getBlock(hash: string): Promise<Result<CachedBlock>>;
  upsertBlock(block: CachedBlock): Promise<Result<void>>;
  getDay(timestampMs: string): Promise<Result<CachedDay>>;
  upsertDay(day: CachedDay): Promise<Result<void>>;
}
