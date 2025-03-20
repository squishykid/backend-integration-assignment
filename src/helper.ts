export const canonicalMidnight = (timeMs: number): number => {
  return new Date(timeMs).setHours(0, 0, 0, 0);
};
