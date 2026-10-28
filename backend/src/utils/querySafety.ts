/** Escape user-provided text before using it as a literal MongoDB regex. */
export const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Parse a positive integer query parameter and clamp it to a safe maximum. */
export const boundedPositiveInt = (
  value: unknown,
  fallback: number,
  maximum: number,
): number => {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
};
