import { ICache } from "./client/cache.type";
import { IBlockchain } from "./client/blockchain.types";

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
