import express from "express";
import { protect } from "../middleware/authMiddleware.mjs";

import {
  addWorkout,
  getWorkout,
  deleteWorkout,
  updateWorkout,
  searchWorkout
} from "../controllers/workoutController.mjs";

const workoutRoutes = express.Router();

workoutRoutes.get("/workout",protect,  getWorkout);
workoutRoutes.get("/workoutSearch/:query",protect,  searchWorkout);
workoutRoutes.post("/addWorkout",protect,  addWorkout);
workoutRoutes.delete("/deleteWorkout/:id",protect,  deleteWorkout);
workoutRoutes.put("/updateWorkout/:id",protect,  updateWorkout);

export default workoutRoutes;


// POST http://localhost:3000/api/v1/addWorkout  Add Workout 
// GET http://localhost:3000/api/v1/workout   Get All Workouts
// GET http://localhost:3000/api/v1/workoutSearch/chest  Search Workout
// DELETE http://localhost:3000/api/v1/deleteWorkout/65f3ab2c8c1a123456789abc  Delete Workout
// PUT  http://localhost:3000/api/v1/updateWorkout/ID_HERE  Update Workout




// {
//   "name": "Chest Day",
//   "category": "Strength",
//   "duration": 60,
//   "caloriesBurned": 400,
//   "tags": ["chest", "push"],
//   "notes": "Good session",
//   "exercises": [
//     {
//       "name": "Bench Press",
//       "sets": 4,
//       "reps": 10,
//       "weight": 80
//     },
//     {
//       "name": "Push Ups",
//       "sets": 3,
//       "reps": 20,
//       "weight": 0
//     }
//   ]
// }
