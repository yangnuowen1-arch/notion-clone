import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export interface SerpResult {
  title: string
  url: string
  description: string
  titleLength: number
  descriptionLength: number
}

export interface SerpAnalysis {
  keyword: string
  results: SerpResult[]
  titleStats: {
    avgLength: number
    minLength: number
    maxLength: number
    recommendedRange: [number, number]
  }
  descriptionStats: {
    avgLength: number
    minLength: number
    maxLength: number
    recommendedRange: [number, number]
  }
  topWords: Array<{ word: string; count: number }>
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'is',
  'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'this', 'that', 'these', 'those', 'it', 'its', 'as', 'if', 'than',
  'then', 'so', 'yet', 'both', 'each', 'not', 'no', 'nor', 'how',
  'what', 'which', 'who', 'when', 'where', 'why', 'all', 'any', 'more',
  'most', 'other', 'some', 'such', 'can', 'get', 'your', 'you', 'we',
  '的', '了', '是', '在', '和', '与', '或', '也', '都', '中', '有', '不',
])

function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
}

function computeTopWords(
  results: SerpResult[],
  topN = 20
): Array<{ word: string; count: number }> {
  const freq: Record<string, number> = {}
  for (const r of results) {
    const words = [
      ...extractWords(r.title),
      ...extractWords(r.description),
    ]
    for (const w of words) {
      freq[w] = (freq[w] ?? 0) + 1
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }))
}

function computeLengthStats(lengths: number[]) {
  if (lengths.length === 0) {
    return { avgLength: 0, minLength: 0, maxLength: 0, recommendedRange: [0, 0] as [number, number] }
  }
  const avg = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
  const min = Math.min(...lengths)
  const max = Math.max(...lengths)
  const p25 = lengths.sort((a, b) => a - b)[Math.floor(lengths.length * 0.25)]
  const p75 = lengths[Math.floor(lengths.length * 0.75)]
  return {
    avgLength: avg,
    minLength: min,
    maxLength: max,
    recommendedRange: [p25 ?? min, p75 ?? max] as [number, number],
  }
}

// SerpApi 有机结果项结构（见 https://serpapi.com/search-api）
interface SerpApiOrganicItem {
  title?: string
  link?: string
  snippet?: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get('keyword')?.trim()

  if (!keyword) {
    return Response.json({ error: 'keyword is required' }, { status: 400 })
  }

  const apiKey = process.env.SERPAPI_API_KEY

  if (!apiKey) {
    return Response.json(
      { error: 'SerpApi 未配置，请设置环境变量 SERPAPI_API_KEY' },
      { status: 503 }
    )
  }

  const searchUrl = new URL('https://serpapi.com/search')
  searchUrl.searchParams.set('engine', 'google')
  searchUrl.searchParams.set('q', keyword)
  searchUrl.searchParams.set('api_key', apiKey)
  searchUrl.searchParams.set('num', '10')

  const res = await fetch(searchUrl.toString())

  if (!res.ok) {
    const body = await res.text()
    return Response.json(
      { error: `SerpApi 请求失败: ${res.status}`, detail: body },
      { status: 502 }
    )
  }

  const data = await res.json()
  if (data.error) {
    return Response.json(
      { error: data.error || 'SerpApi 返回错误' },
      { status: 502 }
    )
  }
  const items: SerpApiOrganicItem[] = (data.organic_results ?? []).slice(0, 10)

  const results: SerpResult[] = items.map(item => {
    const title = item.title ?? ''
    const url = item.link ?? ''
    const description = item.snippet ?? ''
    return {
      title,
      url,
      description,
      titleLength: title.length,
      descriptionLength: description.length,
    }
  })

  const titleStats = computeLengthStats(results.map(r => r.titleLength))
  const descriptionStats = computeLengthStats(results.map(r => r.descriptionLength))
  const topWords = computeTopWords(results)

  const analysis: SerpAnalysis = {
    keyword,
    results,
    titleStats,
    descriptionStats,
    topWords,
  }

  return Response.json(analysis)
}
