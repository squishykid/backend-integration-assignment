import {
  BlockWithConsumption,
  IConsumption,
  LastNDaysConsumption,
  TransactionWithConsumption,
} from "./consumption.type";
import { isErr } from "../../helper.type";
import { IInfo } from "../blockchain_info/info.type";
import { canonicalMidnight } from "../../helper";

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
    const canonicalTimeNow = canonicalMidnight(timeNowMs + dayLenInMs);

    let consumption = 0;
    for (let j = 0; j < n; j++) {
      const dayInMs = canonicalTimeNow - dayLenInMs * j;
      const txBytesOnDay = await this.#info.txBytesOnDay(dayInMs);
      if (isErr(txBytesOnDay)) {
        throw txBytesOnDay.error;
      }
      consumption += txBytesOnDay.data * this.costPerByte;
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

    const transactions: TransactionWithConsumption[] = blockInfo.data.tx.map(
      (t) => {
        const energy = t.size * this.costPerByte;
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
      energy: blockInfo.data.txSize * this.costPerByte,
    };
  };
}
