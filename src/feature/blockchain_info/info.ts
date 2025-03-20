import { IBlockchain, RawBlock } from "../../client/blockchain.types";
import { Block, IInfo, Transaction } from "./info.type";
import { isErr, isOk, Outcome, Result } from "../../helper.type";
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

  static approxMsUntilNextBlock = (nowMs: number, blocksTimes: number[]): number => {
    blocksTimes.sort()
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

  static aggregateTransactionSize = (rawBlock: RawBlock): number => {
    /*
    The sum of the size of all transactions is NOT the same as the size of a block.
    https://learnmeabitcoin.com/technical/block/
    The block header is a fixed size, EXCEPT for the transaction count.
    The transaction count is a variable length field. Usually around 3 bytes,
      but can vary from 1 to 9 bytes, depending on the number of transactions.
     */
    const fixedHeaderSize = 80;
    let variableHeaderSize = 0;
    const txCount = rawBlock.tx.length;
    if (txCount <= 252) {
      variableHeaderSize = 1;
    } else if (txCount <= 65535) {
      variableHeaderSize = 3;
    } else if (txCount <= 4294967295) {
      variableHeaderSize = 5;
    } else {
      variableHeaderSize = 9;
    }
    return rawBlock.size - (fixedHeaderSize + variableHeaderSize);
  };

  private callForBlock = async (hash: string): Promise<Result<Block>> => {
    const q = await this.#blockchain.getBlock(hash);
    if (q.result == Outcome.Error) {
      return {
        result: Outcome.Error,
        error: new Error("Unable to get block with this hash", {
          cause: q.error,
        }),
      };
    }
    const rawBlock = q.data;

    const transactions: Transaction[] = rawBlock.tx.map((tx) => {
      return {
        hash: tx.hash,
        size: tx.size,
      };
    });

    const sizeOfAllTx = Info.aggregateTransactionSize(rawBlock);

    const block: Block = {
      hash: rawBlock.hash,
      tx: transactions,
      time: rawBlock.time,
      prevBlock: rawBlock.prev_block,
      txSize: sizeOfAllTx,
      size: rawBlock.size,
    };

    return {
      result: Outcome.Success,
      data: block,
    };
  };

  block = async (hash: string, witeToCache: boolean = true): Promise<Result<Block>> => {
    const cachedBlock = await this.#cache.getBlock(hash);
    if (isOk(cachedBlock)) {
      return cachedBlock;
    }

    const freshData = await this.callForBlock(hash);
    if (isErr(freshData)) {
      return freshData;
    }

    if (witeToCache) {
      await this.#cache.upsertBlock(freshData.data);
    }

    return freshData;
  };

  txBytesOnDay = async (dateMs: number): Promise<Result<number>> => {
    dateMs = canonicalMidnight(dateMs);
    const isToday = dateMs > Date.now();

    const cachedDay = await this.#cache.getDay(dateMs);
    if (isOk(cachedDay)) {
      return {
        result: Outcome.Success,
        data: cachedDay.data.totalTxSize,
      };
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
        const res = await this.block(hash, true)//isToday)
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
      console.log("getting tt next block")
      const msToNextBlock = Info.approxMsUntilNextBlock(
        Date.now(),
        blockTimes,
      );
      ttl = this.todayCacheTtl(msToNextBlock);
    }
    await this.#cache.upsertDay(dateMs, { totalTxSize }, ttl);
    console.log("wrote day")
    return {
      result: Outcome.Success,
      data: totalTxSize,
    };
  };
}
