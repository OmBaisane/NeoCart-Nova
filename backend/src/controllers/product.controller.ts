import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { Category, slugify } from "../models/category.model.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../utils/validators.js";
import { boundedPositiveInt, escapeRegex } from "../utils/querySafety.js";

const effectivePriceExpression = {
  $cond: [
    {
      $and: [
        { $ne: ["$discountPrice", null] },
        { $lt: ["$discountPrice", "$price"] },
      ],
    },
    "$discountPrice",
    "$price",
  ],
};

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

const generateUniqueProductSlug = async (
  name: string,
  excludeProductId?: mongoose.Types.ObjectId,
): Promise<string> => {
  const baseSlug = slugify(name) || "product";
  const exclusion = excludeProductId ? { _id: { $ne: excludeProductId } } : {};

  let candidate = baseSlug;
  let suffix = 2;

  while (await Product.exists({ slug: candidate, ...exclusion })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

// GET /api/products
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

    if (typeof search === "string" && search.trim() !== "") {
      const sanitized = escapeRegex(search.trim().slice(0, 80));

      query.$or = [
        { name: { $regex: sanitized, $options: "i" } },
        { description: { $regex: sanitized, $options: "i" } },
      ];
    }

    if (typeof category === "string" && category.trim() !== "") {
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

      const priceConditions: Record<string, unknown>[] = [];

      if (parsedMin !== undefined) {
        priceConditions.push({
          $gte: [effectivePriceExpression, parsedMin],
        });
      }

      if (parsedMax !== undefined) {
        priceConditions.push({
          $lte: [effectivePriceExpression, parsedMax],
        });
      }

      query.$expr = { $and: priceConditions };
    }

    if (featured === "true") {
      query.isFeatured = true;
    }

    const pageNumber = boundedPositiveInt(page, 1, 1_000_000);
    const limitNumber = boundedPositiveInt(limit, 12, 100);
    const skip = (pageNumber - 1) * limitNumber;

    const totalProducts = await Product.countDocuments(query);

    let products;

    if (sort === "price-asc" || sort === "price-desc") {
      // Sort by actual selling price, not the original list price.
      const direction = sort === "price-asc" ? 1 : -1;

      const sortedIds = await Product.aggregate([
        { $match: query },
        { $addFields: { effectivePrice: effectivePriceExpression } },
        { $sort: { effectivePrice: direction, _id: 1 } },
        { $skip: skip },
        { $limit: limitNumber },
        { $project: { _id: 1 } },
      ]);

      const ids = sortedIds.map((item) => item._id);

      const fetchedProducts = await Product.find({
        _id: { $in: ids },
      }).populate("category", "name slug");

      // $in does not preserve the aggregation's sort order.
      const productById = new Map(
        fetchedProducts.map((product) => [product._id.toString(), product]),
      );

      products = ids
        .map((id) => productById.get(id.toString()))
        .filter((product) => product !== undefined);
    } else {
      let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };

      if (sort === "rating") sortOptions = { rating: -1 };
      if (sort === "name-asc") sortOptions = { name: 1 };

      sortOptions._id = 1;

      products = await Product.find(query)
        .populate("category", "name slug")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber);
    }

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

// GET /api/products/:slug
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

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/by-id/:id
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

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// POST /api/products
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

    const finalSlug = await generateUniqueProductSlug(name);

    const product = await Product.create({
      name,
      slug: finalSlug,
      description,
      price,
      discountPrice,
      images,
      category: categoryDoc._id,
      stock,
      isFeatured: isFeatured ?? false,
      isActive: isActive ?? true,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        success: false,
        message:
          "A product with this URL slug already exists. Please try again.",
      });
      return;
    }

    next(error);
  }
};

// PATCH /api/products/:id
export const updateProduct = async (
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

    const validationResult = updateProductSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    const data = validationResult.data;

    if (data.category !== undefined) {
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

    const targetPrice = data.price ?? product.price;
    const targetDiscount =
      data.discountPrice !== undefined
        ? data.discountPrice
        : product.discountPrice;

    if (targetDiscount != null && targetDiscount >= targetPrice) {
      res.status(400).json({
        success: false,
        message: "Discount price must be lower than the price",
      });
      return;
    }

    if (data.name !== undefined && data.name !== product.name) {
      product.name = data.name;
      product.slug = await generateUniqueProductSlug(data.name, product._id);
    }

    if (data.description !== undefined) product.description = data.description;
    if (data.price !== undefined) product.price = data.price;
    if (data.discountPrice !== undefined) {
      product.discountPrice = data.discountPrice;
    }
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
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        success: false,
        message:
          "A product with this URL slug already exists. Please try another name.",
      });
      return;
    }

    next(error);
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (
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

    const product = await Product.findByIdAndUpdate(
      id,
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

// GET /api/products/suggestions
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

// GET /api/products/facets
export const getCatalogFacets = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const activeCategoryIds = await Category.distinct("_id", {
      isActive: true,
    });

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
          minPrice: { $min: effectivePriceExpression },
          maxPrice: { $max: effectivePriceExpression },
          totalInStock: {
            $sum: {
              $cond: [{ $gt: ["$stock", 0] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          minPrice: 1,
          maxPrice: 1,
          totalInStock: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      categoryCounts,
      stats: priceStats[0] || {
        minPrice: 0,
        maxPrice: 0,
        totalInStock: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
