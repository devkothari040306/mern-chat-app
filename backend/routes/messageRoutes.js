import express from "express";
import { getMessages, sendMessage } from "../controllers/messageController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/messages/:userId", auth, getMessages);
router.post("/messages/:userId", auth, sendMessage);

export default router;
