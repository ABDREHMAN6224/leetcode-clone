import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, basicSetup } from 'codemirror'
import React, { useEffect, useRef, useState } from 'react'

import { indentWithTab } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { keymap } from '@codemirror/view'

type EditorProps = {
  code: string,
  setCode: (s: string) => void
  functionSignature: string
  inputFormat: string
  outputFormat: string
}

const initialCode = (sig: string, ins: string, outs: string) => {
  const typeMap: Record<string, string> = {
    "number": "n",
    "string": "s",
    "array": "arr",
    "object": "obj"
  }
  const counts: Record<string, number> = {}

  const convert = (format: string) => {
    return format.split(",").map(i => i.trim()).map(i => {
      const base = typeMap[i] || "arg"
      counts[base] = (counts[base] || 0) + 1
      return `${base}${counts[base]}`
    })
  }
  const args = convert(ins)
  const returns = convert(outs)

  return `const ${sig} = (${args.join(", ")}) => {
  // TODO: return ${returns.length === 1 ? returns[0] : `[${returns.join(", ")}]`}
}`
}

export const Editor = ({ code, setCode, functionSignature, inputFormat, outputFormat }: EditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    // Clean up any previous editor
    if (viewRef.current) {
      viewRef.current.destroy()
    }

    const updateListener = EditorView.updateListener.of((v) => {
      if (v.docChanged) {
        setCode(v.state.doc.toString())
      }
    })

    // Create editor state and view
    const startState = EditorState.create({
      doc: initialCode(functionSignature, inputFormat, outputFormat),
      extensions: [basicSetup, javascript(), updateListener, keymap.of([indentWithTab])]
    })

    viewRef.current = new EditorView({
      state: startState,
      parent: editorRef.current
    })

    // Cleanup on unmount
    return () => {
      viewRef.current?.destroy()
    }
  }, [functionSignature])

  return (
    <div className='size-full'>
      <div ref={editorRef} className='size-full text-lg'/>
    </div>
  )
}