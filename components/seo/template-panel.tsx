'use client'

import { LayoutTemplate } from 'lucide-react'

export const TemplatePanel = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <LayoutTemplate className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">内容模板</p>
        <p className="text-xs text-muted-foreground mt-1">
          提供可复用的 SEO 内容结构模板，支持一键套用到编辑器
        </p>
      </div>
      <p className="text-xs text-muted-foreground/60">即将推出</p>
    </div>
  )
}
