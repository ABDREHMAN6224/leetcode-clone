'use client'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { useEffect, useState } from 'react'

import { Editor } from '@/components/Editor'
import { defaultProblem } from '@/lib/constants'
import { formatDate } from 'date-fns'
import { getDifficultyColor } from '@/app/page'
import { useParams } from 'next/navigation'
import { useSocket } from '@/app/utils/SokcetContext'

let sending=false

export default function Problem() {
  const params = useParams<{ id: string }>()
  const [problem, setProblem] = useState(defaultProblem)
  const [code, setCode] = useState("")
  const { sendMessage } = useSocket()

  useEffect(() => {
    const fetchProblem = async () => {
      const { problem } = (await (await fetch(`http://localhost:3000/api/problems/${params.id}`)).json()).data
      console.log(problem)
      setProblem({...problem})
      sendMessage(JSON.stringify({ type: "subscribe", payload: params.id }))
    }
    if(!sending){
      sending=true
      setTimeout(async () => {
        const code =`function getSumOfSquares(arg1, arg2){
          // TODO: return arg3
          return arg1*arg1
          }`
          const problemId = Number(params.id);
          const language = "JAVASCRIPT";
          const response = await fetch("http://localhost:3000/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, problemId, language }),
      });
      console.log((await response.json()).data)
      
    }, 5000)
  }

    fetchProblem()
  }, [params.id])

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

      <ResizablePanel defaultSize={70}>
        <ResizablePanelGroup direction='vertical'>
          <ResizablePanel defaultSize={65}>
            <Editor code={code} setCode={setCode} functionSignature={functionSignature} inputFormat={inputFormat} outputFormat={outputFormat} />
          </ResizablePanel>

          <ResizableHandle />
          
          <ResizablePanel className='p-2 text-xs' style={{ whiteSpace: 'pre-wrap' }} defaultSize={35}>
            {code}
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}