"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AppError_1 = __importDefault(require("./utils/AppError"));
const cluster_1 = __importDefault(require("cluster"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const error_1 = __importDefault(require("./controllers/error"));
const os_1 = __importDefault(require("os"));
const problem_1 = __importDefault(require("./routes/problem"));
dotenv_1.default.config();
console.log(process.env.DATABSE_URL);
const numCPUs = os_1.default.cpus().length;
if (cluster_1.default.isPrimary) {
    console.log(`Primary process ${process.pid} is running`);
    for (let i = 0; i < numCPUs; i++) {
        cluster_1.default.fork();
    }
    cluster_1.default.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Starting a new worker...`);
        cluster_1.default.fork();
    });
}
else {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: "*",
    }));
    app.use(express_1.default.json());
    app.use("/api", problem_1.default);
    app.all("*", (req, res, next) => {
        next(new AppError_1.default(`Can't find ${req.originalUrl} on this server!`, 404));
    });
    app.use(error_1.default);
    app.listen(3000, () => {
        console.log(`Worker ${process.pid} is running on port 3000`);
    });
}
