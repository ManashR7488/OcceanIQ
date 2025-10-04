import { generateToken } from "../middleware/auth.middleware.js";
import User from "../models/User.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate input
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    }

    // 2. Check if email is already registered
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use." });
    }

    // 3. Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Create the new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // 5. Generate JWT, set cookie
    generateToken(newUser, res);

    // 6. Return created user info (omit password)
    const userObj = newUser.toObject();
    delete userObj.password;
    delete userObj.__v;
    res.status(201).json({
      message: "Registration successful",
      user: userObj,
      success: true,
    });
  } catch (err) {
    console.log(err, "Error in userRegister controller");
    res.status(500).json({ message: "Server error during registration.", success: false });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // 2. Find user including hashed password
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 3. Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 4. Generate JWT, set cookie
    if (req.cookies?.token) {
      return res.status(400).json({ message: "Already logged in." });
    }
    const token = generateToken(user, res);

    // 5. Return user info (exclude password) and token
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.__v;
    res.status(200).json({
      message: "Login successful",
      user: userObj,
      success: true,
    });
  } catch (err) {
    console.log(err, "in controller userLogin");
    res.status(500).json({ message: "Server error during login.", success: false });
  }
};

export const logout = async (req, res) => {
  // Name of the cookie we set in generateToken()
  const COOKIE_NAME = "token";

  // Clear the cookie
  res.cookie(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    maxAge: 0, // 7
  });

  // Send confirmation
  res.status(200).json({ message: "Logout successful", success: true });
};


export const getProfile = (req, res) => {
  const user = req.user; // Assuming user information is stored in req.user
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json({ user, success: true });
};
