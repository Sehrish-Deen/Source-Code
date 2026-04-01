import { Nutrition } from "../models/nutritionModel.mjs";
import { Notification } from "../models/notificationModel.mjs";
import User from "../models/userModel.mjs";
import cron from 'node-cron';

// ✅ NEW: Helper function to check if notifications are enabled
const shouldSendNotification = async (userId, type) => {
  try {
    const user = await User.findById(userId).select("settings");
    
    if (!user || !user.settings || !user.settings.notifications) {
      return true; // Default to true if settings don't exist
    }

    switch(type) {
      case "workout_reminder":
        return user.settings.notifications.workoutReminders;
      case "goal_achievement":
        return user.settings.notifications.goalAchievements;
      case "meal_reminder":
        return user.settings.notifications.mealReminders;
      case "weekly_report":
        return user.settings.notifications.weeklyReport;
      default:
        return true;
    }
  } catch (error) {
    console.error("Check notification settings error:", error);
    return true; // Default to true on error
  }
};

// Meal timing configuration
const MEAL_TIMES = {
  Breakfast: { start: 5, end: 10 },
  Lunch: { start: 12, end: 15 },
  Dinner: { start: 18, end: 21 }
};

// Check missed meals
const checkMissedMeals = async (userId) => {
  try {
    // ✅ Check if meal reminders are enabled
    const canSend = await shouldSendNotification(userId, "meal_reminder");
    if (!canSend) return;
    
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMeals = await Nutrition.find({
      createdBy: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    const loggedMealTypes = todayMeals.map(meal => meal.mealType);
    const currentHour = now.getHours();

    for (const [mealType, timeRange] of Object.entries(MEAL_TIMES)) {
      if (mealType === 'Snack') continue;

      if (currentHour >= timeRange.start && currentHour <= timeRange.end) {
        if (!loggedMealTypes.includes(mealType)) {
          const existingReminder = await Notification.findOne({
            createdBy: userId,
            type: "reminder",
            "metadata.mealType": mealType,
            "metadata.date": today.toISOString(),
            "metadata.reminderType": "missed_meal"
          });

          if (!existingReminder) {
            let message = "";
            if (mealType === "Breakfast") {
              message = "🌅 You haven't logged your breakfast yet! It's the most important meal of the day!";
            } else if (mealType === "Lunch") {
              message = "🍱 Don't forget to log your lunch! Keep your nutrition tracking on point!";
            } else if (mealType === "Dinner") {
              message = "🌙 Time for dinner! Log your meal to complete your daily nutrition tracking!";
            }

            await Notification.create({
              type: "reminder",
              title: `⏰ ${mealType} Reminder`,
              message,
              metadata: { 
                mealType,
                date: today.toISOString(),
                currentHour,
                reminderType: "missed_meal"
              },
              createdBy: userId,
              read: false
            });
          }
        }
      }
    }

    // End of day reminder at 9 PM
    if (currentHour === 21) {
      const missingMeals = [];
      if (!loggedMealTypes.includes('Breakfast')) missingMeals.push('Breakfast');
      if (!loggedMealTypes.includes('Lunch')) missingMeals.push('Lunch');
      if (!loggedMealTypes.includes('Dinner')) missingMeals.push('Dinner');

      if (missingMeals.length > 0) {
        const existingReminder = await Notification.findOne({
          createdBy: userId,
          type: "reminder",
          "metadata.date": today.toISOString(),
          "metadata.reminderType": "end_of_day_summary"
        });

        if (!existingReminder) {
          const mealList = missingMeals.join(', ');
          await Notification.create({
            type: "reminder",
            title: "📊 End of Day Summary",
            message: `You missed logging: ${mealList}. Try to log them for better tracking!`,
            metadata: { 
              missingMeals,
              date: today.toISOString(),
              reminderType: "end_of_day_summary"
            },
            createdBy: userId,
            read: false
          });
        }
      }
    }

  } catch (error) {
    console.error("Check missed meals error:", error);
  }
};

// Check perfect meal streak
const checkMealStreak = async (userId) => {
  try {
    // ✅ Check if goal achievements are enabled
    const canSend = await shouldSendNotification(userId, "goal_achievement");
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const meals = await Nutrition.find({
      createdBy: userId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 });

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (true) {
      const dayMeals = meals.filter(meal => {
        const mealDate = new Date(meal.date);
        mealDate.setHours(0, 0, 0, 0);
        return mealDate.getTime() === currentDate.getTime();
      });

      const mealTypes = dayMeals.map(m => m.mealType);
      const hasBreakfast = mealTypes.includes('Breakfast');
      const hasLunch = mealTypes.includes('Lunch');
      const hasDinner = mealTypes.includes('Dinner');

      if (hasBreakfast && hasLunch && hasDinner) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    const streakMilestones = [3, 7, 14, 21, 30];
    
    if (streakMilestones.includes(streak)) {
      const existingNotif = await Notification.findOne({
        createdBy: userId,
        type: "achievement",
        "metadata.streak": streak,
        "metadata.goalType": "meal_streak"
      });

      if (!existingNotif && canSend) {
        let message = "";
        if (streak === 3) message = "3 days of complete meals! Great consistency! 🎯";
        else if (streak === 7) message = "One week of perfect meal logging! ⭐";
        else if (streak === 14) message = "14 days! You're a nutrition pro! 🌟";
        else if (streak === 21) message = "21 days! Healthy habit formed! 💪";
        else if (streak === 30) message = "30 DAYS! Perfect meal tracking champion! 🏆";

        await Notification.create({
          type: "achievement",
          title: `🔥 ${streak} Day Perfect Meal Streak!`,
          message,
          metadata: { 
            streak,
            goalType: "meal_streak"
          },
          createdBy: userId,
          read: false
        });
      }
    }

  } catch (error) {
    console.error("Check meal streak error:", error);
  }
};

// Check daily calorie goal
const checkDailyCalorieGoal = async (userId, date) => {
  try {
    // ✅ Check if goal achievements are enabled
    const canSend = await shouldSendNotification(userId, "goal_achievement");
    
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const meals = await Nutrition.find({
      createdBy: userId,
      date: { $gte: start, $lte: end }
    });

    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const calorieGoal = 2500;

    if (totalCalories >= calorieGoal * 0.9 && totalCalories <= calorieGoal * 1.1) {
      const existingNotif = await Notification.findOne({
        createdBy: userId,
        type: "achievement",
        "metadata.date": start.toISOString(),
        "metadata.goalType": "daily_calorie"
      });

      if (!existingNotif && canSend) {
        await Notification.create({
          type: "achievement",
          title: "🎯 Daily Calorie Goal Reached!",
          message: `Great job! You've reached your daily calorie target of ${calorieGoal} calories!`,
          metadata: { 
            calories: totalCalories,
            goal: calorieGoal,
            date: start.toISOString(),
            goalType: "daily_calorie"
          },
          createdBy: userId,
          read: false
        });
      }
    }
  } catch (error) {
    console.error("Check daily calorie goal error:", error);
  }
};

// Check protein goal
const checkProteinGoal = async (userId, date) => {
  try {
    // ✅ Check if goal achievements are enabled
    const canSend = await shouldSendNotification(userId, "goal_achievement");
    
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const meals = await Nutrition.find({
      createdBy: userId,
      date: { $gte: start, $lte: end }
    });

    const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
    const proteinGoal = 120;

    if (totalProtein >= proteinGoal) {
      const existingNotif = await Notification.findOne({
        createdBy: userId,
        type: "achievement",
        "metadata.date": start.toISOString(),
        "metadata.goalType": "daily_protein"
      });

      if (!existingNotif && canSend) {
        await Notification.create({
          type: "achievement",
          title: "💪 Protein Goal Achieved!",
          message: `Awesome! You've hit your protein target of ${proteinGoal}g today!`,
          metadata: { 
            protein: totalProtein,
            goal: proteinGoal,
            date: start.toISOString(),
            goalType: "daily_protein"
          },
          createdBy: userId,
          read: false
        });
      }
    }
  } catch (error) {
    console.error("Check protein goal error:", error);
  }
};

// Check meal consistency
const checkMealConsistency = async (userId) => {
  try {
    // ✅ Check if goal achievements are enabled
    const canSend = await shouldSendNotification(userId, "goal_achievement");
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const meals = await Nutrition.find({
      createdBy: userId,
      date: { $gte: sevenDaysAgo }
    });

    const uniqueDays = new Set();
    meals.forEach(meal => {
      const day = new Date(meal.date).toISOString().split('T')[0];
      uniqueDays.add(day);
    });

    const daysLogged = uniqueDays.size;
    const milestones = [3, 5, 7];
    
    if (milestones.includes(daysLogged)) {
      const existingNotif = await Notification.findOne({
        createdBy: userId,
        type: "achievement",
        "metadata.daysLogged": daysLogged,
        "metadata.goalType": "meal_consistency"
      });

      if (!existingNotif && canSend) {
        let message = "";
        if (daysLogged === 3) message = "3 days of consistent meal logging! Keep it up! 📝";
        else if (daysLogged === 5) message = "5 days! You're building a healthy habit! 🌟";
        else if (daysLogged === 7) message = "ONE WEEK of meal tracking! Incredible dedication! 🏆";

        await Notification.create({
          type: "achievement",
          title: `📊 ${daysLogged} Day Meal Streak!`,
          message,
          metadata: { 
            daysLogged,
            goalType: "meal_consistency"
          },
          createdBy: userId,
          read: false
        });
      }
    }
  } catch (error) {
    console.error("Check meal consistency error:", error);
  }
};

// Add Nutrition
export const addNutrition = async (req, res) => {
  try {
    const nutrition = await Nutrition.create({
      ...req.body,
      createdBy: req.user._id
    });

    // ✅ Check if meal reminders are enabled
    const canSend = await shouldSendNotification(req.user._id, "meal_reminder");
    
    if (canSend) {
      await Notification.create({
        type: "info",
        title: "🍽️ Meal Logged",
        message: `Added ${nutrition.foodName} - ${nutrition.calories} calories`,
        metadata: { 
          mealId: nutrition._id,
          mealType: nutrition.mealType,
          calories: nutrition.calories,
          notificationType: "meal_logged"
        },
        createdBy: req.user._id,
        read: false
      });
    }

    const mealDate = nutrition.date;
    await checkDailyCalorieGoal(req.user._id, mealDate);
    await checkProteinGoal(req.user._id, mealDate);
    await checkMealConsistency(req.user._id);
    await checkMealStreak(req.user._id);

    res.status(201).json({
      message: "Meal Logged Successfully!",
      nutrition,
    });

  } catch (error) {
    res.status(400).json({ errorMessage: error.message });
  }
};

// Get All Nutrition Entries
export const getNutrition = async (req, res) => {
  try {
    const { date } = req.query;

    let filter = {
      createdBy: req.user._id
    };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const entries = await Nutrition.find(filter).sort({ date: -1 });
    await checkMissedMeals(req.user._id);

    res.status(200).json({ data: entries });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// Update Nutrition Entry
export const updateNutrition = async (req, res) => {
  try {
    const updated = await Nutrition.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user._id
      },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ errorMessage: "Meal not found or unauthorized" });
    }

    // ✅ Check if meal reminders are enabled
    const canSend = await shouldSendNotification(req.user._id, "meal_reminder");
    
    if (canSend) {
      await Notification.create({
        type: "info",
        title: "✏️ Meal Updated",
        message: `Updated ${updated.foodName} details`,
        metadata: { 
          mealId: updated._id,
          mealType: updated.mealType,
          notificationType: "meal_updated"
        },
        createdBy: req.user._id,
        read: false
      });
    }

    res.status(200).json({
      message: "Meal Updated Successfully!",
      nutrition: updated,
    });

  } catch (error) {
    res.status(400).json({ errorMessage: error.message });
  }
};

// Delete Nutrition Entry
export const deleteNutrition = async (req, res) => {
  try {
    const deleted = await Nutrition.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!deleted) {
      return res.status(404).json({ errorMessage: "Meal not found or unauthorized" });
    }

    res.status(200).json({
      message: "Meal Deleted Successfully!"
    });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// Initialize cron job for nutrition reminders
export const initNutritionReminders = () => {
  // Check every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('🍽️ Checking nutrition reminders for all users...');
    
    try {
      const users = await User.find({});
      console.log(`📊 Total users: ${users.length}`);
      
      for (const user of users) {
        // ✅ Check inside checkMissedMeals function, but we need to pass user
        await checkMissedMeals(user._id);
      }
      
      console.log(`✅ Checked ${users.length} users for missed meals`);
      
    } catch (error) {
      console.error("Nutrition reminder error:", error);
    }
  });

  // End of day summary at 9 PM
  cron.schedule('0 21 * * *', async () => {
    console.log('📊 Running end of day nutrition summary...');
    
    try {
      const users = await User.find({});
      
      for (const user of users) {
        await checkMissedMeals(user._id);
      }
      
      console.log(`✅ Sent end of day summaries to ${users.length} users`);
      
    } catch (error) {
      console.error("End of day summary error:", error);
    }
  });

  console.log("✅ Nutrition reminder cron job started");
};