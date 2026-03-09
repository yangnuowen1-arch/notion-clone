'use client'

/**
 * useAIRuntime —— AI 运行时控制 Hook
 *
 * ────────────────────────────────────────
 * 【如果下次要从头写这类 Hook，先问自己这 5 个问题】
 *
 * Q1. 谁是"源头"？
 *     → AI 请求由 BlockNote AIExtension 发起，走 DefaultChatTransport。
 *       Transport 支持传入自定义 fetch，所以我们的切入点就是"替换 fetch"。
 *       不需要改 BlockNote 内部，也不需要改后端协议。
 *
 * Q2. 怎么让用户能手动停止？
 *     → 用 AbortController。
 *       每次发请求时创建一个新的 controller，把 controller.signal 传给 fetch。
 *       用户点 Stop 时调用 controller.abort()，fetch 会立刻中断。
 *       注意：abort 不能当成"错误"对待，要区分"正常停止"和"真实失败"。
 *
 * Q3. 为什么要 token buffer + 节流？
 *     → LLM 流式返回时，token 可能每秒来几十次。
 *       如果每个 token 都触发 setState / UI 更新，React 会频繁重渲染，导致卡顿。
 *       解决方案：把 token 先缓存到 ref（bufferRef），每 100ms 才统一推给下游一次。
 *       下游（BlockNote）收到的仍然是标准 ReadableStream，不知道被我们处理过。
 *
 * Q4. 怎么管理多个状态（等待中/生成中/停止中/错误）？
 *     → 用 XState 状态机。
 *       好处：状态切换有约束，不会出现"streaming 时触发 START"这类逻辑漏洞。
 *       状态只有 5 个：idle → generating → streaming → stopping → error
 *
 * Q5. 怎么防止内存泄漏？
 *     → 三类资源要记得清理：
 *       a) setInterval（节流 timer）
 *       b) AbortController（网络请求）
 *       c) 外部 signal 的事件监听器
 *       组件卸载时（useEffect return），或流结束时（finally），都要清理。
 * ────────────────────────────────────────
 */

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useMachine } from '@xstate/react'

import { aiRuntimeMachine } from '@/lib/ai-runtime-machine'

// 节流间隔：每 100ms 把 buffer 中积累的 token 推给下游一次
// 调大：UI 更新更少，卡顿更少，但延迟感更强
// 调小：UI 更新更频繁，实时感更强，但容易卡顿
const FLUSH_INTERVAL_MS = 100

// 每次 AI 调用生成一个唯一 ID，方便后续调试和多实例区分
function createRunId() {
  return Math.random().toString(36).slice(2)
}

export function useAIRuntime() {
  // ── 第一步：状态机 ────────────────────────────────────────────────
  // 用 XState 统一管理 AI 的生命周期状态。
  // send(event) 用来触发状态切换，state.matches('xxx') 用来判断当前状态。
  // 下次写这类 Hook 时，先把状态图画出来，再写代码。
  const [state, send] = useMachine(aiRuntimeMachine)

  // ── 第二步：临时资源 Ref ──────────────────────────────────────────
  // 用 useRef 而不是 useState，原因是：
  // - 这些变量的变化不需要触发重渲染
  // - 需要在异步回调里访问最新值（闭包问题）

  // 节流 timer 的引用，结束时必须 clearInterval，否则会一直在后台运行
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // token 缓冲区：高频到来的 token 先写这里，而不是立刻 enqueue 给下游
  const bufferRef = useRef('')

  // 当前请求的 AbortController，Stop 按钮和组件卸载时都需要它
  const activeControllerRef = useRef<AbortController | null>(null)

  // ── 第三步：清理函数 ─────────────────────────────────────────────
  // 把"清理节流 timer + 清空 buffer"封装成一个函数，
  // 方便在多个地方复用：流结束时、停止时、卸载时。
  const cleanupRefs = useCallback(() => {
    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current)
      flushTimerRef.current = null
    }
    bufferRef.current = ''
  }, [])

  // ── 第四步：对外暴露的 stop 方法 ─────────────────────────────────
  // UI 层（Stop 按钮）调用这个。
  // 写这类方法时要注意：
  // a) 只有在"可中断状态"下才 abort，防止重复触发
  // b) 先通知状态机（send STOP），再执行副作用（abort）
  //    顺序很重要：让状态机先知道"我要停了"，UI 能立刻响应
  const stop = useCallback(() => {
    if (state.matches('generating') || state.matches('streaming')) {
      send({ type: 'STOP' })
      activeControllerRef.current?.abort()
    }
  }, [send, state])

  // ── 第五步：兜底 abort ───────────────────────────────────────────
  // 当状态机进入 stopping，但 abort 还没被调到时（例如其他路径触发），
  // 这里兜底再 abort 一次，确保网络请求一定被中断。
  // 下次写时记住：副作用要放在 useEffect 里，不要放在状态机 action 里。
  useEffect(() => {
    if (state.matches('stopping')) {
      state.context.controller?.abort()
    }
  }, [state])

  // ── 第六步：组件卸载清理 ─────────────────────────────────────────
  // useEffect 的返回函数会在组件卸载时执行。
  // 这是防止"组件已经消失，但 AI 还在跑"的标准做法。
  // 下次写时记住：凡是有 setInterval / addEventListener / fetch 的地方，
  // 都要考虑"组件消失了怎么办"。
  useEffect(() => {
    return () => {
      activeControllerRef.current?.abort()
      cleanupRefs()
    }
  }, [cleanupRefs])

  // ── 第七步：核心 —— controlledFetch ──────────────────────────────
  // 这是整个 Hook 的灵魂。
  //
  // 【设计思路】
  // DefaultChatTransport 支持注入自定义 fetch，
  // 所以我们用 controlledFetch 替换原生 fetch，在中间做三件事：
  // 1. 给每次请求挂 AbortController（支持中断）
  // 2. 把原始 SSE stream 做节流（避免频繁渲染）
  // 3. 把结果同步回状态机（让 UI 知道当前处于哪个阶段）
  //
  // 【为什么用 useMemo 而不是 useCallback？】
  // 因为它的返回值是一个 async 函数，useMemo 让引用稳定，
  // 避免 AIExtension 里每次渲染都拿到新的 transport 实例。
  const controlledFetch = useMemo(() => {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
      // ── 7-1. 创建这次 AI 调用的"运行实例" ──────────────────────
      // 每次请求都是独立的：新的 controller、新的 runId、新的状态。
      // 这样多次调用不会互相干扰。
      const controller = new AbortController()
      const runId = createRunId()
      activeControllerRef.current = controller
      send({ type: 'START', controller, runId })

      // ── 7-2. 处理"外部信号桥接" ─────────────────────────────────
      // BlockNote transport 自己可能也有 AbortSignal（例如路由切换时取消请求）。
      // 我们把它桥接到自己的 controller，保证两条中断链路都能生效。
      // 下次写时记住：如果你替换了别人的 signal，一定要把外部 signal 也处理掉。
      const externalSignal = init?.signal
      const handleExternalAbort = () => controller.abort()
      externalSignal?.addEventListener('abort', handleExternalAbort, {
        once: true, // once: true 避免重复监听，自动解绑
      })

      try {
        // ── 7-3. 真正发起请求 ────────────────────────────────────
        // 关键：把 signal 换成我们自己的 controller.signal，
        // 这样 abort() 才能真正中断这次 fetch。
        const response = await fetch(input, {
          ...init,
          signal: controller.signal,
        })

        // ── 7-4. 处理"没有 body"的响应 ──────────────────────────
        // 比如 422、401 错误，响应可能没有流式 body，
        // 这时直接根据 response.ok 决定 DONE 还是 FAIL。
        if (!response.body) {
          if (!response.ok) {
            send({ type: 'FAIL', error: `HTTP ${response.status}` })
          } else {
            send({ type: 'DONE' })
          }
          return response
        }

        // ── 7-5. 准备流式读取工具 ───────────────────────────────
        // reader：从原始 response.body 逐块读取
        // decoder：把 Uint8Array 转成字符串
        // encoder：把字符串再转回 Uint8Array（写给下游用）
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()

        let streamClosed = false  // 防止 timer 在流结束后继续 enqueue
        let firstChunkSeen = false // 用于触发 FIRST_CHUNK 事件，只触发一次

        // ── 7-6. 构造节流后的 ReadableStream ────────────────────
        // 【核心思路】
        // 原始 response.body → 高频 token 写入 bufferRef → timer 每 100ms flush → throttledBody
        //
        // 下次写"节流 ReadableStream"时的模板：
        // 1. start()：启动 setInterval，定期把 buffer 里的数据 enqueue 给下游
        // 2. start() 里同时启动异步读循环，把上游数据写入 buffer
        // 3. pull()：不用实现，ReadableStream 会自动调 start 里的 async 循环
        // 4. cancel()：下游主动取消时，同步中断上游 reader
        const throttledBody = new ReadableStream<Uint8Array>({
          start(streamController) {
            // 启动定时 flush：每 100ms 检查 buffer，有数据就推给下游
            flushTimerRef.current = setInterval(() => {
              if (!bufferRef.current || streamClosed) return
              streamController.enqueue(encoder.encode(bufferRef.current))
              bufferRef.current = ''
            }, FLUSH_INTERVAL_MS)

            // 在 start() 里启动异步读循环（不能用 pull()，因为我们自己控制节奏）
            // void (...) 是为了告诉 TS：这个 Promise 我不需要 await，
            // 但错误会在内部 catch 里处理。
            void (async () => {
              try {
                // 持续从上游读数据，直到流结束
                while (true) {
                  const { done, value } = await reader.read()
                  if (done) break

                  // 第一个 chunk 到来时，通知状态机：进入 streaming 阶段
                  if (!firstChunkSeen) {
                    firstChunkSeen = true
                    send({ type: 'FIRST_CHUNK' })
                  }

                  // 不立刻推下游！先写入 buffer，等 timer 来 flush
                  // 这就是节流的核心：高频写入，低频输出
                  bufferRef.current += decoder.decode(value, { stream: true })
                }

                // 流读完后，decoder 可能还有残留字节没输出，这里强制 flush 一次
                bufferRef.current += decoder.decode()

                // 最后一次 flush，把剩余 buffer 全部推给下游，不等 timer
                if (bufferRef.current) {
                  streamController.enqueue(encoder.encode(bufferRef.current))
                  bufferRef.current = ''
                }

                streamClosed = true
                cleanupRefs() // 流结束，清掉 timer 和 buffer

                // 根据"是否被 abort"和"响应是否 ok"决定状态机的最终状态
                // 注意：abort 是"主动停止"，不算"错误"
                if (response.ok) {
                  send(controller.signal.aborted ? { type: 'STOPPED' } : { type: 'DONE' })
                } else {
                  send({ type: 'FAIL', error: `HTTP ${response.status}` })
                }

                streamController.close()
              } catch (error) {
                // ── 流读取中途出错 ──────────────────────────────
                // 最常见的两种情况：
                // a) 用户主动 abort → controller.signal.aborted 为 true → 走 STOPPED
                // b) 网络错误或后端异常 → 走 FAIL
                streamClosed = true
                cleanupRefs()

                if (controller.signal.aborted) {
                  try { streamController.close() } catch { /* 已关闭时 close 会报错，忽略 */ }
                  send({ type: 'STOPPED' })
                  return
                }

                const message = error instanceof Error ? error.message : 'Unknown stream error'
                send({ type: 'FAIL', error: message })
                streamController.error(error)
              } finally {
                // finally 无论成功/失败/abort 都会执行，做最终的资源解绑
                activeControllerRef.current = null
                externalSignal?.removeEventListener('abort', handleExternalAbort)
              }
            })()
          },

          // 下游（BlockNote）主动取消时会调用 cancel()
          // 例如：用户切换页面、组件销毁、transport 主动取消
          cancel() {
            controller.abort()
            void reader.cancel().catch(() => undefined) // reader 也要主动取消
            cleanupRefs()
            activeControllerRef.current = null
            send({ type: 'STOPPED' })
          },
        })

        // ── 7-7. 返回节流版 Response ─────────────────────────────
        // 保留原始的 status / headers，只把 body 换成我们节流后的版本。
        // 对 BlockNote 来说，这就是一个普通的 fetch Response，它不知道被处理过。
        return new Response(throttledBody, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        })
      } catch (error) {
        // ── 7-8. 请求发起阶段就失败了（连 response 都没拿到）──────
        // 例如：网络断开、DNS 解析失败、abort 发生在 fetch() 阶段
        cleanupRefs()
        activeControllerRef.current = null
        externalSignal?.removeEventListener('abort', handleExternalAbort)

        if (controller.signal.aborted) {
          // abort 在 fetch 阶段就触发了，同样走 STOPPED，不走 FAIL
          send({ type: 'STOPPED' })
          throw error // 仍然 throw，让 transport 知道请求中断了
        }

        const message = error instanceof Error ? error.message : 'Unknown fetch error'
        send({ type: 'FAIL', error: message })
        throw error
      }
    }
  }, [cleanupRefs, send])

  // ── 第八步：暴露最小接口 ─────────────────────────────────────────
  // 只暴露 Editor 真正需要的东西，不暴露内部实现细节。
  // 下次设计 Hook 接口时，优先考虑："调用方只需要知道什么？"
  return {
    state,                  // 完整状态，调试时用
    stop,                   // Stop 按钮绑这个
    reset: () => send({ type: 'RESET' }), // 错误后的"关闭"按钮绑这个
    controlledFetch,        // 注入到 DefaultChatTransport 的 fetch 字段
    isGenerating: state.matches('generating') || state.matches('streaming'), // 显示 loading
    isStopping: state.matches('stopping'),  // 显示"停止中..."
    error: state.context.error,             // 显示错误信息
  }
}
