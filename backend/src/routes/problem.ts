import express from "express"
import { createProblem, submitProblem } from "../controllers/problem"

const router = express.Router()

router.get("/create-problem",createProblem)
router.get("/submit",submitProblem)

export default router