import express from "express";
import { protect } from "../middleware/authMiddleware.mjs";
import { getUserProfile, updateUserProfile } from "../controllers/userController.mjs";

const router = express.Router();

router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

export default router;
