import {
  BlockWithConsumption,
  IConsumption,
  LastNDaysConsumption,
  TransactionWithConsumption,
} from "./consumption.type";
import { isErr } from "../../helper.type";
import { IInfo } from "../blockchain_info/info.type";

export class Consumption implements IConsumption {
  readonly #info: IInfo;
  readonly costPerByte: number;

  constructor(info: IInfo, costPerByte: number) {
    this.#info = info;
    this.costPerByte = costPerByte;
  }

  getConsumptionForLastDays = async (
    n: number,
  ): Promise<LastNDaysConsumption> => {
    const timeNowMs = Date.now();
    const dayLenInMs = 1000 * 60 * 60 * 24;
    const canonicalTimeNow = new Date(timeNowMs + dayLenInMs).setHours(
      0,
      0,
      0,
      0,
    );

    let consumption = 0;
    for (let j = 0; j < n; j++) {
      const dayInMs = canonicalTimeNow - dayLenInMs * j;
      const blocksForDay = await this.#info.blocksOnDay(dayInMs);
      if (isErr(blocksForDay)) {
        throw blocksForDay.error;
      }
      for (const block of blocksForDay.data) {
        const blockEnergy = block.tx.reduce((acc, current) => {
          return acc + current.size * this.costPerByte;
        }, 0);
        consumption += blockEnergy;
      }
    }

    return {
      days: n,
      energy: consumption,
    };
  };

  getConsumptionPerTransaction = async (
    hash: string,
  ): Promise<BlockWithConsumption> => {
    const blockInfo = await this.#info.block(hash);
    if (isErr(blockInfo)) {
      throw blockInfo.error;
    }

    let aggregateEnergy = 0;
    const transactions: TransactionWithConsumption[] = blockInfo.data.tx.map(
      (t) => {
        const energy = t.size * this.costPerByte;
        aggregateEnergy += energy;
        return {
          hash: t.hash,
          size: t.size,
          energy,
        };
      },
    );

    return {
      hash: blockInfo.data.hash,
      tx: transactions,
      energy: aggregateEnergy,
    };
  };
}
