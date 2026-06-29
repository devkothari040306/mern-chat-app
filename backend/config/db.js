import mongoose from "mongoose";
import User from "../models/User.js";

const dropObsoleteUserIndexes = async () => {
  const indexes = await User.collection.indexes();
  const hasUsernameIndex = indexes.some((index) => index.name === "username_1");

  if (hasUsernameIndex) {
    await User.collection.dropIndex("username_1");
    console.log("Dropped obsolete users.username index");
  }
};

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is missing from environment variables");
    }

    const connection = await mongoose.connect(mongoUri);
    await dropObsoleteUserIndexes();
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
