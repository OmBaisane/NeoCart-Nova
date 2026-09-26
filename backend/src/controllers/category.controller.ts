import { Request, Response, NextFunction } from "express";
import { Category, slugify } from "../models/category.model.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../utils/validators.js";
import { Product } from "../models/product.model.js";

// GET /api/categories (Public)
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Customers only see active categories, admins can see all via query
    const filter = req.query.all === "true" ? {} : { isActive: true };
    const categories = await Category.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/:id (Public)
export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/categories (Admin Only)
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validationResult = createCategorySchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const { name, description, image } = validationResult.data;
    const generatedSlug = slugify(name);

    const existingCategory = await Category.findOne({
      $or: [{ name }, { slug: generatedSlug }],
    });

    if (existingCategory) {
      res.status(409).json({
        success: false,
        message: "Category with this name already exists",
      });
      return;
    }

    const category = await Category.create({
      name,
      slug: generatedSlug,
      description: description || "",
      image: image || "",
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/categories/:id (Admin Only)
export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validationResult = updateCategorySchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    const { name, description, image, isActive } = validationResult.data;

    if (name && name !== category.name) {
      const duplicate = await Category.findOne({
        name,
        _id: { $ne: category._id },
      });
      if (duplicate) {
        res.status(409).json({
          success: false,
          message: "Another category with this name already exists",
        });
        return;
      }
      category.name = name;
      category.slug = slugify(name);
    }

    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const categoryId = req.params.id;

    // Check if any product is associated with this category
    const linkedProductsCount = await Product.countDocuments({
      category: categoryId,
    });

    if (linkedProductsCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete category. There are ${linkedProductsCount} product(s) linked to it.`,
      });
      return;
    }

    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
