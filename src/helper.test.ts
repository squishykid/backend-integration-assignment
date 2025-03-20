import { canonicalMidnight } from "./helper";

describe("helper tests", () => {
  it("finds midnight", () => {
    const test = new Date("2018-04-01T17:44:32+00:00");
    const maybeMidnight = canonicalMidnight(test);
    const definitelyMidnight = 1522537200000;
    expect(maybeMidnight).toEqual(definitelyMidnight);
  });
});
