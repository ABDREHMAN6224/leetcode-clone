import { z } from "zod";

export const problemSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    inputFormat: z.string().min(1, "Input format is required"),
    outputFormat: z.string().min(1, "Output format is required"),
    constraints: z.string().min(1, "Constraints are required"),
    functionSignature: z.string().min(1, "Function signature is required"),
    inputFile: z
      .instanceof(File)
      .refine((file) => file.size < 1000000, {
        message: "File size must be less than 1MB",
      })
      .refine((file) => file.type === "text/plain", {
        message: "File must be a text file",
      }),
    outputFile: z
      .instanceof(File)
      .refine((file) => file.size < 1000000, {
        message: "File size must be less than 1MB",
      })
      .refine((file) => file.type === "text/plain", {
        message: "File must be a text file",
      }),
  });
  
export enum Language {
    PYTHON = "PYTHON",
    JAVASCRIPT = "JAVASCRIPT",
  }
 export const submitSchema = z.object({
    code: z.string().min(1, "Code is required"),
    problemId: z.number().int().positive(),
    language: z.enum(["PYTHON", "JAVASCRIPT"]),
  });
  export type CustomRequest = Request & { user: number };

