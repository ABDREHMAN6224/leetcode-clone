import { CustomRequest, Language, multerFileSchema, problemSchema, submitSchema } from "../utils/types";
import { NextFunction, Response } from "express";
import { PrismaClient, Problem } from "@prisma/client";
import { s3, uploadFile } from "../utils/aws";

import { RabbitMqClient } from "../utils/rabbitmqClient";
import catchAsync from "../utils/catchAsync";

const prisma = new PrismaClient();

type Request2 = CustomRequest & { params: { id: string } };


export const deleteAllProblems = catchAsync(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    req.user = 1;
    // first delete all submissions related to the problems
    await prisma.problemSubmission.deleteMany({});
    await prisma.problem.deleteMany({});
    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

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
   
    await Promise.all([
    await uploadFile({
      originalname: `problems/${newProblem.id}/input.txt`,
      buffer: parsed.inputFile.buffer,
      mimetype: parsed.inputFile.mimetype,
    }),
    await uploadFile({
      originalname: `problems/${newProblem.id}/output.txt`,
      buffer: parsed.outputFile.buffer,
      mimetype: parsed.outputFile.mimetype,
    })
    ]);


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
    const problem = await prisma.problem.findUnique({
      where: {
        // @ts-ignore
        id: parseInt(req.params.id),
      },
    });

    if (!problem) {
      return res.status(404).json({
        status: "fail",
        message: "Problem not found",
      });
    }
    const test_input_file = "input.txt"
    const test_output_file = "output.txt"

    

    const test_inputs = (await s3.getObject({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: `problems/${problem.id}/${test_input_file}`,
    }).promise()).Body?.toString().split("\n") || [];
    const test_outputs = (await s3.getObject({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: `problems/${problem.id}/${test_output_file}`,
    }).promise()).Body?.toString().split("\n") || [];

    const testCases = test_inputs.map((input, index) => ({
      input: input.trim(),
      output: test_outputs[index]?.trim() || "",
    }));
    console.log({testCases})

    res.status(200).json({
      status: "success",
      data: {
        problem,
        testCases,
      },
    });
  }
);

export const getAllProblems = catchAsync(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const problems = (await prisma.problem.findMany(
      {
        orderBy: {
          createdAt: "desc",
        },
      }
    ));
    res.status(200).json({
      status: "success",
      data: {
        problems,
      },
    });
  }
)

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

    RabbitMqClient.getInstance().sendToQueue({
      submissionId: submission.id,
      code: completedCode,
      problemId: submitData.problemId,
      userId: req.user,
      language: submitData.language,
    })

    res.status(200).json({
      status: "success",
      data: {
        submission,
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

   const test_inputs = (test_file.Body?.toString().split("\n") || []).filter(
    (input) => input.trim() !== ""
  );
  


  if (language === Language.JAVASCRIPT) {
    console.log(test_inputs)
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
