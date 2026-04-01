import express from "express";
import cors from "cors";
import exampleRoutes from "./routes/exampleRoutes.mjs";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/example", exampleRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;
