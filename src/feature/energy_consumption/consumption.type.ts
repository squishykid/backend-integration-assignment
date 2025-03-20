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

export type EnergyOnDay = {
  dayInMs: number;
  daysAgo: number;
  energy: number;
};

export interface IConsumption {
  getConsumptionPerTransaction(hash: string): Promise<BlockWithConsumption>;
  getConsumptionForLastDays(n: number): Promise<EnergyOnDay[]>;
}
