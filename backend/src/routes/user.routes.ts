import { Router } from "express";
import {
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/profile", getUserProfile);
router.patch("/profile", updateUserProfile);
router.patch("/password", updateUserPassword);

export default router;
