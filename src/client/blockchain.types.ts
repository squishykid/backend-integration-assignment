import { z } from "zod";
import { Result } from "../helper.type";

const Hash = z.string();

const TransactionSchema = z.object({
  hash: Hash,
  size: z.number(),
});

export const RawBlockSchema = z.object({
  hash: Hash,
  prev_block: Hash,
  next_block: z.array(Hash),
  size: z.number(),
  tx: z.array(TransactionSchema),
  time: z.number(),
});

export type RawBlock = z.infer<typeof RawBlockSchema>;

export const LatestBlockSchema = z.object({
  hash: Hash,
  time: z.number(),
  block_index: z.number(),
  height: z.number(),
});

export type LatestBlock = z.infer<typeof LatestBlockSchema>;

export const BlocksOnDaySchema = z.array(LatestBlockSchema);

export type BlocksOnDay = z.infer<typeof BlocksOnDaySchema>;

export interface IBlockchain {
  getBlock(hash: string): Promise<Result<RawBlock>>;
  getBlocksForDay(dayInMs: number): Promise<Result<BlocksOnDay>>;
}
