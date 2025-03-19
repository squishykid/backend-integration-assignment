import * as RawLatestBlock from "./samples/0000000000000000000050af9f3e367620a434fc86c7fbd5b0d9c42bef6649bd.json";
import * as RawPreviousBlock from "./samples/000000000000000000023fa87ab8d2ad9f50a2596f7310086da858b32fe788dc.json";
import * as LatestBlock from "./samples/latestblock.json";
import * as BlocksOnDaySample from "./samples/blocksonday.json"
import { BlocksOnDaySchema, LatestBlockSchema, RawBlockSchema } from "./blockchain.types";

describe("blockchain api types", () => {
  it.each([
    [
      "latest",
      "0000000000000000000050af9f3e367620a434fc86c7fbd5b0d9c42bef6649bd",
      RawLatestBlock,
    ],
    [
      "previous",
      "000000000000000000023fa87ab8d2ad9f50a2596f7310086da858b32fe788dc",
      RawPreviousBlock,
    ],
  ])("parses raw block %s", (_, hash, blob) => {
    const res = RawBlockSchema.safeParse(blob);
    expect(res.success).toBeTruthy();
    expect(res.data?.hash).toEqual(hash);
  });

  it("parses latest endpoint", () => {
    const res = LatestBlockSchema.safeParse(LatestBlock);
    expect(res.success).toBeTruthy();
    expect(res.data?.hash).toEqual(
      "00000000000000000001fe0e3cfeb6adce1fb7ea63d723173366ce30cc0c77b2",
    );
  });

  it("parses blocks-on-day endpoint", () => {
    const res = BlocksOnDaySchema.safeParse(BlocksOnDaySample.wrapper);
    expect(res.success).toBeTruthy();
    expect(res.data?.length).toEqual(9)
  })
});
