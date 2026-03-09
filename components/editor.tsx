'use client'

import { useEffect, useMemo } from 'react'
import { BlockNoteEditor, PartialBlock } from '@blocknote/core'
import { filterSuggestionItems } from '@blocknote/core/extensions'
import { en } from '@blocknote/core/locales'
import { useCreateBlockNote } from '@blocknote/react'
import {
  FormattingToolbar,
  FormattingToolbarController,
  getDefaultReactSlashMenuItems,
  getFormattingToolbarItems,
  SuggestionMenuController,
} from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import { useTheme } from 'next-themes'
import { DefaultChatTransport } from 'ai'
import { Loader2, Square } from 'lucide-react'

import {
  AIExtension,
  AIMenuController,
  AIToolbarButton,
  getAISlashMenuItems,
} from '@blocknote/xl-ai'
import { en as aiEn } from '@blocknote/xl-ai/locales'
import '@blocknote/xl-ai/style.css'

import { Button } from '@/components/ui/button'
import { useAIRuntime } from '@/hooks/use-ai-runtime'
import { useEdgeStore } from '@/lib/edgestore'

interface EditorProps {
  onChange: (value: string) => void
  initialContent?: string
  editable?: boolean
  onEditorReady?: (editor: BlockNoteEditor) => void
}

export const Editor = ({ onChange, initialContent, editable, onEditorReady }: EditorProps) => {
  const { resolvedTheme } = useTheme()
  const { edgestore } = useEdgeStore()
  const aiRuntime = useAIRuntime()

  const handleUpload = async (file: File) => {
    const response = await edgestore.publicFiles.upload({ file })
    return response.url
  }

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/ai',
        fetch: aiRuntime.controlledFetch,
      }),
    [aiRuntime.controlledFetch],
  )

  const editor: BlockNoteEditor = useCreateBlockNote({
    dictionary: {
      ...en,
      ai: aiEn,
    },
    extensions: [
      AIExtension({
        transport,
      }),
    ],
    initialContent: initialContent
      ? (JSON.parse(initialContent) as PartialBlock[])
      : undefined,
    uploadFile: handleUpload,
  })

  useEffect(() => {
    onEditorReady?.(editor)
  }, [editor, onEditorReady])

  return (
    <div className="relative">
      <BlockNoteView
        editor={editor}
        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        editable={editable}
        // 禁用默认 FormattingToolbar 和 SlashMenu，替换为带 AI 的版本
        formattingToolbar={false}
        slashMenu={false}
        onChange={() => {
          onChange(JSON.stringify(editor.document, null, 2))
        }}
      >
        {/* AI 菜单控制器：处理 AI 生成结果的展示与应用 */}
        <AIMenuController />

        {/* 带 AI 按钮的格式化工具栏 */}
        <FormattingToolbarController
          formattingToolbar={() => (
            <FormattingToolbar>
              {getFormattingToolbarItems()}
              <AIToolbarButton />
            </FormattingToolbar>
          )}
        />

        {/* 带 /ai 入口的 Slash 菜单 */}
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(
              [
                ...getDefaultReactSlashMenuItems(editor),
                ...getAISlashMenuItems(editor),
              ],
              query,
            )
          }
        />
      </BlockNoteView>

      {(aiRuntime.isGenerating || aiRuntime.isStopping) && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {aiRuntime.isStopping ? '正在停止 AI...' : 'AI 正在生成...'}
          </span>
          <Button
            size="sm"
            variant="destructive"
            onClick={aiRuntime.stop}
            disabled={aiRuntime.isStopping}
            className="gap-1.5"
          >
            <Square className="size-3.5" />
            Stop
          </Button>
        </div>
      )}

      {aiRuntime.error && (
        <div className="fixed bottom-20 right-4 z-50 flex items-center gap-3 rounded-lg border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
          <span className="text-sm text-destructive">{aiRuntime.error}</span>
          <Button size="sm" variant="ghost" onClick={aiRuntime.reset}>
            关闭
          </Button>
        </div>
      )}
    </div>
  )
}
