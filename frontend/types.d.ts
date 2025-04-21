export type ProblemType = {
  id?: number
  difficulty?: "EASY" | "MEDIUM" | "HARD"
  title: string
  description: string
  functionSignature: string
  inputFormat: string
  outputFormat: string
  constraints: string
}