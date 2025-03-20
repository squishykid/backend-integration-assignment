export const canonicalMidnight = (timeMs: number | Date): number => {
  /*
  Help us decide on a canonical time stamp for a specific day.
  This takes a time in ms and returns the unix timestamp for
   the previous midnight in UTC.
   */
  const offset = new Date().getTimezoneOffset() * 1000 * 60;
  return new Date(timeMs).setHours(0, 0, 0, 0) - offset;
};
