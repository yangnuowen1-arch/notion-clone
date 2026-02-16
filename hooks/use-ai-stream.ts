import { useState, useCallback, useRef } from 'react'

export type AIMode = 'polish' | 'expand' | 'summarize' | 'continue' | 'translate'

interface UseAIStreamReturn {
  output: string//实时文本
  isStreaming: boolean//是否生成中
  error: string | null//错误状态
  startStream: (prompt: string, mode: AIMode) => void//开始生成
  stopStream: () => void//手动停止
  reset: () => void//清空
}

export function useAIStream(): UseAIStreamReturn {
  const [output, setOutput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const stopStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()//中止
      abortRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const reset = useCallback(() => {
    stopStream()
    setOutput('')
    setError(null)
  }, [stopStream])

  const startStream = useCallback(
    async (prompt: string, mode: AIMode) => {
      reset()
      setIsStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, mode }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || `HTTP ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No readable stream')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data: ')) continue

            const data = trimmed.slice(6)
            if (data === '[DONE]') {
              setIsStreaming(false)
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                throw new Error(parsed.error)
              }
              if (parsed.content) {
                setOutput((prev) => prev + parsed.content)
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue
              throw e
            }
          }
        }

        setIsStreaming(false)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setIsStreaming(false)
          return
        }
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        setIsStreaming(false)
      }
    },
    [reset]
  )

  return { output, isStreaming, error, startStream, stopStream, reset }
}
