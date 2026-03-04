'use client'

import { Link2 } from 'lucide-react'

export const LinkPanel = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <Link2 className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">内链推荐</p>
        <p className="text-xs text-muted-foreground mt-1">
          基于当前文档内容，智能推荐工作区内相关文档作为内链
        </p>
      </div>
      <p className="text-xs text-muted-foreground/60">即将推出</p>
    </div>
  )
}
