'use client'

import { useEffect } from 'react'
import { BlockNoteEditor, PartialBlock } from '@blocknote/core'

import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import { useTheme } from 'next-themes'

import { useEdgeStore } from '@/lib/edgestore'

interface EditorProps {
  onChange: (value: string) => void
  initialContent?: string
  editable?: boolean
  onEditorReady?: (editor: BlockNoteEditor) => void
}

export const Editor = ({ onChange, initialContent, editable, onEditorReady }: EditorProps) => {
  const { resolvedTheme } = useTheme()
  const { edgestore } = useEdgeStore()

  const handleUpload = async (file: File) => {
    const response = await edgestore.publicFiles.upload({
      file,
    })
    return response.url
  }

  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: initialContent
      ? (JSON.parse(initialContent) as PartialBlock[])
      : undefined,
    uploadFile: handleUpload,
  })

  useEffect(() => {
    onEditorReady?.(editor)
  }, [editor, onEditorReady])

  return (
    <BlockNoteView
      editor={editor}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      editable={editable}
      onChange={() => {
        onChange(JSON.stringify(editor.document, null, 2))
      }}
    />
  )
}
