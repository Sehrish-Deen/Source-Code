import express from "express";
import { protect } from "../middleware/authMiddleware.mjs";
import { 
  getWorkoutAnalytics, 
  getNutritionAnalytics,
  getDashboardAnalytics 
} from "../controllers/analyticsController.mjs";

const router = express.Router();

// 📊 Workouts Analytics (Protected)
router.get("/analytics/workouts", protect, getWorkoutAnalytics);

// 📊 Nutrition Analytics (Protected)
router.get("/analytics/nutrition", protect, getNutritionAnalytics);

// 📊 Combined Dashboard Analytics (Protected)
router.get("/analytics/dashboard", protect, getDashboardAnalytics);

export default router;

/*
API Endpoints:
-------------
GET   http://localhost:3000/api/v1/analytics/workouts   - Workouts Analytics (User Specific)
GET   http://localhost:3000/api/v1/analytics/nutrition  - Nutrition Analytics (User Specific)
GET   http://localhost:3000/api/v1/analytics/dashboard  - Combined Dashboard Analytics (User Specific)

Response Format:
---------------
{
  "success": true,
  "data": {
    // analytics data here
  }
}
*/