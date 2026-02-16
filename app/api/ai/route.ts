import OpenAI from 'openai'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    })
    const { prompt, mode } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const systemPrompts: Record<string, string> = {
      polish:
        '你是一位专业的中英文写作助手。请对用户提供的文本进行润色，使其更加流畅、专业、有表现力。保持原意不变，仅优化表达。如果文本中包含数学公式，请使用 LaTeX 格式（行内用 $...$，行间用 $$...$$）。直接输出润色后的文本，不要添加额外说明。',
      expand:
        '你是一位专业的写作助手。请对用户提供的文本进行扩展，补充更多细节、例子或论述，使内容更加丰富完整。如果涉及数学内容，请使用 LaTeX 格式。直接输出扩展后的文本。',
      summarize:
        '你是一位专业的写作助手。请对用户提供的文本进行总结，提取核心要点，生成简洁精炼的摘要。如果涉及数学内容，请使用 LaTeX 格式。直接输出摘要内容。',
      continue:
        '你是一位专业的写作助手。请根据用户提供的文本，自然地续写下去，保持风格和语气一致。如果涉及数学内容，请使用 LaTeX 格式。直接输出续写的内容。',
      translate:
        '你是一位专业的翻译助手。如果用户提供的文本是中文，请翻译为英文；如果是英文，请翻译为中文。保持原文的语气和风格。如果涉及数学内容，请使用 LaTeX 格式。直接输出翻译结果。',
    }

    const systemMessage = systemPrompts[mode] || systemPrompts.polish

    const stream = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    })

    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              const data = `data: ${JSON.stringify({ content })}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Stream error'
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
