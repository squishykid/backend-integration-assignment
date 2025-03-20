import { Result } from "../helper.type";

export type CachedTransaction = {
  hash: string;
  size: number;
};

export type CachedBlock = {
  hash: string;
  prevBlock: string;
  time: number;
  tx: CachedTransaction[];
  size: number;
  txSize: number;
};

export type CachedDay = {
  totalTxSize: number;
};

export interface ICache {
  getBlock(hash: string): Promise<Result<CachedBlock>>;
  upsertBlock(block: CachedBlock): Promise<Result<void>>;
  getDay(timestampMs: number): Promise<Result<CachedDay>>;
  upsertDay(
    timestampMs: number,
    day: CachedDay,
    ttl: number,
  ): Promise<Result<void>>;
}
