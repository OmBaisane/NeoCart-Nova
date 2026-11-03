import { describe, expect, it } from "vitest";
import {
  registerSchema,
  loginSchema,
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
  addToCartSchema,
  updateCartItemSchema,
  shippingAddressSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  ALLOWED_STATUS_TRANSITIONS,
  createReviewSchema,
  updateReviewSchema,
  updateProfileSchema,
  updatePasswordSchema,
} from "./validators";

const validProduct = {
  name: "Wireless Headphones",
  description: "Comfortable wireless headphones with clear sound.",
  price: 2999,
  images: ["https://example.com/headphones.jpg"],
  category: "507f1f77bcf86cd799439011",
  stock: 15,
};

const validAddress = {
  fullName: "Om Baisane",
  phone: "9876543210",
  address: "123 Main Street",
  city: "Surat",
  state: "Gujarat",
  pincode: "395001",
};

describe("Authentication validators", () => {
  it("normalizes registration name and email", () => {
    const result = registerSchema.safeParse({
      name: "  Om Baisane  ",
      email: "  OM@EXAMPLE.COM  ",
      password: "password123",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe("Om Baisane");
      expect(result.data.email).toBe("om@example.com");
    }
  });

  it("rejects short names and passwords during registration", () => {
    expect(
      registerSchema.safeParse({
        name: "O",
        email: "om@example.com",
        password: "123",
      }).success,
    ).toBe(false);
  });

  it("normalizes login email", () => {
    const result = loginSchema.safeParse({
      email: " OM@EXAMPLE.COM ",
      password: "password123",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("om@example.com");
    }
  });

  it("rejects invalid login email and empty password", () => {
    expect(
      loginSchema.safeParse({
        email: "invalid-email",
        password: "password123",
      }).success,
    ).toBe(false);

    expect(
      loginSchema.safeParse({
        email: "om@example.com",
        password: "",
      }).success,
    ).toBe(false);
  });
});

describe("Category validators", () => {
  it("accepts and trims a valid category", () => {
    const result = createCategorySchema.safeParse({
      name: "  Electronics  ",
      description: "  Electronic products  ",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe("Electronics");
      expect(result.data.description).toBe("Electronic products");
    }
  });

  it("rejects category names shorter than two characters", () => {
    expect(createCategorySchema.safeParse({ name: "A" }).success).toBe(false);
  });

  it("rejects an empty category update", () => {
    expect(updateCategorySchema.safeParse({}).success).toBe(false);
  });

  it("accepts a partial category update", () => {
    expect(updateCategorySchema.safeParse({ isActive: false }).success).toBe(
      true,
    );
  });
});

describe("Product validators", () => {
  it("accepts a valid product", () => {
    expect(createProductSchema.safeParse(validProduct).success).toBe(true);
  });

  it("rejects invalid category IDs", () => {
    expect(
      createProductSchema.safeParse({
        ...validProduct,
        category: "invalid-id",
      }).success,
    ).toBe(false);
  });

  it("rejects negative prices and stock", () => {
    expect(
      createProductSchema.safeParse({
        ...validProduct,
        price: -1,
      }).success,
    ).toBe(false);

    expect(
      createProductSchema.safeParse({
        ...validProduct,
        stock: -1,
      }).success,
    ).toBe(false);
  });

  it("rejects discount prices equal to or above regular price", () => {
    expect(
      createProductSchema.safeParse({
        ...validProduct,
        discountPrice: 2999,
      }).success,
    ).toBe(false);

    expect(
      createProductSchema.safeParse({
        ...validProduct,
        discountPrice: 3500,
      }).success,
    ).toBe(false);
  });

  it("accepts a valid discount price", () => {
    expect(
      createProductSchema.safeParse({
        ...validProduct,
        discountPrice: 2499,
      }).success,
    ).toBe(true);
  });

  it("rejects an empty product update", () => {
    expect(updateProductSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a valid partial product update", () => {
    expect(updateProductSchema.safeParse({ stock: 20 }).success).toBe(true);
  });
});

describe("Cart validators", () => {
  it("defaults add-to-cart quantity to one", () => {
    const result = addToCartSchema.safeParse({
      productId: "507f1f77bcf86cd799439011",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.quantity).toBe(1);
    }
  });

  it("accepts a valid product ID and quantity", () => {
    expect(
      addToCartSchema.safeParse({
        productId: "507f1f77bcf86cd799439011",
        quantity: 3,
      }).success,
    ).toBe(true);
  });

  it("rejects invalid product IDs and non-positive add quantities", () => {
    expect(
      addToCartSchema.safeParse({
        productId: "invalid",
        quantity: 1,
      }).success,
    ).toBe(false);

    expect(
      addToCartSchema.safeParse({
        productId: "507f1f77bcf86cd799439011",
        quantity: 0,
      }).success,
    ).toBe(false);
  });

  it("allows zero when updating cart quantity", () => {
    expect(updateCartItemSchema.safeParse({ quantity: 0 }).success).toBe(true);
  });

  it("rejects negative or fractional cart quantities", () => {
    expect(updateCartItemSchema.safeParse({ quantity: -1 }).success).toBe(
      false,
    );

    expect(updateCartItemSchema.safeParse({ quantity: 1.5 }).success).toBe(
      false,
    );
  });
});

describe("Order validators", () => {
  it("accepts a valid shipping address", () => {
    expect(shippingAddressSchema.safeParse(validAddress).success).toBe(true);
  });

  it("rejects an invalid shipping phone number", () => {
    expect(
      shippingAddressSchema.safeParse({
        ...validAddress,
        phone: "123",
      }).success,
    ).toBe(false);
  });

  it("defaults order payment method to COD", () => {
    const result = createOrderSchema.safeParse({
      shippingAddress: validAddress,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.paymentMethod).toBe("COD");
    }
  });

  it("accepts valid order status updates", () => {
    expect(
      updateOrderStatusSchema.safeParse({
        orderStatus: "shipped",
        trackingNumber: "TRACK123",
      }).success,
    ).toBe(true);
  });

  it("rejects unknown order status and unexpected fields", () => {
    expect(
      updateOrderStatusSchema.safeParse({
        orderStatus: "unknown",
      }).success,
    ).toBe(false);

    expect(
      updateOrderStatusSchema.safeParse({
        orderStatus: "shipped",
        unexpected: true,
      }).success,
    ).toBe(false);
  });

  it("defines valid order status transitions", () => {
    expect(ALLOWED_STATUS_TRANSITIONS.pending).toContain("confirmed");
    expect(ALLOWED_STATUS_TRANSITIONS.pending).toContain("cancelled");
    expect(ALLOWED_STATUS_TRANSITIONS.shipped).toEqual(["delivered"]);
    expect(ALLOWED_STATUS_TRANSITIONS.delivered).toEqual([]);
    expect(ALLOWED_STATUS_TRANSITIONS.cancelled).toEqual([]);
  });
});

describe("Review validators", () => {
  it("accepts a valid review", () => {
    expect(
      createReviewSchema.safeParse({
        rating: 5,
        comment: "Excellent product!",
      }).success,
    ).toBe(true);
  });

  it("rejects ratings outside the one-to-five range", () => {
    expect(
      createReviewSchema.safeParse({
        rating: 0,
        comment: "Not good",
      }).success,
    ).toBe(false);

    expect(
      createReviewSchema.safeParse({
        rating: 6,
        comment: "Excellent",
      }).success,
    ).toBe(false);
  });

  it("rejects an empty review update", () => {
    expect(updateReviewSchema.safeParse({}).success).toBe(false);
  });
});

describe("Profile and password validators", () => {
  it("rejects an empty profile update", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a valid profile update", () => {
    expect(updateProfileSchema.safeParse({ name: "Om Baisane" }).success).toBe(
      true,
    );
  });

  it("rejects an invalid avatar URL", () => {
    expect(updateProfileSchema.safeParse({ avatar: "not-a-url" }).success).toBe(
      false,
    );
  });

  it("requires a new password of at least eight characters", () => {
    expect(
      updatePasswordSchema.safeParse({
        currentPassword: "oldpassword",
        newPassword: "short",
      }).success,
    ).toBe(false);

    expect(
      updatePasswordSchema.safeParse({
        currentPassword: "oldpassword",
        newPassword: "newpassword123",
      }).success,
    ).toBe(true);
  });
});
