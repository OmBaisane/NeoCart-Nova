import { Router } from "express";
import { getAllUsers } from "../controllers/admin.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = Router();

// All admin routes require both session authentication and admin role
router.use(protect, adminOnly);

router.get("/users", getAllUsers);

export default router;
