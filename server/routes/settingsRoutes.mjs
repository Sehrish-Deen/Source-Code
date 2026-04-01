import express from "express";
import { protect } from "../middleware/authMiddleware.mjs";
import {
  getSettings,
  updateNotificationSettings,
  updateProfile
} from "../controllers/settingsController.mjs";

const settingsRoutes = express.Router();

// All routes are protected
settingsRoutes.use(protect);

// GET /api/v1/settings - Get all settings
settingsRoutes.get("/settings", getSettings);

// PUT /api/v1/settings/notifications - Update notification preferences
settingsRoutes.put("/settings/notifications", updateNotificationSettings);

// PUT /api/v1/settings/profile - Update profile
settingsRoutes.put("/settings/profile", updateProfile);

export default settingsRoutes;