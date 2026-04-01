import express from "express";
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getCurrentUser,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword
} from "../controllers/authController.mjs";
import { protect } from "../middleware/authMiddleware.mjs";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected routes
router.get("/me", protect, getCurrentUser);

export default router;