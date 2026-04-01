import { Workout } from "../models/workoutModel.mjs";
import { Nutrition } from "../models/nutritionModel.mjs";

// 📊 Workouts Analytics (Optimized)
// 📊 Workouts Analytics (Optimized)
// 📊 Workouts Analytics (Optimized)
export const getWorkoutAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [analytics] = await Workout.aggregate([
      { $match: { createdBy: userId } },
      {
        $facet: {
          categories: [
            { 
              $group: { 
                _id: "$category", 
                count: { $sum: 1 },
                totalDuration: { $sum: "$duration" },
                totalCalories: { $sum: "$caloriesBurned" }
              } 
            },
            { $sort: { count: -1 } }
          ],
          
          // ✅ FIXED: Include totalDuration and totalCaloriesBurned in dailyStats
          dailyStats: [
            { $match: { date: { $gte: sevenDaysAgo } } },
            { 
              $group: { 
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                count: { $sum: 1 },
                totalDuration: { $sum: "$duration" },        // ✅ Add this
                totalCaloriesBurned: { $sum: "$caloriesBurned" }  // ✅ Add this
              }
            },
            { $sort: { _id: 1 } }
          ],
          
          totals: [
            {
              $group: {
                _id: null,
                totalWorkouts: { $sum: 1 },
                totalDuration: { $sum: "$duration" },
                totalCaloriesBurned: { $sum: "$caloriesBurned" }
              }
            }
          ],
          
          topExercises: [
            { $unwind: "$exercises" },
            { 
              $group: { 
                _id: "$exercises.name", 
                count: { $sum: 1 } 
              } 
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ],
          
          currentWeek: [
            {
              $match: {
                date: {
                  $gte: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1))
                }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                totalDuration: { $sum: "$duration" },
                totalCalories: { $sum: "$caloriesBurned" }
              }
            }
          ]
        }
      }
    ]);

    res.status(200).json({ 
      success: true,
      data: {
        workoutsByCategory: analytics?.categories || [],
        dailyWorkouts: analytics?.dailyStats || [],  // ✅ Ab har din ki actual duration and calories honge
        totalWorkouts: analytics?.totals[0]?.totalWorkouts || 0,
        totalDuration: analytics?.totals[0]?.totalDuration || 0,
        totalCaloriesBurned: analytics?.totals[0]?.totalCaloriesBurned || 0,
        mostUsedExercises: analytics?.topExercises || [],
        currentWeekSummary: {
          totalWorkouts: analytics?.currentWeek[0]?.count || 0,
          totalDuration: analytics?.currentWeek[0]?.totalDuration || 0,
          totalCalories: analytics?.currentWeek[0]?.totalCalories || 0,
          averageDuration: analytics?.currentWeek[0]?.count 
            ? Math.round(analytics?.currentWeek[0]?.totalDuration / analytics?.currentWeek[0]?.count) 
            : 0
        }
      }
    });

  } catch (error) {
    console.error("Workout Analytics Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch workout analytics"
    });
  }
};

// 📊 Nutrition Analytics (Optimized)
export const getNutritionAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [nutritionStats] = await Nutrition.aggregate([
      { $match: { createdBy: userId } },
      {
        $facet: {
          // Meal type breakdown
          byMealType: [
            {
              $group: {
                _id: "$mealType",
                totalCalories: { $sum: "$calories" },
                count: { $sum: 1 }
              }
            }
          ],
          
          // Daily calories for last 7 days
          dailyCalories: [
            { $match: { date: { $gte: sevenDaysAgo } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                totalCalories: { $sum: "$calories" },
                mealCount: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          
          // Overall stats
          totals: [
            {
              $group: {
                _id: null,
                totalMeals: { $sum: 1 },
                totalCalories: { $sum: "$calories" },
                uniqueDays: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } }
              }
            }
          ]
        }
      }
    ]);

    const totals = nutritionStats?.totals[0] || { totalMeals: 0, totalCalories: 0, uniqueDays: [] };
    const averageCaloriesPerDay = totals.uniqueDays?.length 
      ? Math.round(totals.totalCalories / totals.uniqueDays.length) 
      : 0;

    res.status(200).json({ 
      success: true,
      data: {
        caloriesByMealType: nutritionStats?.byMealType || [],
        dailyCalories: nutritionStats?.dailyCalories || [],
        totalMeals: totals.totalMeals,
        totalCalories: totals.totalCalories,
        averageCaloriesPerDay
      }
    });

  } catch (error) {
    console.error("Nutrition Analytics Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch nutrition analytics",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 📊 Dashboard Analytics (with caching)
let analyticsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const cacheKey = `dashboard_${userId}`;
    
    // Check cache
    if (analyticsCache.has(cacheKey)) {
      const cached = analyticsCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return res.status(200).json({
          success: true,
          data: cached.data,
          fromCache: true
        });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    // Parallel queries for better performance
    const [todaysWorkout, todaysNutrition, weeklyWorkouts, allWorkouts] = await Promise.all([
      Workout.findOne({ createdBy: userId, date: { $gte: today } }).lean(),
      Nutrition.find({ createdBy: userId, date: { $gte: today } }).lean(),
      Workout.find({ createdBy: userId, date: { $gte: startOfWeek } })
        .sort({ date: 1 })
        .select('name duration caloriesBurned date category')
        .lean(),
      Workout.find({ createdBy: userId })
        .sort({ date: -1 })
        .select('date')
        .lean()
    ]);

    // Calculate streak
    let currentStreak = 0;
    if (allWorkouts.length > 0) {
      currentStreak = 1;
      for (let i = 0; i < allWorkouts.length - 1; i++) {
        const current = new Date(allWorkouts[i].date);
        const next = new Date(allWorkouts[i + 1].date);
        
        current.setHours(0, 0, 0, 0);
        next.setHours(0, 0, 0, 0);
        
        const diffDays = Math.round((current - next) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate weekly totals
    const weeklyWorkoutCount = weeklyWorkouts.length;
    const weeklyTotalDuration = weeklyWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const weeklyTotalCalories = weeklyWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);

    const responseData = {
      todaysWorkout,
      todaysNutrition: {
        meals: todaysNutrition,
        totalCalories: todaysNutrition.reduce((sum, item) => sum + item.calories, 0)
      },
      weeklyWorkoutCount,
      weeklyTotalDuration,
      weeklyTotalCalories,
      currentStreak,
      weeklyGoal: {
        completed: weeklyWorkoutCount,
        target: 5,
        percentage: Math.min((weeklyWorkoutCount / 5) * 100, 100),
        totalDuration: weeklyTotalDuration,
        totalCalories: weeklyTotalCalories
      },
      recentWorkouts: weeklyWorkouts.slice(-5) // Last 5 workouts
    };

    // Update cache
    analyticsCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    // Clean old cache entries
    if (analyticsCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of analyticsCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          analyticsCache.delete(key);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error("Dashboard Analytics Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch dashboard analytics",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};