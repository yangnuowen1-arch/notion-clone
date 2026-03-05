"use client"

import { useState, useCallback } from "react"
import { BlockNoteEditor } from "@blocknote/core"
import { PanelRight } from "lucide-react"

import Toolbar from "@/app/(main)/_components/toolbar"
import Cover from "@/components/cover"
import { Editor } from "@/components/editor"
import { SEODrawer } from "@/components/seo/seo-drawer"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import { use } from "react"

interface DocumentIdPageProps{
  params: Promise<{
    documentId: Id<"documents">
  }>
}

const DocumentIdPage = ({ params }: DocumentIdPageProps) => {
  const { documentId } = use(params)
  const document = useQuery(api.documents.getById, { documentId })
  const update = useMutation(api.documents.update)

  const [seoOpen, setSeoOpen] = useState(false)
  const [editorInstance, setEditorInstance] = useState<BlockNoteEditor | null>(null)

  const handleEditorReady = useCallback((editor: BlockNoteEditor) => {
    setEditorInstance(editor)
  }, [])

  const onChange = (content: string) => {
    update({ id: documentId, content })
  }

  if (document === undefined) {
    return <div>Loading...</div>
  }

  if (document === null) {
    return <div>Document not found</div>
  }

  return (
    <div className="flex min-h-full">
      {/* Main content area */}
      <div className="flex-1 min-w-0 pb-40">
        <Cover url={document.coverImage} />

        {/* SEO toggle button */}
        <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
          <div className="flex justify-end pt-2 pr-2">
            <Button
              variant={seoOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSeoOpen((prev) => !prev)}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <PanelRight className="size-4" />
              SEO 工具
            </Button>
          </div>

          <Toolbar initialData={document} />
          <Editor
            initialContent={document.content}
            onChange={onChange}
            editable
            onEditorReady={handleEditorReady}
          />
        </div>
      </div>

      {/* SEO Drawer - sticky so it stays visible while scrolling */}
      {seoOpen && editorInstance && (
        <div className="w-80 shrink-0 sticky top-0 h-screen overflow-hidden">
          <SEODrawer
            editor={editorInstance}
            onClose={() => setSeoOpen(false)}
            documentId={documentId}
          />
        </div>
      )}
    </div>
  )
}

export default DocumentIdPage
