"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const problem_1 = require("../controllers/problem");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post("/create-problem", upload.fields([{ name: 'inputFile' }, { name: 'outputFile' }]), problem_1.createProblem);
router.post("/submit", problem_1.submitProblem);
router.put("/submissions/:id", problem_1.updateProblem);
router.get("/problems", problem_1.getAllProblems);
router.get("/problems/:id", problem_1.accessProblem);
exports.default = router;
