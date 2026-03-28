import { ref, onMounted, onUnmounted } from 'vue'

interface WebSocketMessage {
  type: string
  data?: unknown
  timestamp: number
}

type MessageHandler = (message: WebSocketMessage) => void

const ws = ref<WebSocket | null>(null)
const connected = ref(false)
const handlers = new Map<string, Set<MessageHandler>>()

function connect() {
  if (ws.value?.readyState === WebSocket.OPEN) return

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/ws`

  ws.value = new WebSocket(wsUrl)

  ws.value.onopen = () => {
    connected.value = true
    // Start keepalive
    startKeepalive()
  }

  ws.value.onclose = () => {
    connected.value = false
    // Reconnect after 3 seconds
    setTimeout(connect, 3000)
  }

  ws.value.onerror = () => {
    connected.value = false
  }

  ws.value.onmessage = (event) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      const typeHandlers = handlers.get(message.type)
      if (typeHandlers) {
        typeHandlers.forEach(handler => handler(message))
      }
      // Also call wildcard handlers
      const wildcardHandlers = handlers.get('*')
      if (wildcardHandlers) {
        wildcardHandlers.forEach(handler => handler(message))
      }
    } catch {
      // Ignore invalid messages
    }
  }
}

let keepaliveInterval: ReturnType<typeof setInterval> | null = null

function startKeepalive() {
  if (keepaliveInterval) clearInterval(keepaliveInterval)
  keepaliveInterval = setInterval(() => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'ping' }))
    }
  }, 30000)
}

function subscribe(type: string, handler: MessageHandler) {
  if (!handlers.has(type)) {
    handlers.set(type, new Set())
  }
  handlers.get(type)!.add(handler)
  return () => {
    handlers.get(type)?.delete(handler)
  }
}

export function useWebSocket() {
  onMounted(() => {
    if (!ws.value) {
      connect()
    }
  })

  onUnmounted(() => {
    // Don't disconnect on unmount - keep the connection alive
    // Components should use their own cleanup for subscriptions
  })

  return {
    connected,
    subscribe,
    send: (type: string, data?: unknown) => {
      if (ws.value?.readyState === WebSocket.OPEN) {
        ws.value.send(JSON.stringify({ type, data }))
      }
    }
  }
}

// Auto-reload helpers for specific resource types
export function useRealtimeReload(resourceType: string, reloadFn: () => void) {
  const { subscribe, connected } = useWebSocket()

  const unsubscribe = subscribe(`${resourceType}:changed`, reloadFn)
  const unsubscribeAdded = subscribe(`${resourceType}:added`, reloadFn)
  const unsubscribeRemoved = subscribe(`${resourceType}:removed`, reloadFn)

  onUnmounted(() => {
    unsubscribe()
    unsubscribeAdded()
    unsubscribeRemoved()
  })

  return { connected }
}