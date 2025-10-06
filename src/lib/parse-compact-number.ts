import numeral from "numeral";

export const parseCompactNumber = (input: unknown): number | null => {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input !== "string") return null;

  const cleaned = input.trim().replace(/[,\s$€£¥]/g, "");
  if (cleaned === "") return 0;

  const v = numeral(cleaned).value();
  return v === null ? null : v;
};
