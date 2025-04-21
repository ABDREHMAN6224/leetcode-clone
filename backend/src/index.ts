import express, { NextFunction } from "express";

import AppError from "./utils/AppError";
import cluster from "cluster";
import cors from "cors";
import dotenv from "dotenv";
import errorController from "./controllers/error";
import os from "os";
import problemRouter from "./routes/problem";

dotenv.config();
console.log(process.env.DATABSE_URL);

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
    console.log(`Primary process ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Starting a new worker...`);
        cluster.fork();
    });
} else {
    const app = express();
    app.use(cors())
    app.use(express.json());

    app.use("/api", problemRouter);

    app.all("*", (req: any, res: any, next: NextFunction) => {
        next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
    });

    app.use(errorController);

    app.listen(3000, () => {
        console.log(`Worker ${process.pid} is running on port 3000`);
    });
}