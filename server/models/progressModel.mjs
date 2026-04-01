import mongoose from "mongoose";

// Weight Entry Schema
const weightEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  weight: {
    type: Number,
    required: true,
    min: 20,
    max: 300
  }
});

// Body Measurement Schema
const measurementSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  chest: Number,
  waist: Number,
  hips: Number,
  biceps: Number,
  thighs: Number
});

// Performance Entry Schema
const performanceEntrySchema = new mongoose.Schema({
  activityName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ["Strength", "Cardio", "Endurance"],
    required: true
  },
  metricType: {
    type: String,
    enum: ["Weight", "Time", "Distance", "Reps"],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  notes: String
});

// Main Progress Schema
const progressSchema = new mongoose.Schema(
  {
    // Goal Weight
    goalWeight: {
      type: Number,
      default: 0,
      min: 0,
      max: 300
    },

    // Weight History
    weightHistory: [weightEntrySchema],

    // Body Measurements History
    bodyMeasurements: [measurementSchema],

    // Performance History
    performanceData: [performanceEntrySchema],

    // Reference to User
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true // One progress document per user
    }
  },
  { timestamps: true }
);

// Index for better query performance
progressSchema.index({ createdBy: 1 });

export const Progress = mongoose.model("Progress", progressSchema);