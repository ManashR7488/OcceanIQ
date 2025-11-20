import express from "express";
import {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  toggleQuestionVote,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentVote,
} from "../controllers/community.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import uploadOtolithMemory ,{
  
  handleMulterError,
} from "../config/multer.config.js";

const router = express.Router();

// Rename multer upload for clarity
const uploadImage = uploadOtolithMemory;

// Apply authentication to all community routes
router.use(verifyToken);

// Question Routes
router.post(
  "/questions",
  uploadImage.single("image"),
  handleMulterError,
  createQuestion
);
router.get("/questions", getQuestions);
router.get("/questions/:id", getQuestionById);
router.put("/questions/:id", updateQuestion);
router.delete("/questions/:id", deleteQuestion);
router.post("/questions/:id/vote", toggleQuestionVote);

// Comment Routes
router.post("/questions/:questionId/comments", createComment);
router.put("/comments/:id", updateComment);
router.delete("/comments/:id", deleteComment);
router.post("/comments/:id/vote", toggleCommentVote);

export default router;
