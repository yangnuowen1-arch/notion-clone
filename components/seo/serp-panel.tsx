'use client'

import { Search } from 'lucide-react'

export const SerpPanel = () => {
  return (
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
      <p className="text-xs text-muted-foreground/60">即将推出</p>
    </div>
  )
}
