import express from "express";
import { forgotPassword, getUsers, login, me, register } from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/forgot-password", forgotPassword);
router.get("/auth/me", auth, me);
router.get("/users", auth, getUsers);

export default router;
