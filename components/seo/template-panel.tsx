'use client'

import { useState } from 'react'
import { BlockNoteEditor, PartialBlock } from '@blocknote/core'
import {
  LayoutTemplate,
  FileText,
  ShoppingCart,
  BookOpen,
  Megaphone,
  ChevronRight,
  Check,
  Eye,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ── 类型 ──────────────────────────────────────────────────────────
type TemplateCategory = 'blog' | 'product' | 'guide' | 'landing'

interface Template {
  id: string
  title: string
  description: string
  category: TemplateCategory
  blocks: PartialBlock[]
}

// ── 内置模板数据 ──────────────────────────────────────────────────
const BUILTIN_TEMPLATES: Template[] = [
  {
    id: 'blog-article',
    title: '博客文章',
    category: 'blog',
    description: '标准 SEO 博客结构：引言 → 正文 → 小结 → CTA',
    blocks: [
      {
        type: 'heading',
        props: { level: 1 },
        content: [{ type: 'text', text: '文章标题（目标关键词放在前面）', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '在这里写引言段落。简要说明本文将解决的问题，并在首段自然地包含目标关键词。保持 2-3 句话，吸引读者继续阅读。',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '什么是 [主题]？', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '在此定义核心概念，帮助读者快速理解主题背景。', styles: {} },
        ],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '[主题] 的核心优势', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: '优势一：……', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: '优势二：……', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: '优势三：……', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '如何 [做某事]：分步指南', styles: {} }],
      },
      {
        type: 'numberedListItem',
        content: [{ type: 'text', text: '第一步：……', styles: {} }],
      },
      {
        type: 'numberedListItem',
        content: [{ type: 'text', text: '第二步：……', styles: {} }],
      },
      {
        type: 'numberedListItem',
        content: [{ type: 'text', text: '第三步：……', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '常见问题（FAQ）', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 3 },
        content: [{ type: 'text', text: 'Q：[常见问题1]？', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'A：在此回答问题。', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 3 },
        content: [{ type: 'text', text: 'Q：[常见问题2]？', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'A：在此回答问题。', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '总结', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '回顾文章要点，重申目标关键词，引导读者采取下一步行动。',
            styles: {},
          },
        ],
      },
    ],
  },
  {
    id: 'product-review',
    title: '产品评测',
    category: 'product',
    description: '专业评测结构：概览 → 亮点 → 不足 → 评分 → 购买建议',
    blocks: [
      {
        type: 'heading',
        props: { level: 1 },
        content: [{ type: 'text', text: '[产品名称] 深度评测：值得购买吗？', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '本文将从多维度评测 [产品名称]，帮助你做出最佳购买决策。',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '产品概览', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '品牌：', styles: { bold: true } },
          { type: 'text', text: '[品牌名]', styles: {} },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '价格：', styles: { bold: true } },
          { type: 'text', text: '¥[价格]', styles: {} },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '适用人群：', styles: { bold: true } },
          { type: 'text', text: '[目标用户]', styles: {} },
        ],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '核心亮点', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [
          { type: 'text', text: '亮点一：', styles: { bold: true } },
          { type: 'text', text: '……', styles: {} },
        ],
      },
      {
        type: 'bulletListItem',
        content: [
          { type: 'text', text: '亮点二：', styles: { bold: true } },
          { type: 'text', text: '……', styles: {} },
        ],
      },
      {
        type: 'bulletListItem',
        content: [
          { type: 'text', text: '亮点三：', styles: { bold: true } },
          { type: 'text', text: '……', styles: {} },
        ],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '需要改进的地方', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: '不足一：……', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: '不足二：……', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '与竞品对比', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '在此对比 [产品名称] 与同类竞品的核心差异，说明选择它的理由。',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '综合评分', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '性能：', styles: { bold: true } },
          { type: 'text', text: '⭐⭐⭐⭐⭐（5/5）', styles: {} },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '性价比：', styles: { bold: true } },
          { type: 'text', text: '⭐⭐⭐⭐（4/5）', styles: {} },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '易用性：', styles: { bold: true } },
          { type: 'text', text: '⭐⭐⭐⭐（4/5）', styles: {} },
        ],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '购买建议', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '总结：[产品名称] 适合 [目标用户]，如果你需要 [核心价值]，这款产品值得入手。',
            styles: {},
          },
        ],
      },
    ],
  },
  {
    id: 'how-to-guide',
    title: '攻略指南',
    category: 'guide',
    description: '权威指南结构：问题定义 → 分步说明 → 技巧 → 注意事项',
    blocks: [
      {
        type: 'heading',
        props: { level: 1 },
        content: [{ type: 'text', text: '如何 [做某事]：完整攻略指南（2026）', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '本指南将手把手教你 [做某事]，无论你是新手还是有一定基础，都能从中获得实用的方法和技巧。',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '你需要什么', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: '工具/材料一：……', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: '工具/材料二：……', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: '工具/材料三：……', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '分步操作指南', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 3 },
        content: [{ type: 'text', text: '第一步：[步骤名称]', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '详细描述第一步的操作方法……', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 3 },
        content: [{ type: 'text', text: '第二步：[步骤名称]', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '详细描述第二步的操作方法……', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 3 },
        content: [{ type: 'text', text: '第三步：[步骤名称]', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '详细描述第三步的操作方法……', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '专家技巧与最佳实践', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [
          { type: 'text', text: '技巧一：', styles: { bold: true } },
          { type: 'text', text: '……', styles: {} },
        ],
      },
      {
        type: 'bulletListItem',
        content: [
          { type: 'text', text: '技巧二：', styles: { bold: true } },
          { type: 'text', text: '……', styles: {} },
        ],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '常见错误与避坑指南', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '列出新手常见的错误，帮助读者少走弯路……',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '小结', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '恭喜你！按照以上步骤，你已经学会了 [做某事]。如有疑问，欢迎在评论区留言。',
            styles: {},
          },
        ],
      },
    ],
  },
  {
    id: 'landing-page',
    title: '落地页',
    category: 'landing',
    description: '高转化落地页：标题钩子 → 痛点 → 解决方案 → 证明 → CTA',
    blocks: [
      {
        type: 'heading',
        props: { level: 1 },
        content: [{ type: 'text', text: '[产品/服务]：[核心价值主张，10字以内]', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '副标题：用一句话补充说明产品优势，强化信任感。无需注册，立即开始。',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '你是否正在面对这些问题？', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: '痛点一：……（用户深有同感的具体问题）', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: '痛点二：……', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: '痛点三：……', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '我们的解决方案', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '简明扼要地说明产品/服务如何解决以上问题，重点突出差异化价值。',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '核心功能', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 3 },
        content: [{ type: 'text', text: '功能一', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '描述这个功能如何帮助用户……', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 3 },
        content: [{ type: 'text', text: '功能二', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '描述这个功能如何帮助用户……', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 3 },
        content: [{ type: 'text', text: '功能三', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '描述这个功能如何帮助用户……', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '用户评价', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '"这个产品彻底改变了我的工作方式，效率提升了 300%。" —— [用户姓名]，[职位]',
            styles: { italic: true },
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '"强烈推荐！客服响应迅速，产品质量超出预期。" —— [用户姓名]，[职位]',
            styles: { italic: true },
          },
        ],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '常见问题', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 3 },
        content: [{ type: 'text', text: 'Q：[购买/使用顾虑1]？', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'A：……', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 3 },
        content: [{ type: 'text', text: 'Q：[购买/使用顾虑2]？', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'A：……', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '立即开始', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '加入超过 [X] 位用户，今天就体验 [产品名称]。[免费试用 / 立即购买] →',
            styles: {},
          },
        ],
      },
    ],
  },
]

// ── 分类配置 ──────────────────────────────────────────────────────
const CATEGORIES: { value: TemplateCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: '全部', icon: <LayoutTemplate className="size-3.5" /> },
  { value: 'blog', label: '博客', icon: <FileText className="size-3.5" /> },
  { value: 'product', label: '评测', icon: <ShoppingCart className="size-3.5" /> },
  { value: 'guide', label: '指南', icon: <BookOpen className="size-3.5" /> },
  { value: 'landing', label: '落地页', icon: <Megaphone className="size-3.5" /> },
]

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  blog: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  product: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  guide: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  landing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  blog: '博客',
  product: '评测',
  guide: '指南',
  landing: '落地页',
}

// ── 预览内容提取 ──────────────────────────────────────────────────
function extractPreviewLines(blocks: PartialBlock[]): string[] {
  const lines: string[] = []
  for (const block of blocks) {
    if (lines.length >= 8) break
    const text = extractBlockText(block)
    if (text) lines.push(text)
  }
  return lines
}

function extractBlockText(block: PartialBlock): string {
  if (!block.content || !Array.isArray(block.content)) return ''
  return block.content
    .map((inline) => {
      if (typeof inline === 'object' && 'text' in inline) return inline.text as string
      return ''
    })
    .join('')
}

function getBlockPrefix(block: PartialBlock): string {
  if (block.type === 'heading') {
    const level = (block.props as { level?: number })?.level ?? 1
    return '#'.repeat(level) + ' '
  }
  if (block.type === 'bulletListItem') return '• '
  if (block.type === 'numberedListItem') return '1. '
  return ''
}

// ── 预览对话框 ────────────────────────────────────────────────────
function PreviewDialog({
  template,
  onApply,
  open,
  onOpenChange,
}: {
  template: Template
  onApply: () => void
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const previewLines = template.blocks.slice(0, 12)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {template.title}
            <span
              className={`text-[10px] font-normal px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[template.category]}`}
            >
              {CATEGORY_LABELS[template.category]}
            </span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
        </DialogHeader>

        {/* 模板结构预览 */}
        <div className="flex-1 overflow-y-auto rounded-lg border bg-muted/30 p-3 text-xs font-mono space-y-0.5 min-h-0">
          {previewLines.map((block, i) => {
            const text = extractBlockText(block)
            const prefix = getBlockPrefix(block)
            const isHeading = block.type === 'heading'
            const level = (block.props as { level?: number })?.level ?? 1
            return (
              <div
                key={i}
                className={`leading-relaxed ${
                  isHeading
                    ? level === 1
                      ? 'font-bold text-sm mt-2 first:mt-0'
                      : level === 2
                        ? 'font-semibold mt-2 first:mt-0 text-foreground'
                        : 'font-medium text-muted-foreground'
                    : 'text-muted-foreground pl-2'
                }`}
              >
                <span className="text-muted-foreground/40 mr-1">{prefix}</span>
                {text}
              </div>
            )
          })}
          {template.blocks.length > 12 && (
            <div className="text-muted-foreground/50 pt-1">
              …还有 {template.blocks.length - 12} 个块
            </div>
          )}
        </div>

        <div className="flex gap-2 shrink-0 pt-1">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenChange(false)}>
            <X className="size-3.5 mr-1.5" />
            关闭
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => {
              onApply()
              onOpenChange(false)
            }}
          >
            <Check className="size-3.5 mr-1.5" />
            套用模板
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── 模板卡片 ──────────────────────────────────────────────────────
function TemplateCard({
  template,
  onPreview,
  onApply,
}: {
  template: Template
  onPreview: () => void
  onApply: () => void
}) {
  const blockCount = template.blocks.length
  const headingCount = template.blocks.filter((b) => b.type === 'heading').length
  const previewLines = extractPreviewLines(template.blocks)

  return (
    <div className="group rounded-lg border bg-card px-3 py-2.5 flex flex-col gap-2 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium leading-tight">{template.title}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${CATEGORY_COLORS[template.category]}`}
            >
              {CATEGORY_LABELS[template.category]}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            {template.description}
          </p>
          {previewLines.length > 0 && (
            <div className="mt-1.5 rounded border bg-muted/20 px-2 py-1.5 text-[10px] text-muted-foreground/80 line-clamp-3 space-y-0.5">
              {previewLines.slice(0, 3).map((line, i) => (
                <div key={i} className="truncate">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
          <span>{blockCount} 个块</span>
          <span>·</span>
          <span>{headingCount} 个标题</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={onPreview}
          >
            <Eye className="size-3 mr-1" />
            预览
          </Button>
          <Button
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onApply}
          >
            套用
            <ChevronRight className="size-3 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── 确认覆盖对话框 ────────────────────────────────────────────────
function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  templateTitle,
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  templateTitle: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border shadow-xl p-5 max-w-xs w-full mx-4">
        <p className="text-sm font-semibold mb-1">套用「{templateTitle}」？</p>
        <p className="text-xs text-muted-foreground mb-4">
          此操作将替换编辑器中的全部现有内容，无法撤销。
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onCancel}>
            取消
          </Button>
          <Button size="sm" className="flex-1" onClick={onConfirm}>
            确认套用
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── 主组件 ────────────────────────────────────────────────────────
interface TemplatePanelProps {
  editor: BlockNoteEditor
}

export const TemplatePanel = ({ editor }: TemplatePanelProps) => {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all')
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [confirmTemplate, setConfirmTemplate] = useState<Template | null>(null)
  const [appliedId, setAppliedId] = useState<string | null>(null)

  const filtered =
    activeCategory === 'all'
      ? BUILTIN_TEMPLATES
      : BUILTIN_TEMPLATES.filter((t) => t.category === activeCategory)

  const applyTemplate = (template: Template) => {
    // 替换编辑器全部内容
    editor.replaceBlocks(editor.document, template.blocks)
    setAppliedId(template.id)
    setConfirmTemplate(null)
    // 短暂显示成功态后重置
    setTimeout(() => setAppliedId(null), 2000)
  }

  const handleApplyClick = (template: Template) => {
    const hasContent = editor.document.some((block) => {
      const text = extractBlockText(block)
      return text.trim().length > 0
    })
    if (hasContent) {
      setConfirmTemplate(template)
    } else {
      applyTemplate(template)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 分类过滤 */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value as TemplateCategory | 'all')}
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                activeCategory === cat.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 模板列表 */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="flex flex-col gap-2">
          {filtered.map((template) => (
            <div key={template.id} className="relative">
              <TemplateCard
                template={template}
                onPreview={() => setPreviewTemplate(template)}
                onApply={() => handleApplyClick(template)}
              />
              {/* 套用成功状态 */}
              {appliedId === template.id && (
                <div className="absolute inset-0 rounded-lg bg-primary/10 border border-primary flex items-center justify-center gap-1.5 text-xs font-medium text-primary pointer-events-none">
                  <Check className="size-3.5" />
                  已套用
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <LayoutTemplate className="size-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">暂无该分类的模板</p>
          </div>
        )}
      </div>

      {/* 预览对话框 */}
      {previewTemplate && (
        <PreviewDialog
          template={previewTemplate}
          open={!!previewTemplate}
          onOpenChange={(v) => !v && setPreviewTemplate(null)}
          onApply={() => handleApplyClick(previewTemplate)}
        />
      )}

      {/* 确认覆盖对话框 */}
      <ConfirmDialog
        open={!!confirmTemplate}
        templateTitle={confirmTemplate?.title ?? ''}
        onConfirm={() => confirmTemplate && applyTemplate(confirmTemplate)}
        onCancel={() => setConfirmTemplate(null)}
      />
    </div>
  )
}
