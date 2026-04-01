import express from "express";
import { getDashboardSummary } from "../controllers/dashboardController.mjs";
import { protect } from "../middleware/authMiddleware.mjs";

const router = express.Router();

// 📊 Dashboard Summary (Protected Route)
router.get("/dashboard/summary", protect, getDashboardSummary);

export default router;
