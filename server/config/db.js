import mongoose from 'mongoose';
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  const dbURI =
  process.env.NODE_ENV === 'development'
    ? 'mongodb://127.0.0.1:27017/OcceanIQ'
    : process.env.MONGO_URI;

  try {
    const connection = await mongoose.connect(dbURI);
    console.log('MongoDB connected:', connection.connection.host);
  } catch (error) {
    console.log("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;