import express from "express";
import { protect } from "../middleware/authMiddleware.mjs";
import {
  addNutrition,
  getNutrition,
  updateNutrition,
  deleteNutrition,
} from "../controllers/nutritionController.mjs";

const router = express.Router();

//  Add a meal
router.post("/addNutrition", protect, addNutrition);

//  Get all meals (optional query: ?date=YYYY-MM-DD)
router.get("/getNutrition", protect, getNutrition);

//  Update a meal by ID
router.put("/updateNutrition/:id", protect, updateNutrition);

//  Delete a meal by ID
router.delete("/deleteNutrition/:id", protect, deleteNutrition);

export default router;

// POST  http://localhost:3000/api/v1/addNutrition             Add Meal
// GET  http://localhost:3000/api/v1/getNutrition                 Get All Meals
// GET   http://localhost:3000/api/v1/getNutrition?date=2026-02-09   Get Meals by Date
// PUT  http://localhost:3000/api/v1/updateNutrition/<MEAL_ID>      Update Meal
// DELETE  http://localhost:3000/api/v1/deleteNutrition/<MEAL_ID>   Delete Meal



// {
//   "mealType": "Breakfast",
//   "foodName": "Oatmeal with Fruits",
//   "quantity": "1 bowl",
//   "calories": 350,
//   "protein": 12,
//   "carbs": 55,
//   "fats": 8,
//   "date": "2026-02-09"
// }



//update
// {
//   "calories": 400,
//   "protein": 15
// }
