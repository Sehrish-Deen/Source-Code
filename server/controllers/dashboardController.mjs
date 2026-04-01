import { Workout } from "../models/workoutModel.mjs";
import { Nutrition } from "../models/nutritionModel.mjs";
import { Progress } from "../models/progressModel.mjs";

// 📊 Get Dashboard Summary (User Specific)
export const getDashboardSummary = async (req, res) => {
  try {

    // 1️⃣ Workouts Summary (User Filtered)
    const totalWorkouts = await Workout.countDocuments({
      createdBy: req.user._id
    });

    const workoutsByCategory = await Workout.aggregate([
      { $match: { createdBy: req.user._id } },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    // 2️⃣ Nutrition Summary (User Filtered)
    const totalMeals = await Nutrition.countDocuments({
      createdBy: req.user._id
    });

    const caloriesByMealType = await Nutrition.aggregate([
      { $match: { createdBy: req.user._id } },
      { $group: { _id: "$mealType", totalCalories: { $sum: "$calories" } } }
    ]);

    // 3️⃣ Latest Progress (User Filtered)
    const latestProgress = await Progress.findOne({
      createdBy: req.user._id
    }).sort({ date: -1 });

    const summary = {
      workouts: {
        totalWorkouts,
        workoutsByCategory
      },
      nutrition: {
        totalMeals,
        caloriesByMealType
      },
      progress: {
        latestProgress
      }
    };

    res.status(200).json(summary);

  } catch (error) {
    console.error(error);
    res.status(500).json({ errorMessage: error.message });
  }
};
