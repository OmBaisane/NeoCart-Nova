import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  phone: z.string().trim().optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name cannot exceed 50 characters"),
  description: z.string().trim().optional(),
  image: z.string().trim().optional(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name cannot exceed 50 characters")
    .optional(),
  description: z.string().trim().optional(),
  image: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(150, "Product name cannot exceed 150 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Product description must be at least 10 characters"),
  price: z.number().min(0, "Price cannot be negative"),
  discountPrice: z
    .number()
    .min(0, "Discount price cannot be negative")
    .optional(),
  images: z
    .array(z.string().url("Each image must be a valid URL"))
    .min(1, "At least one product image is required"),
  category: z.string().trim().min(1, "Category ID is required"),
  stock: z
    .number()
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative"),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(150, "Product name cannot exceed 150 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, "Product description must be at least 10 characters")
    .optional(),
  price: z.number().min(0, "Price cannot be negative").optional(),
  discountPrice: z
    .number()
    .min(0, "Discount price cannot be negative")
    .optional(),
  images: z
    .array(z.string().url("Each image must be a valid URL"))
    .min(1, "At least one product image is required")
    .optional(),
  category: z.string().trim().min(1, "Category ID is required").optional(),
  stock: z
    .number()
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative")
    .optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
