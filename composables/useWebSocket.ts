import { ref, onMounted, onUnmounted } from 'vue'
import { Robot, RobotCommand } from '~/types/robot'

interface WebSocketMessage {
  type: string
  payload: any
}

export enum WebSocketStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

export function useWebSocket(url: string) {
  const socket = ref<WebSocket | null>(null)
  const status = ref<WebSocketStatus>(WebSocketStatus.DISCONNECTED)
  const lastMessage = ref<WebSocketMessage | null>(null)
  const error = ref<string | null>(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const reconnectInterval = ref<NodeJS.Timeout | null>(null)

  // Connection management
  const connect = () => {
    try {
      status.value = WebSocketStatus.CONNECTING
      socket.value = new WebSocket(url)
      setupEventListeners()
    } catch (err) {
      handleError('Connection failed', err)
    }
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }
    status.value = WebSocketStatus.DISCONNECTED
    stopReconnectAttempts()
  }

  const reconnect = () => {
    if (reconnectAttempts.value >= maxReconnectAttempts) {
      handleError('Max reconnection attempts reached', null)
      return
    }

    if (!reconnectInterval.value) {
      reconnectInterval.value = setInterval(() => {
        if (status.value !== WebSocketStatus.CONNECTED) {
          reconnectAttempts.value++
          connect()
        }
      }, 5000) // Try to reconnect every 5 seconds
    }
  }

  const stopReconnectAttempts = () => {
    if (reconnectInterval.value) {
      clearInterval(reconnectInterval.value)
      reconnectInterval.value = null
    }
    reconnectAttempts.value = 0
  }

  // Event listeners
  const setupEventListeners = () => {
    if (!socket.value) return

    socket.value.onopen = () => {
      status.value = WebSocketStatus.CONNECTED
      error.value = null
      stopReconnectAttempts()
      console.log('WebSocket connected successfully')
    }

    socket.value.onclose = (event) => {
      status.value = WebSocketStatus.DISCONNECTED
      console.log('WebSocket connection closed:', event.code, event.reason)
      reconnect()
    }

    socket.value.onerror = (event) => {
      handleError('WebSocket error occurred', event)
    }

    socket.value.onmessage = (event) => {
      try {
        const parsedMessage = JSON.parse(event.data) as WebSocketMessage
        lastMessage.value = parsedMessage
        handleIncomingMessage(parsedMessage)
      } catch (err) {
        handleError('Failed to parse message', err)
      }
    }
  }

  // Message handling
  const handleIncomingMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'ROBOT_UPDATE':
        handleRobotUpdate(message.payload)
        break
      case 'ROBOT_STATUS':
        handleRobotStatus(message.payload)
        break
      case 'ERROR':
        handleServerError(message.payload)
        break
      default:
        console.warn('Unhandled message type:', message.type)
    }
  }

  const handleRobotUpdate = (payload: Robot) => {
    // Handle robot update - you might want to emit an event or update the store
    console.log('Robot updated:', payload)
  }

  const handleRobotStatus = (payload: any) => {
    // Handle robot status updates
    console.log('Robot status:', payload)
  }

  const handleServerError = (payload: any) => {
    handleError('Server error', payload)
  }

  // Error handling
  const handleError = (message: string, error: any) => {
    const errorMessage = `${message}: ${error?.message || error || 'Unknown error'}`
    console.error(errorMessage)
    error.value = errorMessage
    status.value = WebSocketStatus.ERROR
  }

  // Sending messages
  const sendMessage = (message: WebSocketMessage) => {
    if (!socket.value || status.value !== WebSocketStatus.CONNECTED) {
      handleError('Cannot send message', 'WebSocket is not connected')
      return false
    }

    try {
      socket.value.send(JSON.stringify(message))
      return true
    } catch (err) {
      handleError('Failed to send message', err)
      return false
    }
  }

  const sendCommand = (command: RobotCommand) => {
    return sendMessage({
      type: 'ROBOT_COMMAND',
      payload: command
    })
  }

  // Lifecycle hooks
  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  // Public API
  return {
    status,
    error,
    lastMessage,
    isConnected: () => status.value === WebSocketStatus.CONNECTED,
    sendMessage,
    sendCommand,
    connect,
    disconnect,
  }
}

// Example usage:
/*
const { 
  status, 
  error, 
  isConnected, 
  sendCommand 
} = useWebSocket('wss://your-websocket-server.com')

// Send a command
sendCommand({
  robotId: '123',
  action: RobotAction.MOVE,
  parameters: { x: 10, y: 20 }
})

// Check connection status
watch(status, (newStatus) => {
  if (newStatus === WebSocketStatus.ERROR) {
    console.error('WebSocket error:', error.value)
  }
})
*/
