import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["reminder", "achievement", "info"],
      required: true
    },

    title: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    read: {
      type: Boolean,
      default: false
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

// Auto-delete after 30 days (optional - MongoDB TTL)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const Notification = mongoose.model("Notification", notificationSchema);