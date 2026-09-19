import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model.js";

// GET /api/admin/users (Admin Only)
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { search, page = "1", limit = "20" } = req.query;

    const query: Record<string, any> = {};

    if (search && typeof search === "string" && search.trim() !== "") {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNumber = Math.max(1, parseInt(limit as string, 10) || 20);
    const skip = (pageNumber - 1) * limitNumber;

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      count: users.length,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limitNumber),
      currentPage: pageNumber,
      users,
    });
  } catch (error) {
    next(error);
  }
};
