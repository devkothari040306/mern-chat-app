import User from "../models/User.model.js";

export const getUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const users = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("Get users error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error("Get me error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};