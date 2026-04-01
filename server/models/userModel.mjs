import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username cannot exceed 20 characters"],
      match: [/^[A-Za-z\s]*$/, "Username must contain only alphabets"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\S+@\S+\.\S+$/,
        "Please enter a valid email address"
      ]
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false
    },

    profilePicture: {
      type: String,
      default: ""
    },

    weight: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    age: { type: Number, default: 0 },
    goal: { type: String, default: "" },

     // ✅ Email verification fields
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    
    // ✅ Password reset fields
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    
    // New: Settings field for user preferences
    settings: {
      notifications: {
        workoutReminders: { type: Boolean, default: true },
        mealReminders: { type: Boolean, default: true },
        goalAchievements: { type: Boolean, default: true },
        weeklyReport: { type: Boolean, default: true }
      }
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;