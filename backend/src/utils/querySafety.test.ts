import { describe, expect, it } from "vitest";
import { boundedPositiveInt, escapeRegex } from "./querySafety";

describe("escapeRegex", () => {
  it("escapes regex special characters", () => {
    expect(escapeRegex("phone+(new). [model]")).toBe(
      "phone\\+\\(new\\)\\. \\[model\\]",
    );
  });

  it("keeps ordinary text unchanged", () => {
    expect(escapeRegex("smart phone")).toBe("smart phone");
  });

  it("escapes every special regex character", () => {
    expect(escapeRegex(".*+?^${}()|[]\\")).toBe(
      "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\",
    );
  });
});

describe("boundedPositiveInt", () => {
  it("parses a valid positive integer string", () => {
    expect(boundedPositiveInt("25", 10, 100)).toBe(25);
  });

  it("returns the fallback for non-string input", () => {
    expect(boundedPositiveInt(25, 10, 100)).toBe(10);
    expect(boundedPositiveInt(null, 10, 100)).toBe(10);
  });

  it("returns the fallback for invalid numeric strings", () => {
    expect(boundedPositiveInt("0", 10, 100)).toBe(10);
    expect(boundedPositiveInt("-5", 10, 100)).toBe(10);
    expect(boundedPositiveInt("2.5", 10, 100)).toBe(10);
    expect(boundedPositiveInt("abc", 10, 100)).toBe(10);
    expect(boundedPositiveInt("", 10, 100)).toBe(10);
  });

  it("clamps values to the configured maximum", () => {
    expect(boundedPositiveInt("500", 10, 100)).toBe(100);
  });

  it("rejects unsafe integers", () => {
    expect(boundedPositiveInt("999999999999999999999", 10, 100)).toBe(10);
  });
});
