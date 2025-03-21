import { Result } from "../../helper.type";

export type Transaction = {
  hash: string;
  size: number;
};

export type Block = {
  hash: string;
  prevBlock: string;
  time: number;
  tx: Transaction[];
  size: number;
  txSize: number;
};

export interface IInfo {
  block(hash: string): Promise<Result<Block>>;
  txBytesOnDay(date: number): Promise<Result<number>>;
}
