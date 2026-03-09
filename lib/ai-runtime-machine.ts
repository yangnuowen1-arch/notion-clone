import { assign, setup } from 'xstate'

export interface AIRuntimeContext {
  controller: AbortController | null
  error: string | null
  runId: string | null
}

export type AIRuntimeEvent =
  | { type: 'START'; controller: AbortController; runId: string }
  | { type: 'FIRST_CHUNK' }
  | { type: 'STOP' }
  | { type: 'STOPPED' }
  | { type: 'DONE' }
  | { type: 'FAIL'; error: string }
  | { type: 'RESET' }

export const aiRuntimeMachine = setup({
  types: {
    context: {} as AIRuntimeContext,
    events: {} as AIRuntimeEvent,
  },
  actions: {
    clearRun: assign({
      controller: () => null,
      runId: () => null,
    }),
    setError: assign({
      error: ({ event }) => (event.type === 'FAIL' ? event.error : null),
    }),
  },
}).createMachine({
  id: 'aiRuntime',
  initial: 'idle',
  context: {
    controller: null,
    error: null,
    runId: null,
  },
  states: {
    idle: {
      on: {
        START: {
          target: 'generating',
          actions: assign({
            controller: ({ event }) => event.controller,
            runId: ({ event }) => event.runId,
            error: () => null,
          }),
        },
      },
    },
    generating: {
      on: {
        FIRST_CHUNK: 'streaming',
        STOP: 'stopping',
        DONE: {
          target: 'idle',
          actions: ['clearRun'],
        },
        FAIL: {
          target: 'error',
          actions: ['setError'],
        },
      },
    },
    streaming: {
      on: {
        STOP: 'stopping',
        DONE: {
          target: 'idle',
          actions: ['clearRun'],
        },
        FAIL: {
          target: 'error',
          actions: ['setError'],
        },
      },
    },
    stopping: {
      on: {
        STOPPED: {
          target: 'idle',
          actions: ['clearRun'],
        },
        FAIL: {
          target: 'error',
          actions: ['setError'],
        },
      },
    },
    error: {
      on: {
        RESET: {
          target: 'idle',
          actions: assign({
            controller: () => null,
            runId: () => null,
            error: () => null,
          }),
        },
        START: {
          target: 'generating',
          actions: assign({
            controller: ({ event }) => event.controller,
            runId: ({ event }) => event.runId,
            error: () => null,
          }),
        },
      },
    },
  },
})
