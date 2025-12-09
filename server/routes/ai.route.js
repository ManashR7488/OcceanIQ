import express from "express";
import { chatQuery, researchQuery, dataUploadProxy, dataChatProxy } from "../controllers/ai.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { uploadDataMemory } from "../config/multer.config.js";

const router = express.Router();

router.post('/chat', chatQuery);
router.post('/research', researchQuery);
router.post('/data-upload', verifyToken, uploadDataMemory.single('file'), dataUploadProxy);
router.post('/data-chat', verifyToken, dataChatProxy);

export default router;