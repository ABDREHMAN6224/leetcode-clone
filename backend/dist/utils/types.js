"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitSchema = exports.Language = exports.problemSchema = exports.multerFileSchema = void 0;
const zod_1 = require("zod");
exports.multerFileSchema = zod_1.z.object({
    buffer: zod_1.z.instanceof(Buffer),
    size: zod_1.z.number().max(1000000, { message: "File size must be less than 1MB" }),
    mimetype: zod_1.z.string().refine((type) => type === "text/plain", {
        message: "File must be a text file",
    }),
});
exports.problemSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    description: zod_1.z.string().min(1, "Description is required"),
    difficulty: zod_1.z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    inputFormat: zod_1.z.string().min(1, "Input format is required"),
    outputFormat: zod_1.z.string().min(1, "Output format is required"),
    constraints: zod_1.z.string().min(1, "Constraints are required"),
    functionSignature: zod_1.z.string().min(1, "Function signature is required"),
});
var Language;
(function (Language) {
    Language["PYTHON"] = "PYTHON";
    Language["JAVASCRIPT"] = "JAVASCRIPT";
})(Language || (exports.Language = Language = {}));
exports.submitSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, "Code is required"),
    problemId: zod_1.z.number().int().positive(),
    language: zod_1.z.enum(["PYTHON", "JAVASCRIPT"]),
});
