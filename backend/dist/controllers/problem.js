"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitProblem = exports.accessProblem = exports.createProblem = void 0;
const client_1 = require("@prisma/client");
const zod_1 = __importDefault(require("zod"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const redisClient_1 = __importDefault(require("../utils/redisClient"));
const prisma = new client_1.PrismaClient();
const client = redisClient_1.default.getInstance().getClient();
const problemSchema = zod_1.default.object({
    title: zod_1.default.string().min(1, "Title is required"),
    description: zod_1.default.string().min(1, "Description is required"),
    difficulty: zod_1.default.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    inputFormat: zod_1.default.string().min(1, "Input format is required"),
    outputFormat: zod_1.default.string().min(1, "Output format is required"),
    constraints: zod_1.default.string().min(1, "Constraints are required"),
    functionSignature: zod_1.default.string().min(1, "Function signature is required"),
    inputFile: zod_1.default
        .instanceof(File)
        .refine((file) => file.size < 1000000, {
        message: "File size must be less than 1MB",
    })
        .refine((file) => file.type === "text/plain", {
        message: "File must be a text file",
    }),
    outputFile: zod_1.default
        .instanceof(File)
        .refine((file) => file.size < 1000000, {
        message: "File size must be less than 1MB",
    })
        .refine((file) => file.type === "text/plain", {
        message: "File must be a text file",
    }),
});
var Language;
(function (Language) {
    Language["PYTHON"] = "PYTHON";
    Language["JAVASCRIPT"] = "JAVASCRIPT";
})(Language || (Language = {}));
const submitSchema = zod_1.default.object({
    code: zod_1.default.string().min(1, "Code is required"),
    problemId: zod_1.default.number().int().positive(),
    language: zod_1.default.enum(["PYTHON", "JAVASCRIPT"]),
});
exports.createProblem = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    req.user = 1;
    const problemData = problemSchema.parse(req.body);
    const newProblem = yield prisma.problem.create({
        data: Object.assign(Object.assign({}, problemData), { authorId: req.user }),
    });
    res.status(201).json({
        status: "success",
        data: {
            problem: newProblem,
        },
    });
}));
exports.accessProblem = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const problems = yield prisma.problem.findUnique({
        where: {
            id: parseInt(req.params.id),
        },
    });
    res.status(200).json({
        status: "success",
        data: {
            problems,
        },
    });
}));
exports.submitProblem = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    req.user = 1;
    const submitData = submitSchema.parse(req.body);
    const completedCode = yield getCompletedCode(submitData.problemId, submitData.code, submitData.language);
    console.log(completedCode);
    // client.lPush(
    //   "submissions",
    //   JSON.stringify({
    //     code: completedCode,
    //     problemId: submitData.problemId,
    //     userId: req.user,
    //     language: submitData.language,
    //   })
    // );
    // const submission = await prisma.problemSubmission.create({
    //   data: {
    //     code: submitData.code,
    //     problemId: submitData.problemId,
    //     language: submitData.language,
    //     status: "PENDING",
    //     userId: req.user,
    //     testCasesResults: "",
    //     memory: 0,
    //     time: 0,
    //   },
    // });
    res.status(200).json({
        status: "success",
        data: {
        // submission,
        },
    });
}));
function getCompletedCode(id, code, language) {
    return __awaiter(this, void 0, void 0, function* () {
        const problem = yield prisma.problem.findUnique({
            where: {
                id,
            },
        });
        if (!problem) {
            throw new Error("Problem not found");
        }
        const test_inputs = ["[1,2,3]", "[4,5,6]"];
        if (language === Language.JAVASCRIPT) {
            return getJavascriptTemplate(code, test_inputs, problem);
        }
        else if (language === Language.PYTHON) {
            return getPythonTemplate(code, test_inputs, problem);
        }
        else {
            throw new Error("Invalid language");
        }
    });
}
const getJavascriptTemplate = (code, test_inputs, problem) => {
    return `
    ${code}
    console.log("final test cases logs");
    ${test_inputs
        .map((input) => `${problem.functionSignature}(${input}));`)
        .join("\n")}
    `;
};
const getPythonTemplate = (code, test_inputs, problem) => {
    return `
    ${code}
    print("final test cases logs")
    ${test_inputs
        .map((input, index) => `print("Test case ${index + 1}: ",${problem.functionSignature}(${input}))`)
        .join("\n")}
    `;
};
