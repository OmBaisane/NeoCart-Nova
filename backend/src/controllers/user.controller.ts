import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model.js";
import {
  updateProfileSchema,
  updatePasswordSchema,
} from "../utils/validators.js";

const getSafeUser = (user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  address?: unknown;
  createdAt?: Date;
}) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone,
  address: user.address,
  createdAt: user.createdAt,
});

// GET /api/users/profile (Protected)
export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User profile not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: getSafeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/profile (Protected)
export const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validationResult = updateProfileSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const user = await User.findById(req.user!._id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User profile not found",
      });
      return;
    }

    const { name, phone, avatar, address } = validationResult.data;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    if (address !== undefined) {
      user.address = {
        ...user.address,
        ...address,
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: getSafeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/password (Protected)
export const updateUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validationResult = updatePasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const { currentPassword, newPassword } = validationResult.data;

    const user = await User.findById(req.user!._id).select("+password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Incorrect current password",
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
