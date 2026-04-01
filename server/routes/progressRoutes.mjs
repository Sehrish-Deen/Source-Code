import express from "express";
import { protect } from "../middleware/authMiddleware.mjs";

import {
  getProgress,
  setGoalWeight, 
  addWeightEntry,
  deleteWeightEntry,
  addBodyMeasurement,
  deleteBodyMeasurement,
  addPerformanceEntry,
  updatePerformanceEntry,
  deletePerformanceEntry,
  getActivityStats
} from "../controllers/progressController.mjs";

const progressRoutes = express.Router();

// Apply protect middleware to all routes
progressRoutes.use(protect);

// ==================== MAIN ROUTES ====================
progressRoutes.get("/progress", getProgress);
progressRoutes.post("/progress/goal-weight", setGoalWeight);

// ==================== WEIGHT ROUTES ====================
progressRoutes.post("/progress/weight", addWeightEntry);
progressRoutes.delete("/progress/weight/:entryId", deleteWeightEntry);

// ==================== MEASUREMENT ROUTES ====================
progressRoutes.post("/progress/measurements", addBodyMeasurement);
progressRoutes.delete("/progress/measurements/:entryId", deleteBodyMeasurement);

// ==================== PERFORMANCE ROUTES ====================
progressRoutes.post("/progress/performance", addPerformanceEntry);
progressRoutes.put("/progress/performance/:entryId", updatePerformanceEntry);
progressRoutes.delete("/progress/performance/:entryId", deletePerformanceEntry);
progressRoutes.get("/progress/performance/stats/:activityName", getActivityStats);


export default progressRoutes;

/* ==================== API ENDPOINTS ====================

GET    /api/v1/progress              - Get all progress data
POST   /api/v1/progress/weight        - Add/Update weight entry
DELETE /api/v1/progress/weight/:id    - Delete weight entry
POST   /api/v1/progress/measurements  - Add/Update measurements
DELETE /api/v1/progress/measurements/:id - Delete measurement
POST   /api/v1/progress/performance   - Add performance entry
PUT    /api/v1/progress/performance/:id - Update performance entry
DELETE /api/v1/progress/performance/:id - Delete performance entry
GET    /api/v1/progress/performance/stats/:activity - Get activity stats

========================================================= */