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
};

export interface IInfo {
  block(hash: string): Promise<Result<Block>>;
  blocksOnDay(date: number): Promise<Result<Block[]>>;
}
