import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { slugify } from "./category.model.js";

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category: Types.ObjectId;
  stock: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [150, "Product name cannot exceed 150 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPrice: {
      type: Number,
      min: [0, "Discount price cannot be negative"],
      validate: {
        validator: function (this: IProduct, val: number) {
          // Discount price must be lower than original price
          return !val || val < this.price;
        },
        message: "Discount price ({VALUE}) must be lower than original price",
      },
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (val: string[]) {
          return val.length > 0;
        },
        message: "A product must have at least one image",
      },
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
      index: true,
    },
    stock: {
      type: Number,
      required: [true, "Stock count is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot be more than 5"],
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save hook: auto-generate slug if name is modified
productSchema.pre<IProduct>("save", async function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name);
  }
});

export const Product: Model<IProduct> = mongoose.model<IProduct>(
  "Product",
  productSchema,
);
