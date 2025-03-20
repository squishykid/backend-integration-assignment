import { ICache } from "./client/cache.type";
import { IBlockchain } from "./client/blockchain.types";
import { IInfo } from "./feature/blockchain_info/info.type";

export const mockCache = (): ICache => {
  return {
    getBlock: jest.fn(),
    upsertBlock: jest.fn(),
    getDay: jest.fn(),
    upsertDay: jest.fn(),
  };
};

export const mockBlockchain = (): IBlockchain => ({
  getBlock: jest.fn(),
  getBlocksForDay: jest.fn(),
});

export const mockInfo = (): IInfo => ({
  block: jest.fn(),
  txBytesOnDay: jest.fn(),
});
