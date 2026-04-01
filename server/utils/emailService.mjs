import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ✅ PRODUCTION: Gmail configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Gmail configuration error:', error);
  } else {
    console.log('✅ Gmail server is ready to send messages');
  }
});

// Get frontend URL from env or use default
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// Verification Email Template
export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${FRONTEND_URL}/verify-email/${token}`;
  
  const mailOptions = {
    from: '"Fitness Tracker" <noreply@fitnesstracker.com>',
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #333;">Welcome to Fitness Tracker! 🏋️‍♂️</h2>
        </div>
        
        <p style="color: #555; font-size: 16px;">Hello,</p>
        
        <p style="color: #555; font-size: 16px;">Thank you for registering! Please verify your email address to start your fitness journey.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 30px; background-color: #4CAF50; 
                    color: white; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
            Verify Email
          </a>
        </div>
        
        <p style="color: #555; font-size: 14px;">Or copy this link:</p>
        <p style="color: #777; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
        
        <p style="color: #999; font-size: 14px; margin-top: 20px;">This link will expire in 24 hours.</p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          If you didn't create an account, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', email);
    console.log('📧 Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw error;
  }
};

// Password Reset Email Template
export const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;
  
  const mailOptions = {
    from: '"Fitness Tracker" <noreply@fitnesstracker.com>',
    to: email,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #333;">Reset Your Password 🔐</h2>
        </div>
        
        <p style="color: #555; font-size: 16px;">Hello,</p>
        
        <p style="color: #555; font-size: 16px;">You requested to reset your password. Click the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 30px; background-color: #4CAF50; 
                    color: white; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #555; font-size: 14px;">Or copy this link:</p>
        <p style="color: #777; font-size: 14px; word-break: break-all;">${resetUrl}</p>
        
        <p style="color: #999; font-size: 14px; margin-top: 20px;">This link will expire in 1 hour.</p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          If you didn't request this, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);
    console.log('📧 Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    throw error;
  }
};