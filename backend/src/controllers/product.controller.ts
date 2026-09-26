import { Request, Response, NextFunction } from "express";
import { Product } from "../models/product.model.js";
import { Category, slugify } from "../models/category.model.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../utils/validators.js";

// GET /api/products (Public with Search, Filter, Sort, Pagination)
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      sort,
      featured,
      page = "1",
      limit = "12",
    } = req.query;

    const query: Record<string, any> = { isActive: true };

    // 1. Text Search (Name or Description)
    if (search && typeof search === "string" && search.trim() !== "") {
      // Escape special regex characters to prevent ReDoS injection and cap search query length
      const sanitized = search
        .trim()
        .slice(0, 80)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: sanitized, $options: "i" } },
        { description: { $regex: sanitized, $options: "i" } },
      ];
    }

    // 2. Category Filter (by Category ObjectId or Slug)
    if (category && typeof category === "string") {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const foundCategory = await Category.findOne({ slug: category });
        if (foundCategory) {
          query.category = foundCategory._id;
        }
      }
    }

    // 3. Price Range Filtering
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 4. Featured Flag
    if (featured === "true") {
      query.isFeatured = true;
    }

    // 5. Sorting Setup
    let sortOptions: Record<string, any> = { createdAt: -1 }; // default newest
    if (sort === "price-asc") sortOptions = { price: 1 };
    if (sort === "price-desc") sortOptions = { price: -1 };
    if (sort === "rating") sortOptions = { rating: -1 };
    if (sort === "name-asc") sortOptions = { name: 1 };

    // 6. Pagination
    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNumber = Math.max(1, parseInt(limit as string, 10) || 12);
    const skip = (pageNumber - 1) * limitNumber;

    const totalProducts = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limitNumber),
      currentPage: pageNumber,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:slug (Public by Slug)
export const getProductBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true,
    }).populate("category", "name slug description");

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/products (Admin Only)
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validationResult = createProductSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const {
      name,
      description,
      price,
      discountPrice,
      images,
      category,
      stock,
      isFeatured,
      isActive,
    } = validationResult.data;

    // Validate if Category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      res.status(404).json({
        success: false,
        message: "Assigned category does not exist",
      });
      return;
    }

    // Validate discount price logic
    if (discountPrice && discountPrice >= price) {
      res.status(400).json({
        success: false,
        message: "Discount price must be less than the regular price",
      });
      return;
    }

    const generatedSlug = slugify(name);

    // Prevent slug conflicts by appending a unique timestamp if needed
    let finalSlug = generatedSlug;
    const existingProduct = await Product.findOne({ slug: generatedSlug });
    if (existingProduct) {
      finalSlug = `${generatedSlug}-${Date.now().toString().slice(-4)}`;
    }

    const product = await Product.create({
      name,
      slug: finalSlug,
      description,
      price,
      discountPrice,
      images,
      category,
      stock,
      isFeatured: isFeatured || false,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/products/:id (Admin Only)
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validationResult = updateProductSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    const data = validationResult.data;

    // If updating category, check existence
    if (data.category) {
      const categoryDoc = await Category.findById(data.category);
      if (!categoryDoc) {
        res.status(404).json({
          success: false,
          message: "Assigned category does not exist",
        });
        return;
      }
      product.category = categoryDoc._id as any;
    }

    // Validate relative prices
    const targetPrice = data.price !== undefined ? data.price : product.price;
    const targetDiscount =
      data.discountPrice !== undefined
        ? data.discountPrice
        : product.discountPrice;

    if (targetDiscount && targetDiscount >= targetPrice) {
      res.status(400).json({
        success: false,
        message: "Discount price must be lower than the price",
      });
      return;
    }

    if (data.name && data.name !== product.name) {
      product.name = data.name;
      product.slug = slugify(data.name);
    }

    if (data.description !== undefined) product.description = data.description;
    if (data.price !== undefined) product.price = data.price;
    if (data.discountPrice !== undefined)
      product.discountPrice = data.discountPrice;
    if (data.images !== undefined) product.images = data.images;
    if (data.stock !== undefined) product.stock = data.stock;
    if (data.isFeatured !== undefined) product.isFeatured = data.isFeatured;
    if (data.isActive !== undefined) product.isActive = data.isActive;

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id (Admin Only)
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
