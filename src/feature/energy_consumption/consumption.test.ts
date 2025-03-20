import { mockInfo } from "../../testHelpers";
import { Consumption } from "./consumption";
import { when } from "jest-when";
import { ok } from "../../helper.type";
import { canonicalMidnight } from "../../helper";

jest.useFakeTimers();

describe("consumption", () => {
  describe("getConsumptionForLastDays", () => {
    it("gets consumption for 4 days", async () => {
      const energyPerByte = 4.56;
      const now = new Date();
      const dayLenInMs = 1000 * 60 * 60 * 24;
      const midnight = canonicalMidnight(now);
      jest.setSystemTime(now);

      const info = mockInfo();
      when(info.txBytesOnDay)
        .calledWith(midnight + dayLenInMs)
        .mockResolvedValue(ok(20));
      when(info.txBytesOnDay).calledWith(midnight).mockResolvedValue(ok(30));
      when(info.txBytesOnDay)
        .calledWith(midnight - dayLenInMs)
        .mockResolvedValue(ok(40));
      when(info.txBytesOnDay)
        .calledWith(midnight - dayLenInMs * 2)
        .mockResolvedValue(ok(50));

      const consumption = new Consumption(info, energyPerByte);
      const res = await consumption.getConsumptionForLastDays(4);
      expect(res.length).toEqual(4);
      expect(res[0]).toEqual({
        dayInMs: midnight + dayLenInMs,
        daysAgo: 0,
        energy: 20,
      });
      expect(res[1]).toEqual({
        dayInMs: midnight,
        daysAgo: 1,
        energy: 30,
      });
      expect(res[2]).toEqual({
        dayInMs: midnight - dayLenInMs,
        daysAgo: 2,
        energy: 40,
      });
      expect(res[3]).toEqual({
        dayInMs: midnight - dayLenInMs * 2,
        daysAgo: 3,
        energy: 50,
      });
      expect(info.txBytesOnDay).toHaveBeenCalledTimes(4);
    });

    it("gets consumption for 0 days", async () => {
      const energyPerByte = 4.56;
      const now = new Date();
      jest.setSystemTime(now);

      const info = mockInfo();
      when(info.txBytesOnDay).mockResolvedValue(ok(20));

      const consumption = new Consumption(info, energyPerByte);
      const res = await consumption.getConsumptionForLastDays(0);

      expect(res.length).toEqual(0);
      expect(info.txBytesOnDay).not.toHaveBeenCalled();
    });
  });
});
