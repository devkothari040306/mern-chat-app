import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { isMailerConfigured, sendPasswordResetEmail } from "../utils/mailer.js";
import { isUserOnline } from "../socket/socket.js";

const jwtConfigError = () => ({
  success: false,
  message: "Authentication is not configured. Set JWT_SECRET on the backend.",
});

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getClientUrl = () => {
  const firstClientUrl = (process.env.CLIENT_URL || process.env.FRONTEND_URL || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean)[0];

  return firstClientUrl || "http://localhost:5000";
};

export const register = async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(503).json(jwtConfigError());
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const user = await User.create({ name, email, password, avatar });
    const token = createToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(503).json(jwtConfigError());
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = createToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!isMailerConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Password reset email is not configured",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists for that email, password reset instructions will be sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${getClientUrl().replace(/\/$/, "")}/?resetToken=${resetToken}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl,
      });
    } catch (mailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error(`Password reset email failed: ${mailError.message}`);

      return res.status(502).json({
        success: false,
        message: "Could not send reset email. Check Gmail app password settings.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "If an account exists for that email, password reset instructions will be sent.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not process password reset request",
      error: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset link is invalid or expired",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not reset password",
      error: error.message,
    });
  }
};

export const me = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: publicUser(req.user),
  });
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("name email avatar createdAt updatedAt")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      users: users.map((user) => ({
        ...publicUser(user),
        online: isUserOnline(user._id),
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not fetch users",
      error: error.message,
    });
  }
};
