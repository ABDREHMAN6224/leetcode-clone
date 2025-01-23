"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = __importDefault(require("zod"));
exports.default = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    sendErrorDev(err, res);
};
const sendErrorDev = (err, res) => {
    if (err instanceof zod_1.default.ZodError) {
        console.log(err.message);
        return res.status(400).json({
            status: 'fail',
            errors: err.errors.map((error) => error.path.join('.') + ': ' + error.message),
        });
    }
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: err.stack,
    });
};
