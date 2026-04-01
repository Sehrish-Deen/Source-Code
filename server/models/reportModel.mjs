import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    
    workoutStats: {
      totalWorkouts: { type: Number, default: 0 },
      totalCaloriesBurned: { type: Number, default: 0 },
      totalDuration: { type: Number, default: 0 },
      strengthSessions: { type: Number, default: 0 },
      cardioloSessions: { type: Number, default: 0 },
      avgWorkoutDuration: { type: Number, default: 0 },
      lastWorkoutDate: Date
    },

    weightHistory: [{
      weight: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      notes: String
    }],

    goals: {
      targetWeight: { type: Number, default: 0 }, // Changed from 70 to 0
      targetDate: Date,
      weeklyWorkoutGoal: { type: Number, default: 5 },
      monthlyCalorieGoal: { type: Number, default: 10000 }
    },

    performanceSummary: [{
      category: { 
        type: String, 
        enum: ["Strength", "Cardio", "Endurance"],
        required: true 
      },
      totalSessions: Number,
      bestPerformance: {
        value: Number,
        unit: String,
        date: Date,
        activityName: String
      },
      averageValue: Number
    }],

    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastWorkoutDate: Date
    },

    monthlyProgress: [{
      month: String,
      year: Number,
      workoutsCompleted: Number,
      caloriesBurned: Number,
      totalDuration: Number,
      weightChange: Number
    }],

    lastCalculated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Report = mongoose.model("Report", reportSchema);