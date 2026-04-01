import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  sets: Number,
  reps: Number,
  weight: Number
});

const workoutSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    category: {
      type: String,
      enum: ["Strength", "Cardio"],
      required: true
    },

    duration: Number,

    caloriesBurned: {
      type: Number,
      default: 0
    },

    date: {
      type: Date,
      default: Date.now
    },

    tags: [String],

    notes: String,

    exercises: [exerciseSchema],
    
    createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true
},

  },
  { timestamps: true }
);

export const Workout = mongoose.model("Workout", workoutSchema);
