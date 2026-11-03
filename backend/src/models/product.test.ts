import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { Product } from "./product.model";

const validProduct = () => ({
  name: "Wireless Headphones",
  slug: "wireless-headphones",
  description: "Comfortable wireless headphones with clear sound.",
  price: 2999,
  images: ["https://example.com/headphones.jpg"],
  category: new mongoose.Types.ObjectId(),
  stock: 15,
});

describe("Product model", () => {
  it("accepts a valid product", async () => {
    const product = new Product(validProduct());

    await expect(product.validate()).resolves.toBeUndefined();
  });

  it("requires a product name", async () => {
    const product = new Product({
      ...validProduct(),
      name: "",
    });

    await expect(product.validate()).rejects.toThrow();
  });

  it("rejects negative prices", async () => {
    const product = new Product({
      ...validProduct(),
      price: -10,
    });

    await expect(product.validate()).rejects.toThrow();
  });

  it("rejects a discount price equal to regular price", async () => {
    const product = new Product({
      ...validProduct(),
      discountPrice: 2999,
    });

    await expect(product.validate()).rejects.toThrow();
  });

  it("rejects a discount price above regular price", async () => {
    const product = new Product({
      ...validProduct(),
      discountPrice: 3500,
    });

    await expect(product.validate()).rejects.toThrow();
  });

  it("accepts a valid discount price", async () => {
    const product = new Product({
      ...validProduct(),
      discountPrice: 2499,
    });

    await expect(product.validate()).resolves.toBeUndefined();
  });

  it("rejects products without images", async () => {
    const product = new Product({
      ...validProduct(),
      images: [],
    });

    await expect(product.validate()).rejects.toThrow();
  });

  it("rejects negative stock", async () => {
    const product = new Product({
      ...validProduct(),
      stock: -1,
    });

    await expect(product.validate()).rejects.toThrow();
  });

  it("rejects fractional stock", async () => {
    const product = new Product({
      ...validProduct(),
      stock: 1.5,
    });

    await expect(product.validate()).rejects.toThrow();
  });

  it("applies default values", () => {
    const product = new Product(validProduct());

    expect(product.rating).toBe(0);
    expect(product.reviewCount).toBe(0);
    expect(product.isFeatured).toBe(false);
    expect(product.isActive).toBe(true);
  });
});
