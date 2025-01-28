import { PrismaClient, Problem } from "@prisma/client";
import {  Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import SingletonRedisClient from "../utils/redisClient";
import { CustomRequest, problemSchema,Language,submitSchema, multerFileSchema } from "../utils/types";
import { s3, uploadFile } from "../utils/aws";



const prisma = new PrismaClient();
const client = SingletonRedisClient.getInstance().getClient();

type Request2 = CustomRequest & { params: { id: string } };


export const updateProblem = catchAsync(async (req: Request2, res: Response, next: NextFunction) => {
  // @ts-ignore
  const {status} = req.body;
  const submissionId = parseInt(req.params.id);
  req.user =1
  const submission = await prisma.problemSubmission.update({
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
})

export const createProblem = catchAsync(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    req.user = 1;
    const problemData = problemSchema.parse(req.body);
    const parsed = {
      // @ts-ignore
      inputFile: multerFileSchema.parse(req.files?.inputFile?.[0]), // Ensure proper indexing
      // @ts-ignore
      outputFile: multerFileSchema.parse(req.files?.outputFile?.[0]),
    };

    const newProblem = await prisma.problem.create({
      data: {
        ...problemData,
        authorId: req.user,
      },
    });
   
    
    await uploadFile({
      originalname: `problems/${newProblem.id}/input.txt`,
      buffer: parsed.inputFile.buffer,
      mimetype: parsed.inputFile.mimetype,
    });
    await uploadFile({
      originalname: `problems/${newProblem.id}/output.txt`,
      buffer: parsed.outputFile.buffer,
      mimetype: parsed.outputFile.mimetype,
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
    const submission = await prisma.problemSubmission.create({
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
    client.lPush(
      "submissions",
      JSON.stringify({
        submissionId:submission.id,
        code: completedCode,
        problemId: submitData.problemId,
        userId: req.user,
        language: submitData.language,
      })
    );
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

  const test_file = await s3.getObject({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: `problems/${id}/input.txt`,
  }).promise();

   const test_inputs = test_file.Body?.toString().split("\n") || [];
  


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
  const finalResults = [];
  ${test_inputs
    .map(
      (input, index) =>
        `
        finalResults.push(${
          problem.functionSignature
          }(${input}))`
    ).join("\n")
  }
  console.log(JSON.stringify(finalResults));
    ${code}
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
    finalResults = []
    ${test_inputs
      .map(
        (input, index) =>
            `
          finalResults.append(
        ${
            problem.functionSignature
          }(${input}))`
      )
      .join("\n")}
      print(finalResults)
    `
    ;
};
