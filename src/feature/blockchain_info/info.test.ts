import { Info } from "./info";
import { isErr, isOk, Outcome } from "../../helper.type";
import { Block } from "./info.type";
import { when } from "jest-when";
import { mockBlockchain, mockCache } from "../../testHelpers";
import { RawBlock } from "../../client/blockchain.types";

describe("info", () => {
  describe("block", () => {
    it("queries cache for existing block", async () => {
      const testBlock: Block = {
        hash: "goodhash",
        prevBlock: "prevhash",
        size: 1024,
        time: 23,
        tx: [],
        txSize: 800,
      };
      const b = mockBlockchain();
      const c = mockCache();
      when(c.getBlock).calledWith("goodhash").mockResolvedValue({
        result: Outcome.Success,
        data: testBlock,
      });

      const info = new Info(b, c);

      const result = await info.block("goodhash");

      expect(result.result).toBe(Outcome.Success);
      if (isOk(result)) {
        expect(result.data).toEqual(testBlock);
      } else {
        expect(true).toBeFalsy();
      }
    });

    it("returns error when api call fails", async () => {
      const b = mockBlockchain();
      when(b.getBlock).calledWith("badhash").mockResolvedValue({
        result: Outcome.Error,
        error: "whoopsie",
      });
      const c = mockCache();
      when(c.getBlock).calledWith("badhash").mockResolvedValue({
        result: Outcome.Error,
        error: null,
      });

      const info = new Info(b, c);
      const result = await info.block("badhash");

      expect(result.result).toBe(Outcome.Error);
      if (isErr(result)) {
        expect(result.error).toEqual(
          new Error("Unable to get block with this hash"),
        );
      } else {
        expect(true).toBeFalsy();
      }
    });

    it("stores block in cache when retrieved from api", async () => {
      const testBlock: RawBlock = {
        hash: "goodhash",
        prev_block: "prevhash",
        next_block: [],
        size: 1024,
        time: 23,
        tx: [],
      };
      const b = mockBlockchain();
      when(b.getBlock).calledWith("badhash").mockResolvedValue({
        result: Outcome.Success,
        data: testBlock,
      });
      const c = mockCache();
      when(c.getBlock).calledWith("badhash").mockResolvedValue({
        result: Outcome.Error,
        error: null,
      });

      const info = new Info(b, c);
      const result = await info.block("badhash");

      expect(result.result).toBe(Outcome.Success);
      expect(c.upsertBlock).toHaveBeenCalledTimes(1);
      expect(c.upsertBlock).toHaveBeenCalledWith({
        hash: "goodhash",
        prevBlock: "prevhash",
        size: 1024,
        time: 23,
        tx: [],
        txSize: 0,
      });
    });

    it("returns block after storing it in cache", async () => {
      const testBlock: RawBlock = {
        hash: "goodhash",
        prev_block: "prevhash",
        next_block: [],
        size: 1024,
        time: 23,
        tx: [],
      };
      const b = mockBlockchain();
      when(b.getBlock).calledWith("badhash").mockResolvedValue({
        result: Outcome.Success,
        data: testBlock,
      });
      const c = mockCache();
      when(c.getBlock).calledWith("badhash").mockResolvedValue({
        result: Outcome.Error,
        error: null,
      });

      const info = new Info(b, c);
      const result = await info.block("badhash");

      expect(result.result).toBe(Outcome.Success);
      if (isErr(result)) {
        expect(true).toBeFalsy();
        return;
      }
      expect(result.data).toEqual({
        hash: "goodhash",
        prevBlock: "prevhash",
        size: 1024,
        time: 23,
        tx: [],
        txSize: 0,
      });
    });
  });
});
