import dns from "dns";
import mongoose from "mongoose";
import User from "../models/User.js";

const configureLocalSrvDns = (mongoUri) => {
  if (!mongoUri.startsWith("mongodb+srv://") || process.env.NODE_ENV === "production") {
    return;
  }

  const dnsServers = (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers.length) {
    dns.setServers(dnsServers);
  }
};

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

    configureLocalSrvDns(mongoUri);
    const connection = await mongoose.connect(mongoUri);
    await dropObsoleteUserIndexes();
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
