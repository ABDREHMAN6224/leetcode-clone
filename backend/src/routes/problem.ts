import express from "express"
import { createProblem, submitProblem } from "../controllers/problem"
import multer from "multer";

const router = express.Router()

const upload = multer({ storage: multer.memoryStorage() });

router.post("/create-problem",upload.fields([{name: 'inputFile'}, {name: 'outputFile'}]),createProblem)
router.post("/submit",submitProblem)

export default router