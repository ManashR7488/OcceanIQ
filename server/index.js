import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import cors from "cors";


import authRoute from "./routes/auth.route.js";

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

app.get("/", (req, res) => {
  res.json({
    message: "API is running...",
    greet: "Hello from Oceaniq Backend",
    time: new Date().toLocaleString(),
  });
});

app.use("/api/auth", authRoute);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
