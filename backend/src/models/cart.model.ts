import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
  price: number; // Trusted snapshot price when added/updated
}

export interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  totalItems: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Item quantity is required"],
      min: [1, "Quantity cannot be less than 1"],
      default: 1,
    },
    price: {
      type: Number,
      required: [true, "Item price is required"],
      min: [0, "Price cannot be negative"],
    },
  },
  { _id: false },
);

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Cart must belong to a user"],
      unique: true, // Exactly one active cart per user
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    totalItems: {
      type: Number,
      default: 0,
      min: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Helper function to recalculate cart metrics server-side
export const recalculateCart = (cart: ICart): void => {
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.subtotal = cart.items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );
  // Clean decimal precision
  cart.subtotal = Math.round(cart.subtotal * 100) / 100;
};

export const Cart: Model<ICart> = mongoose.model<ICart>("Cart", cartSchema);
