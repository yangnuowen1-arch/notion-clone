import { Corpus, Similarity } from 'tiny-tfidf'

/** 中文停用词（tiny-tfidf 自带英文，此处补充中文） */
const CHINESE_STOPWORDS = [
  '的', '了', '是', '在', '和', '与', '或', '也', '都', '中', '有', '不',
  '我', '他', '她', '它', '这', '那', '里', '上', '下', '来', '去',
  '很', '就', '还', '到', '要', '会', '你', '们', '一', '个',
  '对', '为', '以', '从', '已', '把', '被', '使', '让', '此',
  '其', '等', '之', '于', '但', '而', '及', '即', '若', '虽',
]

export interface DocumentInput {
  id: string
  title: string
  content?: string
}

export interface SimilarDocument {
  id: string
  title: string
  score: number
}

/** 从 BlockNote JSON 内容中提取纯文本 */
export function extractTextFromBlocks(content: string): string {
  try {
    const blocks = JSON.parse(content) as unknown[]
    const texts: string[] = []

    const visit = (nodes: unknown[]) => {
      for (const node of nodes) {
        const b = node as Record<string, unknown>
        if (Array.isArray(b.content)) {
          for (const inline of b.content as Record<string, unknown>[]) {
            if (typeof inline.text === 'string') {
              texts.push(inline.text)
            }
            if (Array.isArray(inline.content)) {
              for (const inner of inline.content as Record<string, unknown>[]) {
                if (typeof inner.text === 'string') texts.push(inner.text)
              }
            }
          }
        }
        if (Array.isArray(b.children)) visit(b.children as unknown[])
      }
    }

    visit(blocks)
    return texts.join(' ')
  } catch {
    return content
  }
}

/**
 * 基于 tiny-tfidf（BM25 + 余弦相似度）从文档池中找出与当前文本最相似的 topN 篇文档
 */
export function findSimilarDocuments(
  currentText: string,
  documents: DocumentInput[],
  topN = 5,
  excludeId?: string,
): SimilarDocument[] {
  const pool = excludeId ? documents.filter((d) => d.id !== excludeId) : documents
  if (!pool.length) return []

  const currentRaw = currentText.trim()
  if (!currentRaw) return []

  const names: string[] = [excludeId ?? '__current__', ...pool.map((d) => d.id)]
  const texts: string[] = [
    currentRaw,
    ...pool.map((d) => {
      const raw = d.content
        ? extractTextFromBlocks(d.content) + ' ' + d.title
        : d.title
      return raw.trim() || d.title
    }),
  ]
  const corpus = new Corpus(names, texts, {
    useDefaultStopwords: true,//是否使用内置停用词列表
    customStopwords: CHINESE_STOPWORDS,// 要添加或专门使用的额外停用词
  })

  const similarity = new Similarity(corpus)
  //返回一个对象，该对象具有属性 identifiers （矩阵中项的标识符数组）和 matrix （一个数组的数组，其中值表示项之间的距离；距离为 1.0 - 相似度，因此 0 = 完全相同）。
  const { identifiers, matrix } = similarity.getDistanceMatrix()
  const currentIndex = identifiers.indexOf(excludeId ?? '__current__')
  if (currentIndex < 0) return []

  const titleById = new Map(pool.map((d) => [d.id, d.title]))
  const scored = identifiers
    .map((id: string, j: number) => ({
      id,
      title: titleById.get(id) ?? id,
      score: 1 - matrix[currentIndex][j],//相似度距离
    }))
    .filter((r: SimilarDocument) => r.id !== (excludeId ?? '__current__') && r.score > 0)
    .sort((a: SimilarDocument, b: SimilarDocument) => b.score - a.score)//降序排列
    .slice(0, topN)

  return scored
}
