import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { emitToUser } from "../socket/socket.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getOrCreateConversation = async (currentUserId, otherUserId) => {
  let conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, otherUserId], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [currentUserId, otherUserId],
    });
  }

  return conversation;
};

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const conversation = await getOrCreateConversation(req.user._id, userId);

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .populate("sender", "name email avatar")
      .populate("receiver", "name email avatar");

    await Message.updateMany(
      { conversationId: conversation._id, sender: userId, receiver: req.user._id, read: false },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      conversation,
      messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not fetch messages",
      error: error.message,
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { text } = req.body;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message text is required",
      });
    }

    if (String(req.user._id) === String(userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a message to yourself",
      });
    }

    const receiver = await User.findById(userId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }

    const conversation = await getOrCreateConversation(req.user._id, userId);

    const message = await Message.create({
      conversationId: conversation._id,
      sender: req.user._id,
      receiver: userId,
      text: text.trim(),
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name email avatar")
      .populate("receiver", "name email avatar");

    emitToUser(userId, "newMessage", populatedMessage);

    return res.status(201).json({
      success: true,
      message: "Message sent",
      data: populatedMessage,
      conversation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not send message",
      error: error.message,
    });
  }
};
