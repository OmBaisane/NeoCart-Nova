import { Request, Response, NextFunction } from "express";
import { InvalidTokenError, verifyToken } from "../utils/jwt.js";
import { User } from "../models/user.model.js";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let token: string | undefined = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.slice(7).trim();
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Not authorized. Please log in to access this resource.",
    });
    return;
  }

  try {
    const decoded = verifyToken(token);
    const currentUser = await User.findById(decoded.userId);

    if (!currentUser) {
      res.status(401).json({
        success: false,
        message: "The user belonging to this token no longer exists.",
      });
      return;
    }

    req.user = currentUser;
    next();
  } catch (error: unknown) {
    if (error instanceof InvalidTokenError) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired session. Please log in again.",
      });
      return;
    }

    next(error);
  }
};

/**
 * Optional authentication: attaches req.user when a valid token
 * is present, but allows anonymous visitors to continue.
 */
export const optionalProtect = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const tokenFromCookie: string | undefined = req.cookies?.token;
  const authorization = req.headers.authorization;

  const token =
    tokenFromCookie ||
    (authorization?.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : undefined);

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = verifyToken(token);
    const currentUser = await User.findById(decoded.userId);

    if (currentUser) {
      req.user = currentUser;
    }
  } catch (error: unknown) {
    if (!(error instanceof InvalidTokenError)) {
      next(error);
      return;
    }

    // Invalid tokens are treated as anonymous visitors.
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
