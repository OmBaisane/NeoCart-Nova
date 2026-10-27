import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/user.model.js";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let token: string | undefined = req.cookies?.token;

    // Fallback support for Authorization: Bearer <token> header
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Not authorized. Please log in to access this resource.",
      });
      return;
    }

    // Verify token signature & expiration
    const decoded = verifyToken(token);

    // Fetch user from DB to ensure account still exists
    const currentUser = await User.findById(decoded.userId);

    if (!currentUser) {
      res.status(401).json({
        success: false,
        message: "The user belonging to this token no longer exists.",
      });
      return;
    }

    // Attach user to express request object for subsequent controllers
    req.user = currentUser;
    next();
  } catch (error: unknown) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired session. Please log in again.",
    });
  }
};

/**
 * Optional authentication: extracts req.user if a valid token is present,
 * but does not reject anonymous visitors with 401.
 */
export const optionalProtect = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let token: string | undefined = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      const currentUser = await User.findById(decoded.userId);
      if (currentUser) {
        req.user = currentUser;
      }
    }
  } catch {
    // Silently continue for unauthenticated visitors
  }
  next();
};

export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Forbidden. Admin privileges required to access this resource.",
    });
    return;
  }

  next();
};
