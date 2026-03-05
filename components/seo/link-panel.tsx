'use client'

import { useState, useCallback } from 'react'
import { BlockNoteEditor } from '@blocknote/core'
import {
  Link2,
  Loader2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { InternalLinksResponse } from '@/app/api/internal-links/route'

interface LinkPanelProps {
  editor: BlockNoteEditor
  documentId: string
}

interface LinkResult {
  id: string
  title: string
  score: number
}

export const LinkPanel = ({ editor, documentId }: LinkPanelProps) => {
  const [results, setResults] = useState<LinkResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)

  const analyze = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/internal-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentDocumentId: documentId }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)

      const data = json as InternalLinksResponse
      setResults(data.results)
      setHasAnalyzed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }, [documentId])

  const insertLink = useCallback(
    (docId: string, title: string) => {
      try {
        editor.createLink(`/documents/${docId}`, title)
      } catch (err) {
        console.error('插入链接失败', err)
      }
    },
    [editor],
  )

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      <Button
        size="sm"
        onClick={analyze}
        disabled={isLoading}
        className="w-full gap-2"
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RefreshCw className="size-4" />
        )}
        {isLoading ? '分析中...' : hasAnalyzed ? '重新分析' : '分析内链'}
      </Button>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {!hasAnalyzed && !isLoading && !error && (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Link2 className="size-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            点击「分析内链」，基于当前文档内容
            <br />
            智能推荐工作区内相关文档
          </p>
        </div>
      )}

      {hasAnalyzed && results.length === 0 && !isLoading && (
        <p className="text-center text-xs text-muted-foreground py-6">
          未找到相关文档，请尝试增加更多内容后重新分析
        </p>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground font-medium">
            推荐内链（{results.length}）
          </p>

          {results.map((doc) => (
            <div
              key={doc.id}
              className="rounded-lg border bg-card p-3 flex flex-col gap-2"
            >
              <div className="flex items-start gap-2">
                <Link2 className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-sm font-medium leading-snug flex-1 wrap-break-word">
                  {doc.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  相似度：{(doc.score * 100).toFixed(0)}%
                </span>

                <div className="flex gap-1 ml-auto shrink-0">
                  <Button
                    size="xs"
                    variant="outline"
                    className="gap-1 h-6 text-xs px-2"
                    onClick={() => window.open(`/documents/${doc.id}`, '_blank')}
                  >
                    <ExternalLink className="size-3" />
                    预览
                  </Button>
                  <Button
                    size="xs"
                    className="gap-1 h-6 text-xs px-2"
                    onClick={() => insertLink(doc.id, doc.title)}
                  >
                    <Link2 className="size-3" />
                    插入
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
