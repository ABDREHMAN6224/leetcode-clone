'use client'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Editor } from '@/components/Editor'
import { defaultProblem } from '@/lib/constants'
import { formatDate } from 'date-fns'
import { getDifficultyColor } from '@/app/page'
import { useParams } from 'next/navigation'
import { useSocket } from '@/app/utils/SokcetContext'

type TerminalStatusType = "TIME_LIMIT_EXCEEDED" | string
type ResultType = {input: string, output: string}

type TerminalResponseType = {
  status: TerminalStatusType
  results: string | ResultType[]
}

export default function Problem() {
  const params = useParams<{ id: string }>()
  const [problem, setProblem] = useState(defaultProblem)
  const [code, setCode] = useState("")
  const [submissionPending, setSubmissionPending] = useState(false)
  const [terminalResponse, setTerminalResponse] = useState<TerminalResponseType | null>(null)

  const { sendMessage, socket } = useSocket()

  useEffect(() => {
    const fetchProblem = async () => {
      const { problem,testCases } = (await (await fetch(`http://localhost:3000/api/problems/${params.id}`)).json()).data
      console.log(testCases)
            setProblem({...problem})
      sendMessage(JSON.stringify({ type: "subscribe", payload: params.id }))
    }
    fetchProblem()
  }, [params.id])

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log({data})
        setTerminalResponse(data.payload)
        setSubmissionPending(false)
      };
    }
  }, [socket])


  const submitSolution = async () => {
    console.log({code})
    setSubmissionPending(true)
    await fetch("http://localhost:3000/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        language: "JAVASCRIPT",
        problemId: Number(params.id)
      })
    })
  }

  const terminalContainerClass = (s: TerminalStatusType) => {
    switch (s) {
      case "TIME_LIMIT_EXCEEDED":
        return "text-orange-600"
      case "RUNTIME_ERROR":
        return "text-red-600"
      case "WRONG_ANSWER":
        return "text-red-600"
      case "ACCEPTED":
        return "text-green-500"
      default:
        return ""
    }
  }

  const { title, difficulty, createdAt, description, constraints, inputFormat, outputFormat, functionSignature } = problem ?? defaultProblem

  return (
    <ResizablePanelGroup className='min-h-screen' direction='horizontal'>
      <ResizablePanel defaultSize={30} className='flex flex-col gap-4 p-8' style={{ whiteSpace: 'pre-wrap' }}>
        <div className='flex flex-col gap-2'>
          <div className='flex justify-between items-center'>
            <p className={`text-xs p-1 rounded-lg px-2 text-white font-bold ${getDifficultyColor(difficulty!)}`}>{difficulty}</p>
            <p className=''>{formatDate(createdAt || Date.now(), "do MMMM y")}</p>
          </div>
          <p className='text-3xl font-bold'>{`${params.id}. ${title}`}</p>
        </div>
        <div className='flex flex-col gap-2'>
          <p className='font-bold text-lg'>Problem Statement</p>
          <p className='rounded-md p-2 bg-neutral-200 shadow-sm'>
            {description}
          </p>
        </div>
        <div className='flex flex-col gap-2'>
          <p className='font-bold text-lg'>Constraints</p>
          <p className='rounded-md p-2 bg-neutral-200 shadow-sm italic'>
            {constraints}
          </p>
        </div>
        <div className='flex flex-col gap-2'>
          <p className='font-bold text-lg'>Inputs</p>
          <p className='rounded-md p-2 bg-neutral-200 shadow-sm italic'>
            {inputFormat}
          </p>
        </div>
        <div className='flex flex-col gap-2'>
          <p className='font-bold text-lg'>Output</p>
          <p className='rounded-md p-2 bg-neutral-200 shadow-sm italic'>
            {outputFormat}
          </p>
        </div>
      </ResizablePanel>
      
      <ResizableHandle />

      <ResizablePanel defaultSize={70} className='relative'>
        <ResizablePanelGroup direction='vertical'>
          <ResizablePanel defaultSize={65}>
            <Editor code={code} setCode={setCode} functionSignature={functionSignature} inputFormat={inputFormat} outputFormat={outputFormat} />
          </ResizablePanel>
          
          <ResizableHandle />
            
          <ResizablePanel className='p-2 flex flex-col gap-2' style={{ whiteSpace: 'pre-wrap' }} defaultSize={35}>
              {submissionPending ?
              <div className='flex-1 flex flex-col gap-2 justify-center items-center'>
                <p className='p-4 bg-neutral-300 rounded-md shadow animate-bounce'>Submitting...</p>
              </div>:  
              terminalResponse ? 
              <div className={`flex flex-col gap-6 flex-1 p-4 overflow-y-auto ${terminalContainerClass(terminalResponse.status)}`}>
                <p className={`font-bold text-2xl`}>{terminalResponse.status}</p>
                <>
                {typeof terminalResponse.results === "string" ?
                <div className='flex-1 p-4 text-black bg-neutral-200 shadow rounded-md flex flex-col gap-2'>
                  <p className='font-bold text-xl'>Results</p>
                  <p style={{"whiteSpace": "pre-wrap"}}>{terminalResponse.results}</p>
                </div>:
                <div className='flex flex-col gap-4 text-black'>
                  {terminalResponse.results.map(({input, output}, i) => (
                    <div key={i} className='flex gap-2 items-center'>
                      <p className='bg-neutral-100 shadow p-1 rounded-md w-32 text-center'>{`Input: ${input}`}</p>
                      {"=>"}
                      <p className='bg-neutral-100 shadow p-1 rounded-md w-32 text-center'>{`Output: ${output}`}</p>
                    </div>
                  ))}
                </div>}
                </>
                {/* <p style={{"whiteSpace": "pre-wrap"}}>{JSON.stringify({terminalResponse}, null, 2)}</p> */}
              </div>:
              <div className='flex-1 flex flex-col gap-2 justify-center items-center'>
                <p className='p-4 bg-neutral-300 rounded-md shadow'>Click on The Submit button to Check your Solution</p>
              </div>}
            <div className='flex justify-end gap-4'>
              <Button variant={"secondary"} onClick={() => setCode("")}>Reset Code</Button>
              <Button onClick={submitSolution}>Submit</Button>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}