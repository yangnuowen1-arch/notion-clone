'use client'

import { X, Search, LayoutTemplate, Link2, Sparkles } from 'lucide-react'
import { BlockNoteEditor } from '@blocknote/core'

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AIPanel } from '@/components/ai/ai-panel'
import { SerpPanel } from '@/components/seo/serp-panel'
import { TemplatePanel } from '@/components/seo/template-panel'
import { LinkPanel } from '@/components/seo/link-panel'

interface SEODrawerProps {
  editor: BlockNoteEditor
  onClose: () => void
}

export const SEODrawer = ({ editor, onClose }: SEODrawerProps) => {
  return (
    <div className="flex flex-col h-full border-l bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <span className="text-sm font-semibold">SEO 工具</span>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ai" className="flex flex-col flex-1 min-h-0">
        <div className="px-3 pt-2 pb-1 shrink-0">
          <TabsList className="w-full grid grid-cols-4 h-auto p-1">
            <TabsTrigger value="serp" className="flex flex-col gap-0.5 py-1.5 px-1 text-xs h-auto">
              <Search className="size-3.5" />
              SERP
            </TabsTrigger>
            <TabsTrigger value="template" className="flex flex-col gap-0.5 py-1.5 px-1 text-xs h-auto">
              <LayoutTemplate className="size-3.5" />
              模板
            </TabsTrigger>
            <TabsTrigger value="link" className="flex flex-col gap-0.5 py-1.5 px-1 text-xs h-auto">
              <Link2 className="size-3.5" />
              内链
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex flex-col gap-0.5 py-1.5 px-1 text-xs h-auto">
              <Sparkles className="size-3.5" />
              AI
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="serp" className="mt-0 h-full">
            <SerpPanel />
          </TabsContent>

          <TabsContent value="template" className="mt-0 h-full">
            <TemplatePanel editor={editor} />
          </TabsContent>

          <TabsContent value="link" className="mt-0 h-full">
            <LinkPanel />
          </TabsContent>

          <TabsContent value="ai" className="mt-0 px-3 pb-3">
            <AIPanel editor={editor} embedded />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
