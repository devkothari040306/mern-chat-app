import express from "express";
import { sendMessage, getMessages, getConversations } from "../controllers/message.controller.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/conversations", protectRoute, getConversations);
router.get("/:receiverId", protectRoute, getMessages);
router.post("/send/:receiverId", protectRoute, sendMessage);

export default router;