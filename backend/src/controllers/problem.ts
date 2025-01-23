import { PrismaClient, Problem, } from '@prisma/client'
import { Request, Response, NextFunction } from "express";


const prisma = new PrismaClient()


export const createProblem = catchAsync(async (req:Request, res:Response,next:NextFunction) => {
    const problem:Omit<Problem,'id'|'author'|'createdAt'|'updatedAt'> = req.body;

    const newProblem = await prisma.problem.create({
        data:{
            ...problem,
        }
    })

    res.status(201).json({
        status:"success",
        data:{
            problem:newProblem
        }
    })
})


export const submitProblem = catchAsync(async (req:Request, res:Response,next:NextFunction) => {})