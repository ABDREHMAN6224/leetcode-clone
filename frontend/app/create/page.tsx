"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { defaultProblem, dummyProblem } from "@/lib/constants"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

const Div = ({children, vertical=true}: {children: React.ReactNode, vertical?: boolean}) => {
  return (
    <div className={`flex ${vertical && "flex-col"} gap-2`}>
      {children}
    </div>
  )
}

type FileType = File | null

export default function CreateProblem() {

  const [loading, setLoading] = useState(false)
  const [problem, setProblem] = useState(defaultProblem)
  const [files, setFiles] = useState<[FileType, FileType]>([null, null])

  const getFile = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFiles((prev) => {
      const newFiles = [...prev]
      newFiles[index] = file
      return newFiles as [FileType, FileType]
    })
  }

  const uploadProblem = async () => {
    if (loading) return;
    setLoading(true)
    const formData = new FormData()
    formData.append("title", problem.title)
    formData.append("description", problem.description)
    formData.append("difficulty", problem.difficulty || "EASY")
    formData.append("functionSignature", problem.functionSignature)
    formData.append("inputFormat", problem.inputFormat)
    formData.append("outputFormat", problem.outputFormat)
    formData.append("constraints", problem.constraints)
    formData.append("inputFile", files[0] as File)
    formData.append("outputFile", files[1] as File)
    
    await fetch("http://localhost:3000/api/create-problem", {
      method: "POST",
      body: formData,
    })

    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle onClick={() => setProblem(dummyProblem)}>Upload a Problem</CardTitle>
          <CardDescription>Fill in the necessary information to create a new problem</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Div>
            <Label>Title</Label>
            <Input placeholder="Sum of Squares" value={problem.title} onChange={(e) => setProblem({...problem, title: e.target.value})} />
          </Div>
          <Div>
            <Label>Description</Label>
            <Textarea placeholder="Write a function that returns the Sum of Squares of given numbers a, b" value={problem.description} onChange={(e) => setProblem({...problem, description: e.target.value})} />
          </Div>
          <Div>
            <Label>Function Signature</Label>
            <Input placeholder="getSumOfSquares" value={problem.functionSignature} onChange={(e) => setProblem({...problem, functionSignature: e.target.value})} />
          </Div>
          <Div>
            <Label>Input Format</Label>
            <Input placeholder="number, number" value={problem.inputFormat} onChange={(e) => setProblem({...problem, inputFormat: e.target.value})} />
          </Div>
          <Div>
            <Label>Output Format</Label>
            <Input placeholder="number" value={problem.outputFormat} onChange={(e) => setProblem({...problem, outputFormat: e.target.value})} />
          </Div>
          <Div>
            <Label>Constraints</Label>
            <Textarea placeholder="(a, b) < 10^10" value={problem.constraints} onChange={(e) => setProblem({...problem, constraints: e.target.value})} />
          </Div>
          <Div vertical={false}>
            <Div>
              <Label>Input File</Label>
              <Input type="file" onChange={(e) => getFile(0, e)}/>
            </Div>
            <Div>
              <Label>Output File</Label>
              <Input type="file" onChange={(e) => getFile(1, e)}/>
            </Div>
          </Div>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-center justify-between">
            <Button  onClick={uploadProblem} className="flex gap-2">
              Upload
              <svg className="size-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m14-7l-5-5l-5 5m5-5v12"/></svg>
            </Button>
            <Select onValueChange={(v) => setProblem(({...problem, difficulty: v as "EASY" | "MEDIUM" | "HARD"}))}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}