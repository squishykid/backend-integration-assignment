import {
  BlockWithConsumption,
  EnergyOnDay,
  IConsumption,
  TransactionWithConsumption,
} from "./consumption.type";
import { isErr, ok, Result } from "../../helper.type";
import { IInfo } from "../blockchain_info/info.type";
import { canonicalMidnight } from "../../helper";

export class Consumption implements IConsumption {
  readonly #info: IInfo;
  readonly costPerByte: number;

  constructor(info: IInfo, costPerByte: number) {
    this.#info = info;
    this.costPerByte = costPerByte;
  }

  getConsumptionForLastDays = async (n: number): Promise<EnergyOnDay[]> => {
    const timeNowMs = Date.now();
    const dayLenInMs = 1000 * 60 * 60 * 24;

    /*
    'now' is the next midnight
     */
    const canonicalTimeNow = canonicalMidnight(timeNowMs + dayLenInMs);

    const work: Promise<Result<EnergyOnDay>>[] = [];
    for (let j = 0; j < n; j++) {
      const dayInMs = canonicalTimeNow - dayLenInMs * j;
      const w: () => Promise<Result<EnergyOnDay>> = async () => {
        const r = await this.#info.txBytesOnDay(dayInMs);
        if (isErr(r)) {
          return r;
        }
        const data: EnergyOnDay = {
          dayInMs,
          daysAgo: j,
          energy: r.data,
        };
        return ok(data);
      };
      work.push(w());
    }

    const completed = await Promise.all(work);
    const res: EnergyOnDay[] = [];
    for (const c of completed) {
      if (isErr(c)) {
        throw c.error;
      }
      res.push(c.data);
    }
    return res;
  };

  getConsumptionPerTransaction = async (
    hash: string,
  ): Promise<BlockWithConsumption> => {
    const blockInfo = await this.#info.block(hash);
    if (isErr(blockInfo)) {
      throw new Error("unable to complete request, please try again", {
        cause: blockInfo.error,
      });
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
