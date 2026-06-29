import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { isUserOnline } from "../socket/socket.js";

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

export const register = async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
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

    const user = await User.findOne({ email });

    if (user) {
      console.log(`Password reset requested for ${user.email}`);
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
