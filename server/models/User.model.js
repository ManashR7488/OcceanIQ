import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'researcher', 'conservationist', 'policymaker', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for query optimization

// Email index (improves login and user lookup queries)
userSchema.index({ email: 1 });

// Role index (prepares for role-based access control)
userSchema.index({ role: 1 });

// CreatedAt index (optimizes sorting users by registration date)
userSchema.index({ createdAt: -1 });

const User = mongoose.model("User", userSchema);

export default User;
