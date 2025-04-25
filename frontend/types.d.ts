export type ProblemType = {
  id?: number
  createdAt?: Date;
  difficulty?: "EASY" | "MEDIUM" | "HARD"
  title: string
  description: string
  functionSignature: string
  inputFormat: string
  outputFormat: string
  constraints: string
}