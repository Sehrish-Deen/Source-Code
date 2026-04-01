import User from "../models/userModel.mjs";

// @desc    Get user settings
// @route   GET /api/v1/settings
// @access  Private
export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("settings username email profilePicture");

    res.status(200).json({
      success: true,
      data: {
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture || "",
        notifications: user.settings?.notifications || {
          workoutReminders: true,
          mealReminders: true,
          goalAchievements: true,
          weeklyReport: true
        }
      }
    });

  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ 
      success: false, 
      errorMessage: error.message 
    });
  }
};

// @desc    Update notification settings
// @route   PUT /api/v1/settings/notifications
// @access  Private
export const updateNotificationSettings = async (req, res) => {
  try {
    const { workoutReminders, mealReminders, goalAchievements, weeklyReport } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          "settings.notifications.workoutReminders": workoutReminders,
          "settings.notifications.mealReminders": mealReminders,
          "settings.notifications.goalAchievements": goalAchievements,
          "settings.notifications.weeklyReport": weeklyReport
        }
      },
      { new: true }
    ).select("settings");

    res.status(200).json({
      success: true,
      message: "Notification settings updated successfully!",
      data: user.settings.notifications
    });

  } catch (error) {
    console.error("Update notification settings error:", error);
    res.status(500).json({ 
      success: false, 
      errorMessage: error.message 
    });
  }
};

// @desc    Update profile (already in userController, but adding here for completeness)
// @route   PUT /api/v1/settings/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { username, email, profilePicture, weight, height, age, goal } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Update fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (weight !== undefined) user.weight = weight;
    if (height !== undefined) user.height = height;
    if (age !== undefined) user.age = age;
    if (goal !== undefined) user.goal = goal;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      data: {
        username: updatedUser.username,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        weight: updatedUser.weight,
        height: updatedUser.height,
        age: updatedUser.age,
        goal: updatedUser.goal
      }
    });

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ 
      success: false, 
      errorMessage: error.message 
    });
  }
};