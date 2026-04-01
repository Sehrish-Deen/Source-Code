import express from "express";
import { protect } from "../middleware/authMiddleware.mjs";
import {
  getReports,
  getProgressChart,
  exportReport,
  getAchievements,
  updateGoals
} from "../controllers/reportController.mjs";

const reportRoutes = express.Router();

// All routes are protected (require authentication)
reportRoutes.use(protect);

// 📊 Main Reports Dashboard
// GET /api/v1/reports?period=week|month|quarter|year
reportRoutes.get("/reports", getReports);

// 📈 Progress Chart Data
// GET /api/v1/reports/chart?metric=weight|calories|duration&range=week|month|3months|6months|year
reportRoutes.get("/reports/chart", getProgressChart);

// 📋 Export Report
// GET /api/v1/reports/export?format=json|csv&period=week|month|quarter|year
reportRoutes.get("/reports/export", exportReport);

// 🏆 Achievements
// GET /api/v1/reports/achievements
reportRoutes.get("/reports/achievements", getAchievements);

// 🎯 Update Goals
// POST /api/v1/reports/goals
reportRoutes.post("/reports/goals", updateGoals);

export default reportRoutes;