'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import {
  Search,
  ExternalLink,
  TrendingUp,
  AlignLeft,
  Hash,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useSerp } from '@/hooks/use-serp'

// ── 统计卡片 ────────────────────────────────────────────────────
function StatCard({
  label,
  avg,
  range,
}: {
  label: string
  avg: number
  range: [number, number]
}) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2.5 flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-base font-semibold leading-none">{avg} 字符</span>
      <span className="text-xs text-muted-foreground">
        建议区间：{range[0]}–{range[1]}
      </span>
    </div>
  )
}

// ── 词频条形图 ───────────────────────────────────────────────────
function WordFreqBar({
  word,
  count,
  max,
}: {
  word: string
  count: number
  max: number
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 shrink-0 truncate font-medium">{word}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/60"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-5 text-right text-muted-foreground shrink-0">{count}</span>
    </div>
  )
}

// ── 结果条目 ────────────────────────────────────────────────────
function ResultItem({
  rank,
  title,
  url,
  description,
}: {
  rank: number
  title: string
  url: string
  description: string
}) {
  const hostname = (() => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  })()

  return (
    <div className="rounded-lg border bg-card px-3 py-2.5 flex flex-col gap-1">
      <div className="flex items-start gap-2">
        <span className="text-xs font-bold text-muted-foreground/60 shrink-0 mt-0.5 w-4 text-right">
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-primary hover:underline line-clamp-2 leading-snug flex items-start gap-1"
          >
            <span className="flex-1">{title}</span>
            <ExternalLink className="size-3 shrink-0 mt-0.5 opacity-60" />
          </a>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">{hostname}</p>
        </div>
      </div>
      {description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 pl-6 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}

// ── 骨架屏 ──────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="px-3 pb-3 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
      <Skeleton className="h-4 w-24 rounded" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-lg" />
      ))}
    </div>
  )
}

// ── 主组件 ──────────────────────────────────────────────────────
export const SerpPanel = () => {
  const [keyword, setKeyword] = useState('')
  const { data, isLoading, error, search, reset } = useSerp()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = () => {
    if (keyword.trim()) search(keyword)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleReset = () => {
    setKeyword('')
    reset()
    inputRef.current?.focus()
  }

  const maxWordCount = data?.topWords[0]?.count ?? 1

  return (
    <div className="flex flex-col h-full">
      {/* 搜索栏 */}
      <div className="px-3 pt-3 pb-2 shrink-0 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入目标关键词…"
            className="pl-8 h-8 text-sm"
            disabled={isLoading}
          />
        </div>
        {data ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 shrink-0"
            onClick={handleReset}
            title="重置"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-8 px-3 shrink-0"
            onClick={handleSearch}
            disabled={isLoading || !keyword.trim()}
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              '分析'
            )}
          </Button>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {/* 初始空状态 */}
        {!isLoading && !data && !error && (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Search className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">SERP 分析</p>
              <p className="text-xs text-muted-foreground mt-1">
                输入目标关键词，分析 Google 前 10 结果的 SEO 洞察
              </p>
            </div>
          </div>
        )}

        {/* 加载中 */}
        {isLoading && <LoadingSkeleton />}

        {/* 错误状态 */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="size-5 text-destructive" />
            </div>
            <p className="text-xs text-muted-foreground max-w-[200px]">{error}</p>
            <Button size="sm" variant="outline" onClick={handleSearch}>
              重试
            </Button>
          </div>
        )}

        {/* 分析结果 */}
        {data && !isLoading && (
          <div className="px-3 pb-4 flex flex-col gap-4">
            {/* 长度统计 */}
            <section>
              <SectionTitle icon={<TrendingUp className="size-3.5" />} title="长度统计" />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <StatCard
                  label="标题长度"
                  avg={data.titleStats.avgLength}
                  range={data.titleStats.recommendedRange}
                />
                <StatCard
                  label="描述长度"
                  avg={data.descriptionStats.avgLength}
                  range={data.descriptionStats.recommendedRange}
                />
              </div>
            </section>

            {/* 词频分析 */}
            {data.topWords.length > 0 && (
              <section>
                <SectionTitle icon={<Hash className="size-3.5" />} title="高频词 Top 20" />
                <div className="mt-2 flex flex-col gap-1.5">
                  {data.topWords.map(({ word, count }) => (
                    <WordFreqBar key={word} word={word} count={count} max={maxWordCount} />
                  ))}
                </div>
              </section>
            )}

            {/* 搜索结果 */}
            {data.results.length > 0 && (
              <section>
                <SectionTitle
                  icon={<AlignLeft className="size-3.5" />}
                  title={`前 ${data.results.length} 条结果`}
                />
                <div className="mt-2 flex flex-col gap-2">
                  {data.results.map((r, i) => (
                    <ResultItem
                      key={r.url}
                      rank={i + 1}
                      title={r.title}
                      url={r.url}
                      description={r.description}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── 区块标题 ─────────────────────────────────────────────────────
function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
      {icon}
      {title}
    </div>
  )
}
