import { Result } from "../../helper.type";

export type TransactionWithConsumption = {
  hash: string;
  size: number;
  energy: number;
};

export type BlockWithConsumption = {
  hash: string;
  energy: number;
  tx: TransactionWithConsumption[];
};

export type LastNDaysConsumption = {
  days: number;
  energy: number;
};

export interface IConsumption {
  getConsumptionPerTransaction(hash: string): Promise<BlockWithConsumption>;
  getConsumptionForLastDays(n: number): Promise<LastNDaysConsumption>;
}
