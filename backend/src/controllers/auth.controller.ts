import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model.js";
import { registerSchema, loginSchema } from "../utils/validators.js";
import { sendTokenCookie, clearTokenCookie } from "../utils/jwt.js";

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

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validationResult = registerSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const { name, email, password, phone } = validationResult.data;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
      return;
    }

    let user;

    try {
      user = await User.create({
        name,
        email,
        password,
        phone: phone || "",
      });
    } catch (error) {
      // Handle simultaneous registrations for the same email.
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        res.status(409).json({
          success: false,
          message: "An account with this email already exists.",
        });
        return;
      }

      throw error;
    }

    sendTokenCookie(res, {
      userId: user._id.toString(),
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      user: getSafeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const { email, password } = validationResult.data;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    sendTokenCookie(res, {
      userId: user._id.toString(),
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: "Login successful.",
      user: getSafeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response): void => {
  clearTokenCookie(res);

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

export const getMe = (req: Request, res: Response): void => {
  const user = req.user!;

  res.status(200).json({
    success: true,
    user: getSafeUser(user),
  });
};
