import { Notification } from "../models/notificationModel.mjs";

// 📋 Get All Notifications (User Specific)
export const getNotifications = async (req, res) => {
  try {
    const { read, limit = 20, page = 1 } = req.query;

    let filter = {
      createdBy: req.user._id
    };

    // Filter by read/unread if provided
    if (read !== undefined) {
      filter.read = read === 'true';
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const data = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      createdBy: req.user._id,
      read: false
    });

    res.status(200).json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// ➕ Add Notification (System/Admin use)
export const addNotification = async (req, res) => {
  try {
    const notification = await Notification.create({
      ...req.body,
      createdBy: req.body.userId || req.user._id // Can specify user or use current
    });

    res.status(201).json({
      message: "Notification Added Successfully!",
      notification
    });
  } catch (e) {
    res.status(500).json({ errorMessage: e.message });
  }
};

// ✅ Mark as Read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user._id
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found or unauthorized" });
    }

    res.status(200).json({
      message: "Notification marked as read",
      notification
    });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// ✅ Mark All as Read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        createdBy: req.user._id,
        read: false
      },
      { read: true }
    );

    const unreadCount = await Notification.countDocuments({
      createdBy: req.user._id,
      read: false
    });

    res.status(200).json({
      message: "All notifications marked as read",
      unreadCount
    });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// ❌ Delete Notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found or unauthorized" });
    }

    res.status(200).json({
      message: "Notification Deleted Successfully!"
    });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// 🗑️ Delete All Read Notifications
export const clearReadNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      createdBy: req.user._id,
      read: true
    });

    res.status(200).json({
      message: "Read notifications cleared",
      deletedCount: result.deletedCount
    });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// 🔢 Get Unread Count Only
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      createdBy: req.user._id,
      read: false
    });

    res.status(200).json({ unreadCount: count });

  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};