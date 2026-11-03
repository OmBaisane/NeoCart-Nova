import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { recalculateCart, type ICart } from "./cart.model";

describe("recalculateCart", () => {
  it("calculates total item quantity and subtotal", () => {
    const cart = {
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 100,
        },
        {
          product: new mongoose.Types.ObjectId(),
          quantity: 3,
          price: 50,
        },
      ],
      totalItems: 0,
      subtotal: 0,
    } as unknown as ICart;

    recalculateCart(cart);

    expect(cart.totalItems).toBe(5);
    expect(cart.subtotal).toBe(350);
  });

  it("rounds subtotal to two decimal places", () => {
    const cart = {
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          quantity: 3,
          price: 10.333,
        },
      ],
      totalItems: 0,
      subtotal: 0,
    } as unknown as ICart;

    recalculateCart(cart);

    expect(cart.totalItems).toBe(3);
    expect(cart.subtotal).toBe(31);
  });

  it("resets totals for an empty cart", () => {
    const cart = {
      items: [],
      totalItems: 5,
      subtotal: 500,
    } as unknown as ICart;

    recalculateCart(cart);

    expect(cart.totalItems).toBe(0);
    expect(cart.subtotal).toBe(0);
  });

  it("updates previously calculated totals", () => {
    const cart = {
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          quantity: 4,
          price: 25,
        },
      ],
      totalItems: 1,
      subtotal: 10,
    } as unknown as ICart;

    recalculateCart(cart);

    expect(cart.totalItems).toBe(4);
    expect(cart.subtotal).toBe(100);
  });
});
