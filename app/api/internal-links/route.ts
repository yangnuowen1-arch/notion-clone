import { auth } from '@clerk/nextjs/server'
import { fetchQuery } from 'convex/nextjs'
import { NextRequest, NextResponse } from 'next/server'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import {
  findSimilarDocuments,
  extractTextFromBlocks,
  type DocumentInput,
  type SimilarDocument,
} from '@/lib/tfidf'

export const dynamic = 'force-dynamic'

export interface InternalLinksResponse {
  results: SimilarDocument[]
}

interface RequestBody {
  /** 当前文档 ID，后端据此拉取 content 及用户文档列表 */
  currentDocumentId: string
}

export async function POST(req: NextRequest) {
  try {
    const token = await (await auth()).getToken({ template: 'convex' })
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = (await req.json()) as RequestBody
    const { currentDocumentId } = body
    if (!currentDocumentId) {
      return NextResponse.json({ error: '缺少 currentDocumentId' }, { status: 400 })
    }

    const document = await fetchQuery(
      api.documents.getById,
      { documentId: currentDocumentId as Id<'documents'> },
      { token },
    )
    if (!document) {
      return NextResponse.json({ error: '文档不存在' }, { status: 404 })
    }

    const documents = await fetchQuery(
      api.documents.getSearch,
      { userId: document.userId },
      { token },
    )

    const currentText = extractTextFromBlocks(document.content ?? '')
    const pool: DocumentInput[] = documents.map((d) => ({
      id: d._id,
      title: d.title,
      content: d.content,
    }))
    const results = findSimilarDocuments(currentText, pool, 5, currentDocumentId)

    return NextResponse.json({ results } satisfies InternalLinksResponse)
  } catch (err) {
    console.error('[internal-links]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
