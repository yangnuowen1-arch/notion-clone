'use client'

import { useState, useRef, useEffect } from 'react'
import { BlockNoteEditor } from '@blocknote/core'
import {
  Sparkles,
  Wand2,
  Expand,
  FileText,
  ArrowRight,
  Languages,
  Square,
  Copy,
  Check,
  ChevronUp,
  Plus,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAIStream, AIMode } from '@/hooks/use-ai-stream'
import { MarkdownRenderer } from './markdown-renderer'

interface AIPanelProps {
  editor: BlockNoteEditor
}

const AI_MODES: { value: AIMode; label: string; icon: React.ReactNode }[] = [
  { value: 'polish', label: '润色', icon: <Wand2 className="size-4" /> },
  { value: 'expand', label: '扩展', icon: <Expand className="size-4" /> },
  { value: 'summarize', label: '总结', icon: <FileText className="size-4" /> },
  { value: 'continue', label: '续写', icon: <ArrowRight className="size-4" /> },
  { value: 'translate', label: '翻译', icon: <Languages className="size-4" /> },
]

export const AIPanel = ({ editor }: AIPanelProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMode, setSelectedMode] = useState<AIMode>('polish')
  const [copied, setCopied] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)
  const { output, isStreaming, error, startStream, stopStream, reset } =
    useAIStream()

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const getSelectedText = (): string => {
    const selection = editor.getSelection()
    if (!selection) {
      const blocks = editor.document
      const texts = blocks
        .map((block) => {
          if (!block.content || !Array.isArray(block.content)) return ''
          return block.content
            .map((inline) => {
              if ('text' in inline) return inline.text
              return ''
            })
            .join('')
        })
        .filter(Boolean)
      return texts.join('\n')
    }

    const { blocks } = selection
    const texts = blocks
      .map((block) => {
        if (!block.content || !Array.isArray(block.content)) return ''
        return block.content
          .map((inline) => {
            if ('text' in inline) return inline.text
            return ''
          })
          .join('')
      })
      .filter(Boolean)
    return texts.join('\n')
  }

  const handleGenerate = () => {
    const text = getSelectedText()
    if (!text.trim()) return
    startStream(text, selectedMode)
  }

  const handleInsert = () => {
    if (!output.trim()) return

    const lines = output.split('\n').filter((line) => line.trim() !== '')
    const blocks = lines.map((line) => ({
      type: 'paragraph' as const,
      content: [{ type: 'text' as const, text: line, styles: {} }],
    }))

    try {
      const currentBlock = editor.getTextCursorPosition()
      if (currentBlock) {
        editor.insertBlocks(blocks, currentBlock.block, 'after')
      }
    } catch {
      editor.insertBlocks(blocks, editor.document[editor.document.length - 1], 'after')
    }

    reset()
    setIsOpen(false)
  }

  const handleReplace = () => {
    if (!output.trim()) return

    const selection = editor.getSelection()
    if (!selection) return

    const { blocks: selectedBlocks } = selection

    const lines = output.split('\n').filter((line) => line.trim() !== '')
    const newBlocks = lines.map((line) => ({
      type: 'paragraph' as const,
      content: [{ type: 'text' as const, text: line, styles: {} }],
    }))

    if (selectedBlocks.length > 0) {
      editor.insertBlocks(newBlocks, selectedBlocks[0], 'before')
      editor.removeBlocks(selectedBlocks)
    }

    reset()
    setIsOpen(false)
  }

  const handleCopy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) {
    return (
      <div className="flex justify-center py-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sparkles className="size-4" />
          AI 写作助手
        </Button>
      </div>
    )
  }

  return (
    <div className="border rounded-lg bg-card shadow-sm mx-auto max-w-2xl my-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-primary" />
          AI 写作助手
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            reset()
            setIsOpen(false)
          }}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* Mode selector */}
      <div className="flex gap-1.5 px-4 py-2.5 border-b flex-wrap">
        {AI_MODES.map((mode) => (
          <Button
            key={mode.value}
            variant={selectedMode === mode.value ? 'default' : 'outline'}
            size="xs"
            onClick={() => setSelectedMode(mode.value)}
            className="gap-1"
          >
            {mode.icon}
            {mode.label}
          </Button>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b">
        {!isStreaming ? (
          <Button size="sm" onClick={handleGenerate} className="gap-1.5">
            <Sparkles className="size-3.5" />
            生成
          </Button>
        ) : (
          <Button
            size="sm"
            variant="destructive"
            onClick={stopStream}
            className="gap-1.5"
          >
            <Square className="size-3" />
            停止
          </Button>
        )}
        <span className="text-xs text-muted-foreground">
          {isStreaming
            ? '正在生成...'
            : '选中文本后点击生成，或直接对全文进行操作'}
        </span>
      </div>

      {/* Output area */}
      {(output || error) && (
        <div className="px-4 py-3">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3 mb-2">
              错误：{error}
            </div>
          )}
          {output && (
            <>
              <div
                ref={outputRef}
                className="max-h-80 overflow-y-auto rounded-md bg-muted/50 p-3"
              >
                <MarkdownRenderer content={output} />
                {isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                )}
              </div>

              {/* Output actions */}
              {!isStreaming && (
                <div className="flex items-center gap-2 mt-2.5">
                  <Button
                    size="xs"
                    onClick={handleInsert}
                    className="gap-1"
                  >
                    <Plus className="size-3" />
                    插入到下方
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleReplace}
                    className="gap-1"
                  >
                    <ChevronUp className="size-3" />
                    替换选中
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleCopy}
                    className="gap-1"
                  >
                    {copied ? (
                      <Check className="size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    {copied ? '已复制' : '复制'}
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={reset}
                    className="gap-1 ml-auto"
                  >
                    重新生成
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
