import { Request, Response, NextFunction } from "express";

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
  res.status(err.statusCode!).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
  });
};
