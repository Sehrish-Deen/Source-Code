import { Progress } from "../models/progressModel.mjs";
import { Notification } from "../models/notificationModel.mjs"; // ← Import notification model

// Helper function to check goal weight achievement
const checkGoalWeightAchieved = async (userId, currentWeight) => {
  try {
    // Get user's goal weight (you can store this in user profile or settings)
    // For now, let's assume we get it from progress.goalWeight
    const progress = await Progress.findOne({ createdBy: userId });
    
    if (!progress || !progress.goalWeight) return;

    const goalWeight = progress.goalWeight;
    
    // Check if goal achieved (within 0.5kg range)
    if (Math.abs(currentWeight - goalWeight) <= 0.5) {
      // Check if already sent notification for this achievement
      const existingNotif = await Notification.findOne({
        createdBy: userId,
        type: "achievement",
        "metadata.goalType": "weight_goal",
        "metadata.achieved": true
      });

      if (!existingNotif) {
        await Notification.create({
          type: "achievement",
          title: "🎯 GOAL WEIGHT ACHIEVED! 🎉",
          message: `Congratulations! You've reached your target weight of ${goalWeight}kg!`,
          metadata: { 
            currentWeight,
            goalWeight,
            goalType: "weight_goal",
            achieved: true
          },
          createdBy: userId,
          read: false
        });
      }
    }
  } catch (error) {
    console.error("Check goal weight error:", error);
  }
};

// Helper function to check weight milestones
const checkWeightMilestone = async (userId, currentWeight, previousWeight) => {
  try {
    const progress = await Progress.findOne({ createdBy: userId });
    if (!progress || progress.weightHistory.length < 2) return;

    const startWeight = progress.weightHistory[0]?.weight;
    if (!startWeight) return;

    const totalLost = startWeight - currentWeight;
    const milestones = [1, 2, 5, 10, 15, 20, 25, 30]; // kg lost milestones

    // Find which milestone was crossed
    for (const milestone of milestones) {
      if (totalLost >= milestone && (startWeight - previousWeight) < milestone) {
        // Check if already sent notification for this milestone
        const existingNotif = await Notification.findOne({
          createdBy: userId,
          type: "achievement",
          "metadata.milestone": milestone,
          "metadata.goalType": "weight_milestone"
        });

        if (!existingNotif) {
          await Notification.create({
            type: "achievement",
            title: `🏆 ${milestone}kg Lost!`,
            message: `Incredible progress! You've lost ${totalLost.toFixed(1)}kg so far!`,
            metadata: { 
              totalLost,
              milestone,
              goalType: "weight_milestone"
            },
            createdBy: userId,
            read: false
          });
        }
        break;
      }
    }
  } catch (error) {
    console.error("Check weight milestone error:", error);
  }
};

// Helper function to check performance PR (Personal Record)
const checkPersonalRecord = async (userId, newEntry) => {
  try {
    const progress = await Progress.findOne({ createdBy: userId });
    if (!progress) return;

    // Get all entries for this activity
    const activityEntries = progress.performanceData
      .filter(e => e.activityName === newEntry.activityName)
      .sort((a, b) => b.value - a.value); // Sort by value descending

    if (activityEntries.length >= 2 && activityEntries[0].value === newEntry.value) {
      // This is the new best
      const previousBest = activityEntries[1]?.value;
      const improvement = previousBest ? newEntry.value - previousBest : 0;

      // Check if already sent notification for this PR
      const existingNotif = await Notification.findOne({
        createdBy: userId,
        type: "achievement",
        "metadata.activityName": newEntry.activityName,
        "metadata.value": newEntry.value,
        "metadata.goalType": "personal_record"
      });

      if (!existingNotif) {
        let message = "";
        if (newEntry.metricType === "Weight") {
          message = `New personal best! You ${newEntry.activityName} ${newEntry.value}${newEntry.unit}! That's ${improvement > 0 ? '+' : ''}${improvement}${newEntry.unit} more!`;
        } else if (newEntry.metricType === "Time") {
          message = `New personal record! You completed ${newEntry.activityName} in ${newEntry.value}${newEntry.unit}!`;
        } else {
          message = `New PR! ${newEntry.activityName}: ${newEntry.value}${newEntry.unit}`;
        }

        await Notification.create({
          type: "achievement",
          title: "🔥 NEW PERSONAL RECORD!",
          message,
          metadata: { 
            activityName: newEntry.activityName,
            value: newEntry.value,
            unit: newEntry.unit,
            improvement,
            metricType: newEntry.metricType,
            goalType: "personal_record"
          },
          createdBy: userId,
          read: false
        });
      }
    }
  } catch (error) {
    console.error("Check personal record error:", error);
  }
};

// Helper function to check body measurement changes
const checkMeasurementChange = async (userId, newMeasurement, previousMeasurement) => {
  try {
    if (!previousMeasurement) return;

    const significantChanges = [];
    
    // Check each measurement for significant change (e.g., 2cm or more)
    if (previousMeasurement.chest && Math.abs(newMeasurement.chest - previousMeasurement.chest) >= 2) {
      significantChanges.push({
        name: "Chest",
        change: (newMeasurement.chest - previousMeasurement.chest).toFixed(1)
      });
    }
    if (previousMeasurement.waist && Math.abs(newMeasurement.waist - previousMeasurement.waist) >= 2) {
      significantChanges.push({
        name: "Waist",
        change: (newMeasurement.waist - previousMeasurement.waist).toFixed(1)
      });
    }
    if (previousMeasurement.hips && Math.abs(newMeasurement.hips - previousMeasurement.hips) >= 2) {
      significantChanges.push({
        name: "Hips",
        change: (newMeasurement.hips - previousMeasurement.hips).toFixed(1)
      });
    }
    if (previousMeasurement.biceps && Math.abs(newMeasurement.biceps - previousMeasurement.biceps) >= 1) {
      significantChanges.push({
        name: "Biceps",
        change: (newMeasurement.biceps - previousMeasurement.biceps).toFixed(1)
      });
    }
    if (previousMeasurement.thighs && Math.abs(newMeasurement.thighs - previousMeasurement.thighs) >= 1) {
      significantChanges.push({
        name: "Thighs",
        change: (newMeasurement.thighs - previousMeasurement.thighs).toFixed(1)
      });
    }

    if (significantChanges.length > 0) {
      // Create notification for measurements
      const changesList = significantChanges.map(c => 
        `${c.name}: ${c.change > 0 ? '+' : ''}${c.change}cm`
      ).join(', ');

      await Notification.create({
        type: "achievement",
        title: "📏 Body Measurement Update",
        message: `Significant changes detected: ${changesList}`,
        metadata: { 
          changes: significantChanges,
          goalType: "measurement_change"
        },
        createdBy: userId,
        read: false
      });
    }
  } catch (error) {
    console.error("Check measurement change error:", error);
  }
};

// ==================== GET ALL PROGRESS DATA ====================
export const getProgress = async (req, res) => {
  try {
    let progress = await Progress.findOne({ createdBy: req.user._id });
    
    // Agar user ka progress document nahi hai to create karo
    if (!progress) {
      progress = await Progress.create({
        createdBy: req.user._id,
        goalWeight: 0,
        weightHistory: [],
        bodyMeasurements: [],
        performanceData: []
      });
    }

    res.status(200).json({
      message: "Progress data fetched successfully",
      data: progress
    });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// ==================== WEIGHT TRACKING ====================

// Add Weight Entry (Updated with notifications)
export const addWeightEntry = async (req, res) => {
  try {
    const { weight, date } = req.body;
    
    if (!weight) {
      return res.status(400).json({ message: "Weight is required" });
    }

    let progress = await Progress.findOne({ createdBy: req.user._id });
    
    if (!progress) {
      progress = new Progress({ createdBy: req.user._id, weightHistory: [] });
    }

    // Get previous weight for comparison
    const previousWeight = progress.weightHistory[progress.weightHistory.length - 1]?.weight;

    // Check if entry for this date already exists
    const existingEntryIndex = progress.weightHistory.findIndex(
      entry => new Date(entry.date).toDateString() === new Date(date).toDateString()
    );

    const newEntry = { weight, date: date || new Date() };

    if (existingEntryIndex !== -1) {
      // Update existing entry
      progress.weightHistory[existingEntryIndex] = newEntry;
    } else {
      // Add new entry
      progress.weightHistory.push(newEntry);
    }

    // Sort by date
    progress.weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    await progress.save();

    // 🎯 Check goal weight achievement
    await checkGoalWeightAchieved(req.user._id, weight);

    // 🎯 Check weight milestones (if there was previous weight)
    if (previousWeight) {
      await checkWeightMilestone(req.user._id, weight, previousWeight);
    }

    // 🎯 Send weight update notification
    if (previousWeight) {
      const change = (weight - previousWeight).toFixed(1);
      await Notification.create({
        type: "info",
        title: "⚖️ Weight Updated",
        message: `New weight: ${weight}kg (${change > 0 ? '+' : ''}${change}kg change)`,
        metadata: { 
          weight,
          previousWeight,
          change,
          notificationType: "weight_update"
        },
        createdBy: req.user._id,
        read: false
      });
    }

    res.status(201).json({
      message: existingEntryIndex !== -1 ? "Weight entry updated" : "Weight entry added",
      weightHistory: progress.weightHistory
    });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// Delete Weight Entry
export const deleteWeightEntry = async (req, res) => {
  try {
    const { entryId } = req.params;

    const progress = await Progress.findOne({ createdBy: req.user._id });
    
    if (!progress) {
      return res.status(404).json({ message: "Progress data not found" });
    }

    // Filter out the entry to delete
    progress.weightHistory = progress.weightHistory.filter(
      entry => entry._id.toString() !== entryId
    );
    
    await progress.save();

    res.status(200).json({
      message: "Weight entry deleted successfully",
      weightHistory: progress.weightHistory
    });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// ==================== BODY MEASUREMENTS ====================

// Add Body Measurement (Updated with notifications)
export const addBodyMeasurement = async (req, res) => {
  try {
    const { chest, waist, hips, biceps, thighs, date } = req.body;

    let progress = await Progress.findOne({ createdBy: req.user._id });
    
    if (!progress) {
      progress = new Progress({ createdBy: req.user._id, bodyMeasurements: [] });
    }

    // Get previous measurement for comparison
    const previousMeasurement = progress.bodyMeasurements[progress.bodyMeasurements.length - 1];

    const newMeasurement = {
      chest: chest || previousMeasurement?.chest || 0,
      waist: waist || previousMeasurement?.waist || 0,
      hips: hips || previousMeasurement?.hips || 0,
      biceps: biceps || previousMeasurement?.biceps || 0,
      thighs: thighs || previousMeasurement?.thighs || 0,
      date: date || new Date()
    };

    // Check if measurement for this date exists
    const existingIndex = progress.bodyMeasurements.findIndex(
      m => new Date(m.date).toDateString() === new Date(newMeasurement.date).toDateString()
    );

    if (existingIndex !== -1) {
      progress.bodyMeasurements[existingIndex] = newMeasurement;
    } else {
      progress.bodyMeasurements.push(newMeasurement);
    }

    // Sort by date
    progress.bodyMeasurements.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    await progress.save();

    // 🎯 Check for significant measurement changes
    if (previousMeasurement) {
      await checkMeasurementChange(req.user._id, newMeasurement, previousMeasurement);
    }

    res.status(201).json({
      message: existingIndex !== -1 ? "Measurement updated" : "Measurement added",
      bodyMeasurements: progress.bodyMeasurements
    });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// Delete Body Measurement
export const deleteBodyMeasurement = async (req, res) => {
  try {
    const { entryId } = req.params;

    const progress = await Progress.findOne({ createdBy: req.user._id });
    
    if (!progress) {
      return res.status(404).json({ message: "Progress data not found" });
    }

    progress.bodyMeasurements = progress.bodyMeasurements.filter(
      m => m._id.toString() !== entryId
    );
    
    await progress.save();

    res.status(200).json({
      message: "Measurement deleted successfully",
      bodyMeasurements: progress.bodyMeasurements
    });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// ==================== PERFORMANCE TRACKING ====================

// Add Performance Entry (Updated with notifications)
export const addPerformanceEntry = async (req, res) => {
  try {
    const { activityName, category, metricType, value, unit, date, notes } = req.body;

    // Validation
    if (!activityName || !category || !metricType || !value) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    let progress = await Progress.findOne({ createdBy: req.user._id });
    
    if (!progress) {
      progress = new Progress({ createdBy: req.user._id, performanceData: [] });
    }

    const newEntry = {
      activityName: activityName.trim(),
      category,
      metricType,
      value: parseFloat(value),
      unit: unit || (metricType === "Weight" ? "kg" : 
                     metricType === "Time" ? "min" : 
                     metricType === "Distance" ? "km" : "reps"),
      date: date || new Date(),
      notes: notes || ""
    };

    progress.performanceData.push(newEntry);
    
    // Sort by date
    progress.performanceData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    await progress.save();

    // 🎯 Check if this is a personal record
    await checkPersonalRecord(req.user._id, newEntry);

    // 🎯 Send performance entry notification
    await Notification.create({
      type: "info",
      title: "📊 Performance Logged",
      message: `Added ${activityName}: ${value}${unit}`,
      metadata: { 
        entryId: newEntry._id,
        activityName,
        value,
        unit,
        category,
        notificationType: "performance_added"
      },
      createdBy: req.user._id,
      read: false
    });

    res.status(201).json({
      message: "Performance entry added successfully",
      performanceData: progress.performanceData
    });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// Update Performance Entry
export const updatePerformanceEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const updates = req.body;

    const progress = await Progress.findOne({ createdBy: req.user._id });
    
    if (!progress) {
      return res.status(404).json({ message: "Progress data not found" });
    }

    const entryIndex = progress.performanceData.findIndex(
      e => e._id.toString() === entryId
    );

    if (entryIndex === -1) {
      return res.status(404).json({ message: "Performance entry not found" });
    }

    // Update fields
    if (updates.activityName) progress.performanceData[entryIndex].activityName = updates.activityName.trim();
    if (updates.category) progress.performanceData[entryIndex].category = updates.category;
    if (updates.metricType) progress.performanceData[entryIndex].metricType = updates.metricType;
    if (updates.value) progress.performanceData[entryIndex].value = parseFloat(updates.value);
    if (updates.unit) progress.performanceData[entryIndex].unit = updates.unit;
    if (updates.date) progress.performanceData[entryIndex].date = updates.date;
    if (updates.notes !== undefined) progress.performanceData[entryIndex].notes = updates.notes;

    // Re-sort
    progress.performanceData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    await progress.save();

    // 🎯 Send update notification
    await Notification.create({
      type: "info",
      title: "✏️ Performance Updated",
      message: `Updated ${progress.performanceData[entryIndex].activityName} entry`,
      metadata: { 
        entryId,
        activityName: progress.performanceData[entryIndex].activityName,
        notificationType: "performance_updated"
      },
      createdBy: req.user._id,
      read: false
    });

    res.status(200).json({
      message: "Performance entry updated successfully",
      performanceData: progress.performanceData
    });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// Delete Performance Entry
export const deletePerformanceEntry = async (req, res) => {
  try {
    const { entryId } = req.params;

    const progress = await Progress.findOne({ createdBy: req.user._id });
    
    if (!progress) {
      return res.status(404).json({ message: "Progress data not found" });
    }

    progress.performanceData = progress.performanceData.filter(
      e => e._id.toString() !== entryId
    );
    
    await progress.save();

    res.status(200).json({
      message: "Performance entry deleted successfully",
      performanceData: progress.performanceData
    });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// Get Performance Stats for an Activity
export const getActivityStats = async (req, res) => {
  try {
    const { activityName } = req.params;

    const progress = await Progress.findOne({ createdBy: req.user._id });
    
    if (!progress) {
      return res.status(404).json({ message: "Progress data not found" });
    }

    const entries = progress.performanceData
      .filter(e => e.activityName.toLowerCase() === activityName.toLowerCase())
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (entries.length === 0) {
      return res.status(404).json({ message: "No entries found for this activity" });
    }

    const values = entries.map(e => e.value);
    const best = Math.max(...values);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const first = values[0];
    const last = values[values.length - 1];
    const improvement = first !== 0 ? ((last - first) / first) * 100 : 0;

    res.status(200).json({
      activityName,
      stats: {
        best,
        avg: avg.toFixed(1),
        total: entries.length,
        improvement: improvement.toFixed(1),
        unit: entries[0].unit,
        firstDate: entries[0].date,
        lastDate: entries[entries.length - 1].date
      },
      entries
    });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};


// ==================== GOAL WEIGHT ====================

// Set Goal Weight
export const setGoalWeight = async (req, res) => {
  try {
    console.log("========== SET GOAL WEIGHT CALLED ==========");
    console.log("User ID:", req.user?._id);
    console.log("Request body:", req.body);
    
    const { goalWeight } = req.body;
    
    if (!goalWeight || isNaN(goalWeight) || goalWeight <= 0) {
      console.log("Invalid goal weight:", goalWeight);
      return res.status(400).json({ message: "Valid goal weight is required" });
    }

    console.log("Looking for progress document for user:", req.user._id);
    let progress = await Progress.findOne({ createdBy: req.user._id });
    
    if (!progress) {
      console.log("No progress document found, creating new one");
      progress = new Progress({ 
        createdBy: req.user._id, 
        weightHistory: [],
        bodyMeasurements: [],
        performanceData: []
      });
    }

    console.log("Current goal weight:", progress.goalWeight);
    console.log("Updating to:", parseFloat(goalWeight));
    
    // Update goal weight
    progress.goalWeight = parseFloat(goalWeight);
    
    console.log("Saving progress document...");
    await progress.save();
    console.log("Progress saved successfully");
    console.log("New goal weight:", progress.goalWeight);

    // 🎯 Send goal weight update notification
    try {
      await Notification.create({
        type: "info",
        title: "🎯 Goal Weight Updated",
        message: `Your new goal weight is ${goalWeight}kg`,
        metadata: { 
          goalWeight,
          notificationType: "goal_weight_update"
        },
        createdBy: req.user._id,
        read: false
      });
      console.log("Notification created");
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
      // Don't fail the request if notification fails
    }

    console.log("Sending response...");
    res.status(200).json({
      message: "Goal weight updated successfully",
      data: {
        goalWeight: progress.goalWeight
      }
    });
    console.log("========== SET GOAL WEIGHT COMPLETED ==========");

  } catch (error) {
    console.error("========== SET GOAL WEIGHT ERROR ==========");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ errorMessage: error.message });
  }
};