import { Workout } from "../models/workoutModel.mjs";
import { Notification } from "../models/notificationModel.mjs";
import User from "../models/userModel.mjs";  // ✅ Add this import
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

// Helper function to check weekly goal
const checkWeeklyGoal = async (userId) => {
  try {
    // ✅ Check if goal achievements are enabled
    const canSend = await shouldSendNotification(userId, "goal_achievement");
    
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const workoutCount = await Workout.countDocuments({
      createdBy: userId,
      date: { $gte: startOfWeek }
    });

    if (workoutCount === 5) {
      const existingNotif = await Notification.findOne({
        createdBy: userId,
        type: "achievement",
        "metadata.week": startOfWeek.toISOString(),
        "metadata.goalType": "weekly"
      });

      if (!existingNotif && canSend) {  // ✅ Add canSend check
        await Notification.create({
          type: "achievement",
          title: "🎯 Weekly Goal Achieved!",
          message: `Amazing! You've completed ${workoutCount} workouts this week!`,
          metadata: { 
            workoutCount,
            goal: 5,
            week: startOfWeek.toISOString(),
            goalType: "weekly"
          },
          createdBy: userId,
          read: false
        });
      }
    }
  } catch (error) {
    console.error("Check weekly goal error:", error);
  }
};

// Helper function to check streak
const checkStreak = async (userId) => {
  try {
    // ✅ Check if goal achievements are enabled
    const canSend = await shouldSendNotification(userId, "goal_achievement");
    
    const workouts = await Workout.find({ createdBy: userId })
      .sort({ date: -1 });

    if (workouts.length < 2) return;

    let streak = 1;
    for (let i = 0; i < workouts.length - 1; i++) {
      const current = new Date(workouts[i].date);
      const next = new Date(workouts[i + 1].date);
      
      current.setHours(0, 0, 0, 0);
      next.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(current - next);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    const streakMilestones = [3, 7, 14, 30, 50, 100];
    
    if (streakMilestones.includes(streak)) {
      const existingNotif = await Notification.findOne({
        createdBy: userId,
        type: "achievement",
        "metadata.streak": streak,
        "metadata.goalType": "streak"
      });

      if (!existingNotif && canSend) {  // ✅ Add canSend check
        let message = "";
        if (streak === 3) message = "3 days in a row! You're on fire! 🔥";
        else if (streak === 7) message = "One week streak! Incredible consistency! ⭐";
        else if (streak === 14) message = "14 days! You're unstoppable! 💪";
        else if (streak === 30) message = "30 DAY STREAK! You're a champion! 🏆";
        else if (streak === 50) message = "50 days! Legendary status! 👑";
        else if (streak === 100) message = "100 DAYS! YOU'RE A FITNESS GOD! 🔱";

        await Notification.create({
          type: "achievement",
          title: `🔥 ${streak} Day Streak!`,
          message,
          metadata: { 
            streak,
            goalType: "streak"
          },
          createdBy: userId,
          read: false
        });
      }
    }
  } catch (error) {
    console.error("Check streak error:", error);
  }
};

// Schedule workout reminder
const scheduleWorkoutReminder = async (workout, userId) => {
  try {
    // ✅ Check if workout reminders are enabled
    const canSend = await shouldSendNotification(userId, "workout_reminder");
    if (!canSend) return;
    
    const workoutDate = new Date(workout.date);
    const now = new Date();
    
    if (workoutDate > now) {
      // Sirf confirmation notification bhejo
      await Notification.create({
        type: "info",
        title: "🔔 Reminder Set",
        message: `We'll remind you about "${workout.name}" on ${workoutDate.toLocaleDateString()}`,
        metadata: { 
          workoutId: workout._id,
          workoutName: workout.name,
          workoutDate: workout.date,
          notificationType: "reminder_confirmation"
        },
        createdBy: userId,
        read: false
      });

      console.log(`✅ Reminder confirmation sent for: ${workout.name}`);
    }
  } catch (error) {
    console.error("Schedule workout reminder error:", error);
  }
};

// Check today's workouts
const checkTodayWorkouts = async (userId) => {
  try {
    // ✅ Check if workout reminders are enabled
    const canSend = await shouldSendNotification(userId, "workout_reminder");
    if (!canSend) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayWorkouts = await Workout.find({
      createdBy: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (todayWorkouts.length > 0) {
      const existingReminder = await Notification.findOne({
        createdBy: userId,
        type: "reminder",
        "metadata.date": today.toISOString(),
        "metadata.reminderType": "morning_reminder"
      });

      if (!existingReminder) {
        const workoutNames = todayWorkouts.map(w => w.name).join(", ");
        
        await Notification.create({
          type: "reminder",
          title: "🌅 Today's Workouts",
          message: `You have ${todayWorkouts.length} workout(s) today: ${workoutNames}. Let's do this! 💪`,
          metadata: { 
            workoutCount: todayWorkouts.length,
            workouts: todayWorkouts.map(w => ({ id: w._id, name: w.name })),
            date: today.toISOString(),
            reminderType: "morning_reminder"
          },
          createdBy: userId,
          read: false
        });
      }
    }
  } catch (error) {
    console.error("Check today workouts error:", error);
  }
};

// ➕ Add Workout
export const addWorkout = async (req, res) => {
  try {
    const workout = await Workout.create({
      ...req.body,
      createdBy: req.user._id
    });

    const workoutDate = new Date(workout.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (workoutDate <= today) {
      // Past or today's workout - completion notification
      // ✅ Check if goal achievements are enabled
      const canSendAchievement = await shouldSendNotification(req.user._id, "goal_achievement");
      
      if (canSendAchievement) {
        await Notification.create({
          type: "achievement",
          title: "💪 Workout Complete!",
          message: `Great job! You completed ${workout.name}`,
          metadata: { 
            workoutId: workout._id,
            category: workout.category,
            duration: workout.duration,
            caloriesBurned: workout.caloriesBurned,
            notificationType: "workout_complete"
          },
          createdBy: req.user._id,
          read: false
        });
      }

      await checkWeeklyGoal(req.user._id);
      await checkStreak(req.user._id);
    } else {
      // Future workout - sirf confirmation
      await scheduleWorkoutReminder(workout, req.user._id);
    }

    res.status(201).json({
      message: "Workout Added Successfully!",
      workout
    });
  } catch (e) {
    res.status(500).json({ errorMessage: e.message });
  }
};

// 📋 Get All Workouts
export const getWorkout = async (req, res) => {
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

    const data = await Workout.find(filter).sort({ date: -1 });

    // Check for today's workouts
    if (!date) {
      await checkTodayWorkouts(req.user._id);
    }

    res.status(200).json({ data });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// ❌ Delete Workout
export const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!workout) {
      return res.status(404).json({ message: "Workout not found or unauthorized" });
    }

    // Clean up related notifications
    await Notification.deleteMany({
      createdBy: req.user._id,
      "metadata.workoutId": req.params.id
    });

    res.status(200).json({
      message: "Workout Deleted Successfully!"
    });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// ✏️ Update Workout
export const updateWorkout = async (req, res) => {
  try {
    const updated = await Workout.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user._id
      },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Workout not found or unauthorized" });
    }

    res.status(200).json({
      message: "Workout Updated Successfully!",
      updatedWorkout: updated
    });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// 🔍 Search Workout
export const searchWorkout = async (req, res) => {
  try {
    const { query } = req.params;

    const data = await Workout.find({
      createdBy: req.user._id,
      $or: [
        { name: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } }
      ]
    });

    res.status(200).json({ data });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// 🕒 Cron Job for reminders
export const initWorkoutReminders = () => {
  // Har minute check karo (testing ke liye)
  // Production mein har 15 minute ya har hour kar dena
  cron.schedule('* * * * *', async () => {
    console.log('🕒 Checking for workout reminders...');
    
    try {
      const now = new Date();
      
      // 1. Workouts in next 24 hours
      const next24Hours = new Date(now.getTime() + (24 * 60 * 60 * 1000));
      
      const upcomingWorkouts = await Workout.find({
        date: { 
          $gte: now, 
          $lte: next24Hours 
        }
      }).populate('createdBy');

      for (const workout of upcomingWorkouts) {
        const userId = workout.createdBy._id;
        
        // ✅ Check if workout reminders are enabled for this user
        const canSend = await shouldSendNotification(userId, "workout_reminder");
        if (!canSend) continue;
        
        const workoutDate = new Date(workout.date);
        const timeDiff = workoutDate.getTime() - now.getTime();
        const hoursLeft = timeDiff / (1000 * 60 * 60);
        const minutesLeft = timeDiff / (1000 * 60);

        // 1 hour before reminder
        if (hoursLeft <= 1 && hoursLeft > 0.9) {
          const existingReminder = await Notification.findOne({
            createdBy: userId,
            type: "reminder",
            "metadata.workoutId": workout._id,
            "metadata.reminderType": "one_hour_before"
          });

          if (!existingReminder) {
            await Notification.create({
              type: "reminder",
              title: "⏰ 1 Hour To Go!",
              message: `Your workout "${workout.name}" starts in 1 hour! Get ready! 🔥`,
              metadata: { 
                workoutId: workout._id,
                workoutName: workout.name,
                workoutDate: workoutDate.toISOString(),
                reminderType: "one_hour_before"
              },
              createdBy: userId,
              read: false
            });
            console.log(`✅ Sent 1-hour reminder for: ${workout.name}`);
          }
        }

        // 15 minutes before reminder
        if (minutesLeft <= 15 && minutesLeft > 14) {
          const existingReminder = await Notification.findOne({
            createdBy: userId,
            type: "reminder",
            "metadata.workoutId": workout._id,
            "metadata.reminderType": "fifteen_minutes_before"
          });

          if (!existingReminder) {
            await Notification.create({
              type: "reminder",
              title: "🔥 Workout Starting Soon!",
              message: `"${workout.name}" starts in 15 minutes! Time to warm up!`,
              metadata: { 
                workoutId: workout._id,
                workoutName: workout.name,
                workoutDate: workoutDate.toISOString(),
                reminderType: "fifteen_minutes_before"
              },
              createdBy: userId,
              read: false
            });
            console.log(`✅ Sent 15-minute reminder for: ${workout.name}`);
          }
        }
      }

      // 2. Tomorrow's workouts reminder (8 AM)
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      if (currentHour === 8 && currentMinute === 0) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        const tomorrowWorkouts = await Workout.find({
          date: { $gte: tomorrow, $lt: dayAfterTomorrow }
        }).populate('createdBy');

        const workoutsByUser = {};
        tomorrowWorkouts.forEach(workout => {
          const userId = workout.createdBy._id.toString();
          if (!workoutsByUser[userId]) {
            workoutsByUser[userId] = [];
          }
          workoutsByUser[userId].push(workout);
        });

        for (const [userId, workouts] of Object.entries(workoutsByUser)) {
          // ✅ Check if workout reminders are enabled
          const canSend = await shouldSendNotification(userId, "workout_reminder");
          if (!canSend) continue;
          
          const existingReminder = await Notification.findOne({
            createdBy: userId,
            type: "reminder",
            "metadata.date": tomorrow.toISOString(),
            "metadata.reminderType": "tomorrow_reminder"
          });

          if (!existingReminder) {
            const workoutNames = workouts.map(w => w.name).join(", ");
            await Notification.create({
              type: "reminder",
              title: "⏰ Tomorrow's Workouts",
              message: `You have ${workouts.length} workout(s) tomorrow: ${workoutNames}. Get ready!`,
              metadata: { 
                workoutCount: workouts.length,
                workouts: workouts.map(w => ({ id: w._id, name: w.name })),
                date: tomorrow.toISOString(),
                reminderType: "tomorrow_reminder"
              },
              createdBy: userId,
              read: false
            });
            console.log(`✅ Sent tomorrow reminders to ${workouts.length} users`);
          }
        }
      }

    } catch (error) {
      console.error("Workout reminder error:", error);
    }
  });

  console.log("✅ Workout reminder cron job started");
};

// 🧪 Test function (optional)
export const testRemindersNow = async () => {
  console.log('🧪 Running manual reminder test...');
  const cronFunction = initWorkoutReminders();
  // This will run the cron logic once
  await cronFunction();
};