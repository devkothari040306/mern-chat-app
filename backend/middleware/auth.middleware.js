import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;
    if (!token)
      return res.status(401).json({ error: "Unauthorized - no token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user)
      return res.status(401).json({ error: "Unauthorized - user not found" });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized - invalid token" });
  }
};

export default protectRoute;