import express from "express";
import { getMessages, sendMessage } from "../controllers/messageController.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/messages/:userId", auth, getMessages);
router.post("/messages/:userId", auth, upload.single("attachment"), sendMessage);

export default router;
