import { IBlockchain } from "../../client/blockchain.types";
import { Block, IInfo, Transaction } from "./info.type";
import { isErr, isOk, Outcome, Result } from "../../helper.type";
import { ICache } from "../../client/cache.type";

export class Info implements IInfo {
  readonly #blockchain: IBlockchain;
  readonly #cache: ICache;

  constructor(blockchain: IBlockchain, cache: ICache) {
    this.#blockchain = blockchain;
    this.#cache = cache;
  }

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

    const transactions: Transaction[] = rawBlock.tx.map((tx) => ({
      hash: tx.hash,
      size: tx.size,
    }));

    const block = {
      hash: rawBlock.hash,
      tx: transactions,
      time: rawBlock.time,
      prevBlock: rawBlock.prev_block,
    };

    return {
      result: Outcome.Success,
      data: block,
    };
  };

  block = async (hash: string): Promise<Result<Block>> => {
    const cachedBlock = await this.#cache.getBlock(hash);
    if (isOk(cachedBlock)) {
      return cachedBlock;
    }

    const freshData = await this.callForBlock(hash);
    if (isErr(freshData)) {
      return freshData;
    }

    await this.#cache.upsertBlock(freshData.data);

    return freshData;
  };

  blocksOnDay = async (date: number): Promise<Result<Block[]>> => {
    const blocks = await this.#blockchain.getBlocksForDay(date);
    if (isErr(blocks)) {
      return blocks;
    }

    const work: Promise<Result<Block>>[] = [];
    for (const blockOnDay of blocks.data) {
      work.push(this.block(blockOnDay.hash));
    }

    const result = await Promise.all(work);

    const success: Block[] = [];
    for (const res of result) {
      if (res.result == Outcome.Success) {
        success.push(res.data);
      }
    }

    return {
      result: Outcome.Success,
      data: success,
    };
  };
}
