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
exports.submitProblem = exports.getAllProblems = exports.accessProblem = exports.createProblem = exports.updateProblem = void 0;
const types_1 = require("../utils/types");
const client_1 = require("@prisma/client");
const aws_1 = require("../utils/aws");
const rabbitmqClient_1 = require("../utils/rabbitmqClient");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const prisma = new client_1.PrismaClient();
exports.updateProblem = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const { status } = req.body;
    const submissionId = parseInt(req.params.id);
    req.user = 1;
    const submission = yield prisma.problemSubmission.update({
        where: {
            id: submissionId,
        },
        data: {
            status,
        },
    });
    res.status(200).json({
        status: "success",
        data: {
            submission,
        },
    });
}));
exports.createProblem = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    req.user = 1;
    const problemData = types_1.problemSchema.parse(req.body);
    const parsed = {
        // @ts-ignore
        inputFile: types_1.multerFileSchema.parse((_b = (_a = req.files) === null || _a === void 0 ? void 0 : _a.inputFile) === null || _b === void 0 ? void 0 : _b[0]), // Ensure proper indexing
        // @ts-ignore
        outputFile: types_1.multerFileSchema.parse((_d = (_c = req.files) === null || _c === void 0 ? void 0 : _c.outputFile) === null || _d === void 0 ? void 0 : _d[0]),
    };
    const newProblem = yield prisma.problem.create({
        data: Object.assign(Object.assign({}, problemData), { authorId: req.user }),
    });
    yield Promise.all([
        yield (0, aws_1.uploadFile)({
            originalname: `problems/${newProblem.id}/input.txt`,
            buffer: parsed.inputFile.buffer,
            mimetype: parsed.inputFile.mimetype,
        }),
        yield (0, aws_1.uploadFile)({
            originalname: `problems/${newProblem.id}/output.txt`,
            buffer: parsed.outputFile.buffer,
            mimetype: parsed.outputFile.mimetype,
        })
    ]);
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
            // @ts-ignore
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
exports.getAllProblems = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const problems = (yield prisma.problem.findMany({
        orderBy: {
            createdAt: "desc",
        },
    }));
    res.status(200).json({
        status: "success",
        data: {
            problems,
        },
    });
}));
exports.submitProblem = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    req.user = 1;
    const submitData = types_1.submitSchema.parse(req.body);
    const completedCode = yield getCompletedCode(submitData.problemId, submitData.code, submitData.language);
    const submission = yield prisma.problemSubmission.create({
        data: {
            code: submitData.code,
            problemId: submitData.problemId,
            language: submitData.language,
            status: "PENDING",
            userId: req.user,
            testCasesResults: "",
            memory: 0,
            time: 0,
        },
    });
    rabbitmqClient_1.RabbitMqClient.getInstance().sendToQueue({
        submissionId: submission.id,
        code: completedCode,
        problemId: submitData.problemId,
        userId: req.user,
        language: submitData.language,
    });
    res.status(200).json({
        status: "success",
        data: {
            submission,
        },
    });
}));
function getCompletedCode(id, code, language) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const problem = yield prisma.problem.findUnique({
            where: {
                id,
            },
        });
        if (!problem) {
            throw new Error("Problem not found");
        }
        const test_file = yield aws_1.s3.getObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `problems/${id}/input.txt`,
        }).promise();
        const test_inputs = (((_a = test_file.Body) === null || _a === void 0 ? void 0 : _a.toString().split("\n")) || []).filter((input) => input.trim() !== "");
        if (language === types_1.Language.JAVASCRIPT) {
            return getJavascriptTemplate(code, test_inputs, problem);
        }
        else if (language === types_1.Language.PYTHON) {
            return getPythonTemplate(code, test_inputs, problem);
        }
        else {
            throw new Error("Invalid language");
        }
    });
}
const getJavascriptTemplate = (code, test_inputs, problem) => {
    return `
  const finalResults = [];

  ${test_inputs
        .map((input, index) => `
        finalResults.push(${problem.functionSignature}(${input}))`).join("\n")}
  console.log(JSON.stringify(finalResults));
    ${code}
    `;
};
const getPythonTemplate = (code, test_inputs, problem) => {
    return `
    ${code}
    print("final test cases logs")
    finalResults = []
    ${test_inputs
        .map((input, index) => `
          finalResults.append(
        ${problem.functionSignature}(${input}))`)
        .join("\n")}
      print(finalResults)
    `;
};
