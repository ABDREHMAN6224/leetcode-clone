import express from "express"
import { createProblem, submitProblem } from "../controllers/problem"

const router = express.Router()

router.post("/create-problem",createProblem)
router.post("/submit",submitProblem)

export default router