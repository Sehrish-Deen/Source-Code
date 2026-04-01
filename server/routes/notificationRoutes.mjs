import express from "express";
import { protect } from "../middleware/authMiddleware.mjs";

import {
  getNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  getUnreadCount
} from "../controllers/notificationController.mjs";

const notificationRoutes = express.Router();

// All routes are protected
notificationRoutes.get("/notifications", protect, getNotifications);
notificationRoutes.get("/notifications/unread-count", protect, getUnreadCount);
notificationRoutes.post("/addNotification", protect, addNotification);
notificationRoutes.patch("/markAsRead/:id", protect, markAsRead);
notificationRoutes.patch("/markAllAsRead", protect, markAllAsRead);
notificationRoutes.delete("/deleteNotification/:id", protect, deleteNotification);
notificationRoutes.delete("/clearReadNotifications", protect, clearReadNotifications);

export default notificationRoutes;

/*
API Endpoints:

GET     /api/v1/notifications?read=true&limit=10&page=1     Get notifications (with filters)
GET     /api/v1/notifications/unread-count                   Get only unread count
POST    /api/v1/addNotification                              Add notification (system)
PATCH   /api/v1/markAsRead/:id                               Mark single as read
PATCH   /api/v1/markAllAsRead                                Mark all as read
DELETE  /api/v1/deleteNotification/:id                       Delete single notification
DELETE  /api/v1/clearReadNotifications                       Delete all read notifications

Sample POST Request Body:
{
  "type": "reminder",
  "title": "Workout Reminder",
  "message": "Don't forget your chest workout today!",
  "metadata": {
    "workoutId": "65f3ab2c8c1a123456789abc",
    "actionUrl": "/workouts/65f3ab2c8c1a123456789abc"
  }
}
*/