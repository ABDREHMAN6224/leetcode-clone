import express, { NextFunction } from "express"
import problemRouter from "./routes/problem"
import dotenv from "dotenv"
import AppError from "./utils/AppError"
import errorController from "./controllers/error";
dotenv.config()

const app = express()
app.use(express.json())

app.use("/api", problemRouter)

app.all("*", (req:any, res:any,next:NextFunction) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

app.use(errorController);

app.listen(3000, () => {
    console.log("Server is running on port 3000")
})