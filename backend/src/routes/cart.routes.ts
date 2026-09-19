import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from "../controllers/cart.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// All cart actions require authenticated user session
router.use(protect);

router.get("/", getCart);
router.post("/items", addToCart);
router.patch("/items/:productId", updateCartItemQuantity);
router.delete("/items/:productId", removeCartItem);
router.delete("/", clearCart);

export default router;
