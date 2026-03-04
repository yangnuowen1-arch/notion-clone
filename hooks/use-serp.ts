import { useState, useCallback } from 'react'
import type { SerpAnalysis } from '@/app/api/serp/route'

interface UseSerpReturn {
  data: SerpAnalysis | null
  isLoading: boolean
  error: string | null
  search: (keyword: string) => Promise<void>
  reset: () => void
}

export function useSerp(): UseSerpReturn {
  const [data, setData] = useState<SerpAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  const search = useCallback(async (keyword: string) => {
    if (!keyword.trim()) return
    setIsLoading(true)
    setError(null)
    setData(null)

    try {
      const res = await fetch(`/api/serp?keyword=${encodeURIComponent(keyword.trim())}`)
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }

      setData(json as SerpAnalysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { data, isLoading, error, search, reset }
}
