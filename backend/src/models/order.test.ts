import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { Order } from "./order.model";

const validOrder = () => ({
  user: new mongoose.Types.ObjectId(),
  items: [
    {
      product: new mongoose.Types.ObjectId(),
      name: "Wireless Headphones",
      image: "https://example.com/headphones.jpg",
      price: 2999,
      quantity: 2,
    },
  ],
  shippingAddress: {
    fullName: "Om Baisane",
    phone: "9876543210",
    address: "123 Main Street",
    city: "Surat",
    state: "Gujarat",
    pincode: "395001",
  },
  subtotal: 5998,
  shippingFee: 0,
  discount: 0,
  total: 5998,
  trackingNumber: "TRACK123",
});

describe("Order model", () => {
  it("accepts a valid order", async () => {
    const order = new Order(validOrder());

    await expect(order.validate()).resolves.toBeUndefined();
  });

  it("requires a user reference", async () => {
    const order = new Order({
      ...validOrder(),
      user: undefined,
    });

    await expect(order.validate()).rejects.toThrow();
  });

  it("rejects orders without items", async () => {
    const order = new Order({
      ...validOrder(),
      items: [],
    });

    await expect(order.validate()).rejects.toThrow();
  });

  it("rejects fractional item quantities", async () => {
    const order = new Order({
      ...validOrder(),
      items: [
        {
          ...validOrder().items[0],
          quantity: 1.5,
        },
      ],
    });

    await expect(order.validate()).rejects.toThrow();
  });

  it("rejects zero item quantities", async () => {
    const order = new Order({
      ...validOrder(),
      items: [
        {
          ...validOrder().items[0],
          quantity: 0,
        },
      ],
    });

    await expect(order.validate()).rejects.toThrow();
  });

  it("rejects negative order totals", async () => {
    const order = new Order({
      ...validOrder(),
      total: -100,
    });

    await expect(order.validate()).rejects.toThrow();
  });

  it("allows only COD payment method", async () => {
    const order = new Order({
      ...validOrder(),
      paymentMethod: "ONLINE",
    });

    await expect(order.validate()).rejects.toThrow();
  });

  it("applies default order values", () => {
    const order = new Order(validOrder());

    expect(order.paymentMethod).toBe("COD");
    expect(order.paymentStatus).toBe("pending");
    expect(order.orderStatus).toBe("pending");
    expect(order.inventoryRestocked).toBe(false);
  });

  it("normalizes tracking number to uppercase", async () => {
    const order = new Order({
      ...validOrder(),
      trackingNumber: "track123",
    });

    await order.validate();

    expect(order.trackingNumber).toBe("TRACK123");
  });
});
