import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getProfile, login, logout, signup } from "../controllers/auth.controller.js";

const route = express.Router();

// route: api/auth/signup
route.post("/signup", signup);

// route: api/auth/login
route.post("/login", login);

// route: api/auth/logout
route.post("/logout", logout);

// route: api/auth/profile
route.get("/profile", protect, getProfile);

export default route;
