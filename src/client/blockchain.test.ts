import nock from "nock";
import * as NotFound from "./samples/00000100000000000000c9b43bcabdb0090376d569fb0c44ab0d22b1e6931836.json";
import * as LatestBlock from "./samples/0000000000000000000050af9f3e367620a434fc86c7fbd5b0d9c42bef6649bd.json";
import * as PreviousBlock from "./samples/000000000000000000023fa87ab8d2ad9f50a2596f7310086da858b32fe788dc.json";
import { Blockchain } from "./blockchain";
import { isAxiosError } from "axios";
import { Outcome } from "../helper.type";

describe("Blockchain API client", () => {
  type BlockchainTestCase = {
    blockHash: string;
    blockData: Record<string, unknown>;
    responseCode: number;
    niceName: string;
  };
  const successCases: BlockchainTestCase[] = [
    {
      blockHash:
        "0000000000000000000050af9f3e367620a434fc86c7fbd5b0d9c42bef6649bd",
      blockData: LatestBlock,
      responseCode: 200,
      niceName: "latest",
    },
    {
      blockHash:
        "000000000000000000023fa87ab8d2ad9f50a2596f7310086da858b32fe788dc",
      blockData: PreviousBlock,
      responseCode: 200,
      niceName: "previous",
    },
  ];

  describe.each(successCases)(
    "successful $niceName $responseCode",
    (tc: BlockchainTestCase) => {
      beforeEach(() => {
        nock("https://blockchain.info")
          .get(`/rawblock/${tc.blockHash}`)
          .reply(tc.responseCode, tc.blockData);
      });

      afterEach(() => {
        expect(nock.isDone()).toBeTruthy();
      });

      it("should get latest block", async () => {
        const client = new Blockchain("https://blockchain.info");
        const res = await client.getBlock(tc.blockHash);
        expect(res).toBeTruthy();
      });
    },
  );

  const errorCases: BlockchainTestCase[] = [
    {
      blockHash:
        "00000100000000000000c9b43bcabdb0090376d569fb0c44ab0d22b1e6931836",
      blockData: NotFound,
      responseCode: 404,
      niceName: "not found",
    },
    {
      blockHash:
        "00000100000000000000c9b43bcabdb0090376d569fb0c44ab0d22b1e6931836",
      blockData: { very: "wrong" },
      responseCode: 200,
      niceName: "invalid response",
    },
  ];

  describe.each(errorCases)(
    "error case $niceName $responseCode",
    (tc: BlockchainTestCase) => {
      beforeEach(() => {
        nock("https://blockchain.info")
          .get(`/rawblock/${tc.blockHash}`)
          .reply(tc.responseCode, tc.blockData);
      });

      afterEach(() => {
        expect(nock.isDone()).toBeTruthy();
      });

      it("should handle error case", async () => {
        const client = new Blockchain("https://blockchain.info");
        const res = await client.getBlock(tc.blockHash);
        expect(res.result).toEqual(Outcome.Error);
      });
    },
  );

  describe("should handle retries", () => {
    afterEach(() => {
      expect(nock.isDone()).toBeTruthy();
    });

    it("should retry on 429", async () => {
      const blockHash =
        "00000100000000000000c9b43bcabdb0090376d569fb0c44ab0d22b1e6931836";
      const blockData = { very: "wrong" };
      nock("https://blockchain.info")
        .get(`/rawblock/${blockHash}`)
        .reply(429, blockData);
      nock("https://blockchain.info")
        .get(`/rawblock/${blockHash}`)
        .reply(429, blockData);
      nock("https://blockchain.info")
        .get(`/rawblock/${blockHash}`)
        .reply(429, blockData);
      nock("https://blockchain.info")
        .get(`/rawblock/${blockHash}`)
        .reply(429, blockData);

      const client = new Blockchain("https://blockchain.info");
      const res = await client.getBlock(blockHash);
      expect(res.result).toEqual(Outcome.Error);
      if (res.result === Outcome.Error && isAxiosError(res.error)) {
        expect(res.error.status).toEqual(429);
      } else {
        // unable to narrow types with jest yet
        expect(true).toBeFalsy();
      }
    });

    it("should eventually succeed after 429", async () => {
      const blockHash =
        "0000000000000000000050af9f3e367620a434fc86c7fbd5b0d9c42bef6649bd";
      const blockData = { very: "wrong" };
      nock("https://blockchain.info")
        .get(`/rawblock/${blockHash}`)
        .reply(429, blockData);
      nock("https://blockchain.info")
        .get(`/rawblock/${blockHash}`)
        .reply(429, blockData);
      nock("https://blockchain.info")
        .get(`/rawblock/${blockHash}`)
        .reply(429, blockData);
      nock("https://blockchain.info")
        .get(`/rawblock/${blockHash}`)
        .reply(200, LatestBlock);

      const client = new Blockchain("https://blockchain.info");
      const res = await client.getBlock(blockHash);
      expect(res.result).toEqual(Outcome.Success);
      if (res.result === Outcome.Success) {
        expect(res.data.hash).toEqual(blockHash);
      } else {
        // unable to narrow types with jest yet
        expect(true).toBeFalsy();
      }
    });
  });
});
