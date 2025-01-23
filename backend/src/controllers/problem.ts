import { PrismaClient, Problem } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import z from "zod";
import catchAsync from "../utils/catchAsync";
import SingletonRedisClient from "../utils/redisClient";
import { CustomRequest, problemSchema,Language,submitSchema } from "../utils/types";

const prisma = new PrismaClient();
const client = SingletonRedisClient.getInstance().getClient();



export const createProblem = catchAsync(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    req.user = 1;
    const problemData = problemSchema.parse(req.body);

    const newProblem = await prisma.problem.create({
      data: {
        ...problemData,
        authorId: req.user,
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        problem: newProblem,
      },
    });
  }
);

export const accessProblem = catchAsync(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const problems = await prisma.problem.findUnique({
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
  }
);

export const submitProblem = catchAsync(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    req.user = 1;
    const submitData = submitSchema.parse(req.body);

    const completedCode = await getCompletedCode(
      submitData.problemId,
      submitData.code,
      submitData.language as Language
    );
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
  }
);

async function getCompletedCode(id: number, code: string, language: Language) {
  const problem = await prisma.problem.findUnique({
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
  } else if (language === Language.PYTHON) {
    return getPythonTemplate(code, test_inputs, problem);
  } else {
    throw new Error("Invalid language");
  }
}

const getJavascriptTemplate = (
  code: string,
  test_inputs: string[],
  problem: Problem
) => {
  return `
    ${code}
    console.log("final test cases logs");
    ${test_inputs
      .map(
        (input, index) =>
          `console.log("Test case ${index + 1}: ",${
            problem.functionSignature
          }(${input}));`
      )
      .join("\n")}
    `;
};

const getPythonTemplate = (
  code: string,
  test_inputs: string[],
  problem: Problem
) => {
  return `
    ${code}
    print("final test cases logs")
    ${test_inputs
      .map(
        (input, index) =>
          `print("Test case ${index + 1}: ",${
            problem.functionSignature
          }(${input}))`
      )
      .join("\n")}
    `;
};
