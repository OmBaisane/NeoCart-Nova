import { Request, Response, NextFunction } from "express";
import { Product } from "../models/product.model.js";
import mongoose from "mongoose";
import { Category, slugify } from "../models/category.model.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../utils/validators.js";
import { boundedPositiveInt, escapeRegex } from "../utils/querySafety.js";

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

    // Only products belonging to active categories are publicly visible.
    const activeCategoryIds = await Category.distinct("_id", {
      isActive: true,
    });

    const query: Record<string, unknown> = {
      isActive: true,
      category: { $in: activeCategoryIds },
    };

    if (req.query.inStock === "true") {
      query.stock = { $gt: 0 };
    }

    // 1. Text Search (Name or Description)
    if (search && typeof search === "string" && search.trim() !== "") {
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
      let selectedCategoryId: string | null = null;

      if (mongoose.Types.ObjectId.isValid(category)) {
        selectedCategoryId = category;
      } else {
        const foundCategory = await Category.findOne({
          slug: category,
          isActive: true,
        }).select("_id");

        selectedCategoryId = foundCategory?._id.toString() ?? null;
      }

      query.category = selectedCategoryId
        ? {
            $in: activeCategoryIds.filter(
              (id) => id.toString() === selectedCategoryId,
            ),
          }
        : { $in: [] };
    }

    // 3. Price Range Filtering
    if (minPrice !== undefined || maxPrice !== undefined) {
      const parsedMin = minPrice === undefined ? undefined : Number(minPrice);
      const parsedMax = maxPrice === undefined ? undefined : Number(maxPrice);

      if (
        (parsedMin !== undefined &&
          (!Number.isFinite(parsedMin) || parsedMin < 0)) ||
        (parsedMax !== undefined &&
          (!Number.isFinite(parsedMax) || parsedMax < 0)) ||
        (parsedMin !== undefined &&
          parsedMax !== undefined &&
          parsedMin > parsedMax)
      ) {
        res.status(400).json({
          success: false,
          message:
            "Price filters must be non-negative numbers and minimum cannot exceed maximum.",
        });
        return;
      }

      const priceFilter: Record<string, number> = {};

      if (parsedMin !== undefined) priceFilter.$gte = parsedMin;
      if (parsedMax !== undefined) priceFilter.$lte = parsedMax;

      query.price = priceFilter;
    }

    // 4. Featured Flag
    if (featured === "true") {
      query.isFeatured = true;
    }

    // 5. Sorting Setup
    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };

    if (sort === "price-asc") sortOptions = { price: 1 };
    if (sort === "price-desc") sortOptions = { price: -1 };
    if (sort === "rating") sortOptions = { rating: -1 };
    if (sort === "name-asc") sortOptions = { name: 1 };

    // 6. Pagination
    const pageNumber = boundedPositiveInt(page, 1, 1_000_000);
    const limitNumber = boundedPositiveInt(limit, 12, 100);
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
    }).populate({
      path: "category",
      match: { isActive: true },
      select: "name slug description",
    });

    if (!product || !product.category) {
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

// GET /api/products/by-id/:id
// Public route: Fetch one active product using its MongoDB ID
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const product = await Product.findOne({
      _id: id,
      isActive: true,
    }).populate({
      path: "category",
      match: { isActive: true },
      select: "name slug description",
    });

    if (!product || !product.category) {
      res.status(404).json({
        success: false,
        message: "Product not found or no longer active",
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

    const categoryDoc = await Category.findOne({
      _id: category,
      isActive: true,
    });

    if (!categoryDoc) {
      res.status(400).json({
        success: false,
        message: "Please select an existing active category",
      });
      return;
    }

    if (discountPrice && discountPrice >= price) {
      res.status(400).json({
        success: false,
        message: "Discount price must be less than the regular price",
      });
      return;
    }

    const generatedSlug = slugify(name);

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

    if (data.category) {
      const categoryDoc = await Category.findOne({
        _id: data.category,
        isActive: true,
      });

      if (!categoryDoc) {
        res.status(400).json({
          success: false,
          message: "Please select an existing active category",
        });
        return;
      }

      product.category = categoryDoc._id;
    }

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

// DELETE /api/products/:id (Admin Soft-Delete / Deactivation)
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true },
    );

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product deactivated successfully (soft-deleted)",
    });
  } catch (error) {
    next(error);
  }
};

// Suggestions Controller
export const getProductSuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query =
      typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";

    if (query.length < 2) {
      res.status(200).json({ success: true, suggestions: [] });
      return;
    }

    const activeCategoryIds = await Category.distinct("_id", {
      isActive: true,
    });

    const regex = new RegExp(escapeRegex(query), "i");

    const suggestions = await Product.find({
      isActive: true,
      category: { $in: activeCategoryIds },
      $or: [{ name: regex }, { tags: regex }],
    })
      .select("_id name slug price discountPrice images stock category")
      .populate("category", "name slug")
      .limit(6)
      .lean();

    res.status(200).json({
      success: true,
      count: suggestions.length,
      suggestions,
    });
  } catch (error) {
    next(error);
  }
};

// Facets Controller
export const getCatalogFacets = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const activeCategoryIds = await Category.distinct("_id", {
      isActive: true,
    });

    // 1. Group active products belonging to active categories.
    const categoryCounts = await Product.aggregate([
      {
        $match: {
          isActive: true,
          category: { $in: activeCategoryIds },
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    // 2. Calculate min & max price across publicly visible inventory.
    const priceStats = await Product.aggregate([
      {
        $match: {
          isActive: true,
          category: { $in: activeCategoryIds },
        },
      },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          totalInStock: {
            $sum: {
              $cond: [{ $gt: ["$stock", 0] }, 1, 0],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      categoryCounts,
      stats: priceStats[0] || {
        minPrice: 0,
        maxPrice: 100000,
        totalInStock: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
