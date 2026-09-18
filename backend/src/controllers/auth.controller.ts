import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model.js";
import { registerSchema, loginSchema } from "../utils/validators.js";
import { sendTokenCookie, clearTokenCookie } from "../utils/jwt.js";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Validate incoming request body with Zod
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const { name, email, password, phone } = validationResult.data;

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
      return;
    }

    // 3. Create user (password automatically hashed by pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || "",
    });

    // 4. Send token in HttpOnly cookie
    sendTokenCookie(res, {
      userId: user._id.toString(),
      role: user.role,
    });

    // 5. Send response (password excluded)
    res.status(201).json({
      success: true,
      message: "Registration successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt,
      },
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
    // 1. Validate request body with Zod
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const { email, password } = validationResult.data;

    // 2. Find user by email and explicitly select password
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    // 3. Compare passwords
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    // 4. Send token in HttpOnly cookie
    sendTokenCookie(res, {
      userId: user._id.toString(),
      role: user.role,
    });

    // 5. Send response
    res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt,
      },
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
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt,
    },
  });
};
