import express from "express";
import { getUsers, getMe } from "../controllers/user.controller.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", protectRoute, getMe);
router.get("/", protectRoute, getUsers);

export default router;