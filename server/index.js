import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import cors from "cors";


import authRoute from "./routes/auth.route.js";
import mapRoute from './routes/map.route.js';
import connectDB from "./config/db.js";
import e from "express";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const origin =
  process.env.NODE_ENV !== "development"
    ? process.env.CORS_ORIGIN
    : "http://localhost:5173";

app.use(
  cors({
    origin: origin,
    credentials: true,
  })
);

let isConnected = false;

const connectInServer = async () => {
  try {
    await connectDB();
    console.log("Database connected successfully");
    isConnected = true;
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

app.use(async (req, res, next) => {
  if (!isConnected) {
    await connectInServer();
    isConnected = true;
  }
  next();
});

app.get("/", (req, res) => {
  res.json({
    message: "API is running...",
    greet: "Hello from Oceaniq Backend",
    time: new Date().toLocaleString(),
  });
});

app.use("/api/auth", authRoute);
app.use('/api/map', mapRoute);


app.listen(PORT, async () => {
  // await connectDB();
  console.log(`Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

export default app;