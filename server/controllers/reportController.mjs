import { Report } from "../models/reportModel.mjs";
import { Workout } from "../models/workoutModel.mjs";
import { Notification } from "../models/notificationModel.mjs";
import { Progress } from "../models/progressModel.mjs";
import User from "../models/userModel.mjs";  // ✅ Add this import

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

// ===== INTERNAL HELPER FUNCTIONS =====

// 🏆 Get Achievements - FOR INTERNAL USE (without req, res)
const fetchUserAchievements = async (userId) => {
  try {
    console.log("Fetching achievements for user:", userId);
    const achievements = await Notification.find({
      createdBy: userId,
      type: "achievement"
    }).sort({ createdAt: -1 });

    return {
      total: achievements.length,
      recent: achievements.slice(0, 5),
      grouped: {
        streaks: achievements.filter(a => a.metadata?.goalType === "streak"),
        weeklyGoals: achievements.filter(a => a.metadata?.goal === 5),
        milestones: achievements.filter(a => !a.metadata?.goalType && !a.metadata?.goal)
      }
    };
  } catch (error) {
    console.error("Fetch achievements error:", error);
    return { total: 0, recent: [], grouped: {} };
  }
};

// ===== API ROUTE HANDLERS =====

// 📊 Get Reports Dashboard Data - WITH DEBUG LOGS
export const getReports = async (req, res) => {
  try {
    console.log("========== GET REPORTS CALLED ==========");
    console.log("User ID:", req.user?._id);
    console.log("Period:", req.query.period);
    
    const userId = req.user._id;
    const { period = "month" } = req.query;

    // Step 1: Get user's report
    console.log("Step 1: Fetching report for user:", userId);
    let report = await Report.findOne({ user: userId });
    console.log("Report found:", report ? "Yes" : "No");
    
    if (!report) {
      console.log("Creating new report for user:", userId);
      report = await generateInitialReport(userId);
      console.log("New report created with ID:", report._id);
    }

    // Step 2: Get progress data
    console.log("Step 2: Fetching progress for user:", userId);
    const progress = await Progress.findOne({ createdBy: userId });
    console.log("Progress found:", progress ? "Yes" : "No");
    if (progress) {
      console.log("Progress goalWeight:", progress.goalWeight);
    }
    
    // Step 3: Calculate target weight
    console.log("Step 3: Calculating target weight");
    const targetWeight = progress?.goalWeight || report?.goals?.targetWeight || 0;
    console.log("Target weight:", targetWeight);

    // Step 4: Get period data
    console.log("Step 4: Getting period data for:", period);
    const periodData = await getPeriodData(userId, period);
    console.log("Period data stats:", periodData.stats);

    // Step 5: Get achievements
    console.log("Step 5: Fetching achievements");
    const achievements = await fetchUserAchievements(userId);
    console.log("Achievements fetched, total:", achievements.total);

    // Step 6: Get current weight
    console.log("Step 6: Getting current weight");
    const currentWeight = getCurrentWeight(report, progress);
    console.log("Current weight:", currentWeight);

    // Step 7: Prepare response data
    console.log("Step 7: Preparing response data");
    const responseData = {
      overview: {
        currentWeight: currentWeight,
        targetWeight: targetWeight,
        totalWorkouts: report?.workoutStats?.totalWorkouts || 0,
        totalCalories: report?.workoutStats?.totalCaloriesBurned || 0,
        totalDuration: report?.workoutStats?.totalDuration || 0,
        streak: report?.streak?.current || 0,
        longestStreak: report?.streak?.longest || 0
      },
      periodData: periodData,
      weightHistory: progress?.weightHistory?.slice(-10) || report?.weightHistory?.slice(-10) || [],
      performanceSummary: report?.performanceSummary || [],
      monthlyProgress: report?.monthlyProgress?.slice(-6) || [],
      achievements: achievements,
      goals: {
        targetWeight: targetWeight,
        weeklyWorkoutGoal: report?.goals?.weeklyWorkoutGoal || 5,
        monthlyCalorieGoal: report?.goals?.monthlyCalorieGoal || 10000
      }
    };

    console.log("========== GET REPORTS SUCCESS ==========");
    console.log("Response overview:", responseData.overview);
    
    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.log("========== GET REPORTS ERROR ==========");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    res.status(500).json({ 
      success: false, 
      errorMessage: error.message 
    });
  }
};

// 📈 Get Progress Chart Data
export const getProgressChart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { metric = "weight", range = "3months" } = req.query;

    let startDate = new Date();
    switch(range) {
      case "week": startDate.setDate(startDate.getDate() - 7); break;
      case "month": startDate.setMonth(startDate.getMonth() - 1); break;
      case "3months": startDate.setMonth(startDate.getMonth() - 3); break;
      case "6months": startDate.setMonth(startDate.getMonth() - 6); break;
      case "year": startDate.setFullYear(startDate.getFullYear() - 1); break;
    }

    let data = [];

    if (metric === "weight") {
      const report = await Report.findOne({ user: userId });
      data = report?.weightHistory
        ?.filter(w => new Date(w.date) >= startDate)
        .map(w => ({
          date: w.date,
          value: w.weight,
          label: "Weight"
        })) || [];
    } 
    else if (metric === "calories") {
      const workouts = await Workout.find({
        createdBy: userId,
        date: { $gte: startDate }
      }).sort({ date: 1 });

      const caloriesByDay = {};
      workouts.forEach(w => {
        const day = w.date.toISOString().split('T')[0];
        caloriesByDay[day] = (caloriesByDay[day] || 0) + (w.caloriesBurned || 0);
      });

      data = Object.entries(caloriesByDay).map(([date, value]) => ({
        date,
        value,
        label: "Calories"
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        metric,
        range,
        data
      }
    });

  } catch (error) {
    console.error("Get progress chart error:", error);
    res.status(500).json({ 
      success: false, 
      errorMessage: error.message 
    });
  }
};

// 📋 Export Report
export const exportReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { format = "json", period = "month" } = req.query;

    console.log(`Exporting report for user ${userId}, period: ${period}, format: ${format}`);

    // Get data from both models
    const report = await Report.findOne({ user: userId });
    const progress = await Progress.findOne({ createdBy: userId });
    
    // Get period-specific workouts
    const startDate = getPeriodStartDate(period);
    const workouts = await Workout.find({
      createdBy: userId,
      date: { $gte: startDate }
    }).sort({ date: -1 });

    console.log(`Found ${workouts.length} workouts for period ${period}`);

    // Calculate period-specific stats
    const totalWorkouts = workouts.length;
    const totalCalories = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
    const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    
    // Category breakdown
    const strengthSessions = workouts.filter(w => w.category === "Strength").length;
    const cardioloSessions = workouts.filter(w => w.category === "Cardio").length;

    const targetWeight = progress?.goalWeight || report?.goals?.targetWeight || 0;
    const currentWeight = getCurrentWeight(report, progress);

    const exportData = {
      reportInfo: {
        generatedAt: new Date().toISOString(),
        period: period,
        dateRange: {
          from: startDate.toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        }
      },
      user: {
        id: userId,
        email: req.user.email,
        name: req.user.name
      },
      summary: {
        totalWorkouts: totalWorkouts,
        totalCalories: totalCalories,
        totalDuration: totalDuration,
        averageDuration: totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0,
        strengthSessions: strengthSessions,
        cardioloSessions: cardioloSessions,
        currentWeight: currentWeight,
        targetWeight: targetWeight,
        weightToGoal: (currentWeight - targetWeight).toFixed(1),
        streak: report?.streak?.current || 0
      },
      weightHistory: (progress?.weightHistory || []).slice(-10).map(w => ({
        date: new Date(w.date).toISOString().split('T')[0],
        weight: w.weight
      })),
      recentWorkouts: workouts.slice(0, 20).map(w => ({
        name: w.name,
        date: new Date(w.date).toISOString().split('T')[0],
        category: w.category,
        duration: w.duration,
        caloriesBurned: w.caloriesBurned || 0,
        exercises: w.exercises?.length || 0
      })),
      goals: {
        targetWeight: targetWeight,
        weeklyWorkoutGoal: report?.goals?.weeklyWorkoutGoal || 5,
        monthlyCalorieGoal: report?.goals?.monthlyCalorieGoal || 10000
      }
    };

    console.log("Export data prepared:", {
      totalWorkouts: exportData.summary.totalWorkouts,
      totalCalories: exportData.summary.totalCalories
    });

    // Create notification for report export
    try {
      // ✅ Check if weekly report notifications are enabled
      const canSend = await shouldSendNotification(userId, "weekly_report");
      
      if (canSend) {
        await Notification.create({
          type: "info",
          title: "📊 Report Exported",
          message: `Your ${period} report has been exported as ${format.toUpperCase()}`,
          metadata: { 
            period,
            format,
            exportDate: new Date(),
            notificationType: "report_export"
          },
          createdBy: userId,
          read: false
        });
        console.log("Report export notification created");
      }
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    if (format === "csv") {
      const csv = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=fitness-report-${period}-${Date.now()}.csv`);
      return res.status(200).send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=fitness-report-${period}-${Date.now()}.json`);
      return res.status(200).json(exportData);
    }

  } catch (error) {
    console.error("Export report error:", error);
    res.status(500).json({ 
      success: false, 
      errorMessage: error.message 
    });
  }
};

// 🏆 Get Achievements - FOR API ROUTE (with req, res)
export const getAchievements = async (req, res) => {
  try {
    const userId = req.user._id;

    const achievements = await Notification.find({
      createdBy: userId,
      type: "achievement"
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        total: achievements.length,
        recent: achievements.slice(0, 5),
        grouped: {
          streaks: achievements.filter(a => a.metadata?.goalType === "streak"),
          weeklyGoals: achievements.filter(a => a.metadata?.goal === 5),
          milestones: achievements.filter(a => !a.metadata?.goalType && !a.metadata?.goal)
        }
      }
    });

  } catch (error) {
    console.error("Get achievements error:", error);
    res.status(500).json({ 
      success: false, 
      errorMessage: error.message 
    });
  }
};

// 🎯 Update Goals
export const updateGoals = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetWeight, targetDate, weeklyWorkoutGoal, monthlyCalorieGoal } = req.body;

    const report = await Report.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          "goals.targetWeight": targetWeight,
          "goals.targetDate": targetDate,
          "goals.weeklyWorkoutGoal": weeklyWorkoutGoal,
          "goals.monthlyCalorieGoal": monthlyCalorieGoal
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Goals updated successfully!",
      data: report.goals
    });

  } catch (error) {
    console.error("Update goals error:", error);
    res.status(500).json({ 
      success: false, 
      errorMessage: error.message 
    });
  }
};

// ========== Helper Functions ==========

const generateInitialReport = async (userId) => {
  const report = new Report({ 
    user: userId,
    goals: {
      targetWeight: 0,
      weeklyWorkoutGoal: 5,
      monthlyCalorieGoal: 10000
    }
  });
  await report.save();
  return report;
};

const getPeriodData = async (userId, period) => {
  const startDate = getPeriodStartDate(period);
  
  const workouts = await Workout.find({
    createdBy: userId,
    date: { $gte: startDate }
  });

  const totalWorkouts = workouts.length;
  const totalCalories = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);

  const byCategory = {
    Strength: workouts.filter(w => w.category === "Strength").length,
    Cardio: workouts.filter(w => w.category === "Cardio").length
  };

  return {
    period,
    startDate,
    endDate: new Date(),
    stats: {
      totalWorkouts,
      totalCalories,
      totalDuration,
      avgDuration: totalWorkouts ? Math.round(totalDuration / totalWorkouts) : 0,
      byCategory
    },
    workouts: workouts.slice(0, 10)
  };
};

const getPeriodStartDate = (period) => {
  const date = new Date();
  switch(period) {
    case "week": date.setDate(date.getDate() - 7); break;
    case "month": date.setMonth(date.getMonth() - 1); break;
    case "quarter": date.setMonth(date.getMonth() - 3); break;
    case "year": date.setFullYear(date.getFullYear() - 1); break;
    default: date.setMonth(date.getMonth() - 1);
  }
  return date;
};

const getCurrentWeight = (report, progress) => {
  // Pehle progress se check karo
  if (progress?.weightHistory && progress.weightHistory.length > 0) {
    return progress.weightHistory[progress.weightHistory.length - 1].weight;
  }
  // Warna report se
  if (report?.weightHistory && report.weightHistory.length > 0) {
    return report.weightHistory[report.weightHistory.length - 1].weight;
  }
  return 0;
};

const convertToCSV = (data) => {
  const rows = [];
  
  // Header
  rows.push(['FITNESS REPORT']);
  rows.push(['Generated:', new Date(data.reportInfo.generatedAt).toLocaleString()]);
  rows.push(['Period:', data.reportInfo.period]);
  rows.push(['Date Range:', `${data.reportInfo.dateRange.from} to ${data.reportInfo.dateRange.to}`]);
  rows.push([]);
  
  // Summary Section
  rows.push(['SUMMARY']);
  rows.push(['Metric', 'Value']);
  rows.push(['Total Workouts', data.summary.totalWorkouts]);
  rows.push(['Total Calories', data.summary.totalCalories]);
  rows.push(['Total Duration (min)', data.summary.totalDuration]);
  rows.push(['Avg Duration (min)', data.summary.averageDuration]);
  rows.push(['Strength Sessions', data.summary.strengthSessions]);
  rows.push(['Cardio Sessions', data.summary.cardioloSessions]);
  rows.push(['Current Weight (kg)', data.summary.currentWeight]);
  rows.push(['Target Weight (kg)', data.summary.targetWeight]);
  rows.push(['Weight to Goal (kg)', data.summary.weightToGoal]);
  rows.push(['Current Streak', data.summary.streak]);
  rows.push([]);
  
  // Goals Section
  rows.push(['GOALS']);
  rows.push(['Goal', 'Target']);
  rows.push(['Target Weight', `${data.goals.targetWeight} kg`]);
  rows.push(['Weekly Workout Goal', data.goals.weeklyWorkoutGoal]);
  rows.push(['Monthly Calorie Goal', data.goals.monthlyCalorieGoal]);
  rows.push([]);
  
  // Weight History
  if (data.weightHistory.length > 0) {
    rows.push(['WEIGHT HISTORY']);
    rows.push(['Date', 'Weight (kg)']);
    data.weightHistory.forEach(w => {
      rows.push([w.date, w.weight]);
    });
    rows.push([]);
  }
  
  // Recent Workouts
  if (data.recentWorkouts.length > 0) {
    rows.push(['RECENT WORKOUTS']);
    rows.push(['Date', 'Workout', 'Category', 'Duration (min)', 'Calories', 'Exercises']);
    data.recentWorkouts.forEach(w => {
      rows.push([
        w.date,
        w.name,
        w.category,
        w.duration,
        w.caloriesBurned,
        w.exercises
      ]);
    });
  }
  
  return rows.map(row => row.join(',')).join('\n');
};