import { describe, expect, it } from "vitest";
import { slugify } from "./category.model";

describe("slugify", () => {
  it("converts category names to lowercase slugs", () => {
    expect(slugify("Electronics")).toBe("electronics");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("Home Appliances")).toBe("home-appliances");
  });

  it("trims whitespace", () => {
    expect(slugify("  Men's Fashion  ")).toBe("mens-fashion");
  });

  it("removes special characters", () => {
    expect(slugify("Phones & Accessories!")).toBe("phones-accessories");
  });

  it("collapses repeated hyphens", () => {
    expect(slugify("Home---Decor")).toBe("home-decor");
  });

  it("handles empty input", () => {
    expect(slugify("   ")).toBe("");
  });
});
