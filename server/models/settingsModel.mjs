import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    notifications: {
      type: Boolean,
      default: true
    },
    units: {
      type: String,
      enum: ["kg", "lbs"],
      default: "kg"
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light"
    }
  },
  { timestamps: true }
);

export const Settings = mongoose.model("Settings", settingsSchema);
