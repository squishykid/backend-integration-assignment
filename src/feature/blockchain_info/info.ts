import { IBlockchain } from "../../client/blockchain.types";
import { Block, IInfo, Transaction } from "./info.type";
import { err, isErr, isOk, ok, Outcome, Result } from "../../helper.type";
import { ICache } from "../../client/cache.type";
import { canonicalMidnight } from "../../helper";

export class Info implements IInfo {
  readonly #blockchain: IBlockchain;
  readonly #cache: ICache;
  readonly #minTtlMs: number;

  constructor(
    blockchain: IBlockchain,
    cache: ICache,
    minTtlMs: number = 10 * 1000,
  ) {
    this.#blockchain = blockchain;
    this.#cache = cache;
    this.#minTtlMs = minTtlMs;
  }

  static approxMsUntilNextBlock = (
    nowMs: number,
    blocksTimes: number[],
  ): number => {
    blocksTimes.sort();
    if (blocksTimes.length < 2) {
      return 0;
    }
    let aggSec = 0;
    let latestSec = blocksTimes[0];
    for (let i = 1; i < blocksTimes.length; i++) {
      const firstSec = blocksTimes[i - 1];
      const secondSec = blocksTimes[i];
      const intervalSec = secondSec - firstSec;
      aggSec += intervalSec;
      latestSec = latestSec > secondSec ? latestSec : secondSec;
    }
    const avgIntervalSec = aggSec / (blocksTimes.length - 1);
    const predictedMs = (latestSec + avgIntervalSec) * 1000;
    console.log(
      predictedMs - nowMs,
      predictedMs,
      avgIntervalSec,
      latestSec,
      nowMs,
    );
    return predictedMs - nowMs;
  };

  todayCacheTtl = (msUntilNextBlock: number): number => {
    if (msUntilNextBlock < this.#minTtlMs) {
      return this.#minTtlMs;
    }
    const maxCacheMinute = 10 * 60 * 1000;
    if (msUntilNextBlock > maxCacheMinute) {
      return maxCacheMinute;
    }
    return msUntilNextBlock;
  };

  private getBlockFromApi = async (hash: string): Promise<Result<Block>> => {
    const result = await this.#blockchain.getBlock(hash);
    if (result.result == Outcome.Error) {
      console.log("unable to get block", result.error)
      return err(
        new Error("Unable to get block with this hash", {
          cause: result.error,
        }),
      );
    }
    const rawBlock = result.data;

    let sizeOfAllTx = 0;
    const transactions: Transaction[] = rawBlock.tx.map((tx) => {
      sizeOfAllTx += tx.size;
      return {
        hash: tx.hash,
        size: tx.size,
      };
    });

    const block: Block = {
      hash: rawBlock.hash,
      tx: transactions,
      time: rawBlock.time,
      prevBlock: rawBlock.prev_block,
      txSize: sizeOfAllTx,
      size: rawBlock.size,
    };

    return ok(block);
  };

  block = async (hash: string): Promise<Result<Block>> => {
    const cachedBlock = await this.#cache.getBlock(hash);
    if (isOk(cachedBlock)) {
      return cachedBlock;
    }

    const freshData = await this.getBlockFromApi(hash);
    if (isErr(freshData)) {
      return freshData;
    }

    await this.#cache.upsertBlock(freshData.data);

    return freshData;
  };

  txBytesOnDay = async (dateMs: number): Promise<Result<number>> => {
    dateMs = canonicalMidnight(dateMs);
    const isToday = dateMs > Date.now();

    const cachedDay = await this.#cache.getDay(dateMs);
    if (isOk(cachedDay)) {
      return ok(cachedDay.data.totalTxSize);
    }
    const blockMetadataForDay = await this.#blockchain.getBlocksForDay(dateMs);
    if (isErr(blockMetadataForDay)) {
      return blockMetadataForDay;
    }

    const hashesForDay = blockMetadataForDay.data.map((b) => b.hash);
    const work: Promise<void>[] = [];
    let totalTxSize = 0;
    const blockTimes: number[] | null = isToday ? [] : null;

    for (const hash of hashesForDay) {
      const w = async (): Promise<void> => {
        const res = await this.block(hash);
        if (res.result == Outcome.Success) {
          totalTxSize += res.data.txSize;
          if (blockTimes) {
            blockTimes.push(res.data.time);
          }
        } else {
          // exit here and do not put error in cache
          throw res.error;
        }
      };
      work.push(w());
    }

    await Promise.all(work);

    console.log("finished work", hashesForDay.length, work.length);

    let ttl = -1;
    if (blockTimes) {
      /*
      The list of block times is only created if we are processing *today*.
      Since today is not finished yet, more blocks may be produced before
       the day ends.
      Therefore, we guess when the next block might be mined and set the
       cached value to expire then.
       */
      const msToNextBlock = Info.approxMsUntilNextBlock(Date.now(), blockTimes);
      ttl = this.todayCacheTtl(msToNextBlock);
    }
    await this.#cache.upsertDay(dateMs, { totalTxSize }, ttl);
    console.log("wrote day");
    return ok(totalTxSize);
  };
}
