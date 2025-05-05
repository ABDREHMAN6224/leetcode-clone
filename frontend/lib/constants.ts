import { ProblemType } from "@/types";

export const defaultProblem: ProblemType = {
  title: "",
  description: "",
  functionSignature: "",
  inputFormat: "",
  outputFormat: "",
  constraints: "",
  difficulty: "EASY"
};

export const dummyProblem: ProblemType = {
  title: "Sum of Squares",
  description: "Write a function that returns the Sum of Squares of given numbers a, b",
  functionSignature: "getSumOfSquares",
  inputFormat: "a, b",
  outputFormat: "sumOfSquares",
  constraints: "1 <= a, b <= 10^6",
};