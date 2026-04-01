import bcrypt from "bcryptjs";
import crypto from 'crypto';
import User from "../models/userModel.mjs";
import { generateToken } from "../utils/generateToken.mjs";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/emailService.mjs";

// ==================== REGISTER WITH EMAIL VERIFICATION ====================
export const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, profilePicture } = req.body;

    // -------- Manual Validation --------
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email and password are required"
      });
    }

    if (!/^[A-Za-z\s]*$/.test(username)) {
      return res.status(400).json({
        message: "Username must contain only alphabets"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    // -------- Check Existing Email --------
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    // -------- Check Existing Username --------
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        message: "Username already taken"
      });
    }

    // -------- Generate Email Verification Token --------
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // -------- Hash Password --------
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // -------- Create User --------
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      profilePicture,
      emailVerificationToken,
      emailVerificationExpires,
      isEmailVerified: false
    });

    // -------- Send Verification Email --------
    try {
      await sendVerificationEmail(email, emailVerificationToken);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // User created but email failed - still return success but inform user
      return res.status(201).json({
        message: "User registered successfully. But verification email could not be sent. Please contact support.",
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
          isEmailVerified: false
        }
      });
    }

    res.status(201).json({
      message: "User registered successfully. Please check your email to verify your account.",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        isEmailVerified: false
      }
    });

  } catch (error) {
    next(error);
  }
};

// ==================== VERIFY EMAIL ====================
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification token"
      });
    }

    // Update user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      message: "Email verified successfully! You can now login."
    });

  } catch (error) {
    next(error);
  }
};

// ==================== RESEND VERIFICATION EMAIL ====================
export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        message: "Email already verified"
      });
    }

    // Generate new token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // Send email
    await sendVerificationEmail(email, emailVerificationToken);

    res.status(200).json({
      message: "Verification email resent successfully"
    });

  } catch (error) {
    next(error);
  }
};

// ==================== FORGOT PASSWORD ====================
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    // Send email
    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return res.status(500).json({
        message: "Failed to send reset email. Please try again."
      });
    }

    res.status(200).json({
      message: "Password reset email sent successfully"
    });

  } catch (error) {
    next(error);
  }
};

// ==================== RESET PASSWORD ====================
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token"
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      message: "Password reset successfully! You can now login."
    });

  } catch (error) {
    next(error);
  }
};

// ==================== MODIFIED LOGIN (Check Email Verification) ====================
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        message: "Please verify your email before logging in",
        needsVerification: true,
        email: user.email
      });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    next(error);
  }
};



// LOGOUT
export const logoutUser = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });

  res.status(200).json({ message: "Logged out successfully" });
};

// GET CURRENT USER (Protected Route)
export const getCurrentUser = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        profilePicture: req.user.profilePicture
      }
    });
  } catch (error) {
    next(error);
  }
};