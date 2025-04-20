import express from "express"
import { accessProblem, createProblem, getAllProblems, submitProblem, updateProblem } from "../controllers/problem"
import multer from "multer";

const router = express.Router()

const upload = multer({ storage: multer.memoryStorage() });

router.post("/create-problem",upload.fields([{name: 'inputFile'}, {name: 'outputFile'}]),createProblem)
router.post("/submit",submitProblem)
router.put("/submissions/:id",updateProblem)
router.get("/problems",getAllProblems)
router.get("/problems/:id",accessProblem)

export default router