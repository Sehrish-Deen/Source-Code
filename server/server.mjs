import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.mjs";
import workoutRoutes from "./routes/workoutRoutes.mjs";
import { errorHandler } from "./middleware/errorMiddleware.mjs";
import nutritionRoutes from "./routes/nutritionRoutes.mjs";
import progressRoutes from "./routes/progressRoutes.mjs";
import dashboardRoutes from "./routes/dashboardRoutes.mjs";
import analyticsRoutes from "./routes/analyticsRoutes.mjs";
import reportRoutes from "./routes/reportRoutes.mjs";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.mjs";
import userRoutes from "./routes/userRoutes.mjs";
import notificationRoutes from "./routes/notificationRoutes.mjs";
import { initWorkoutReminders } from "./controllers/workoutController.mjs";
import { initNutritionReminders } from "./controllers/nutritionController.mjs";
import settingsRoutes from "./routes/settingsRoutes.mjs";

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:8080", 
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());



// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1", workoutRoutes);
app.use("/api/v1", nutritionRoutes);
app.use("/api/v1", progressRoutes);
app.use("/api/v1", dashboardRoutes);
app.use("/api/v1", analyticsRoutes);
app.use("/api/v1", notificationRoutes);
app.use("/api/v1", reportRoutes); 
app.use("/api/v1", settingsRoutes); 



// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initWorkoutReminders();
  initNutritionReminders();
});
