import express from "express";
import { chatQuery, researchQuery } from "../controllers/ai.controller.js";


const router = express.Router();

router.post('/chat', chatQuery);
router.post('/research', researchQuery);

export default router;