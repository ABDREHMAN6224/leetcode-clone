import { Request, Response, NextFunction } from "express";
import z from "zod";
interface CustomError extends Error {
  statusCode?: number;
  status?: string;
}

export default (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  sendErrorDev(err, res);
};

const sendErrorDev = (err: CustomError, res: Response) => {
  if (err instanceof z.ZodError) {
    console.log(err.message);
    return res.status(400).json({
      status: 'fail',
      errors: err.errors.map((error) => error.path.join('.') + ': ' + error.message),
    });
  }
  res.status(err.statusCode!).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
  });
};
