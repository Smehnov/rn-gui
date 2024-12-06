import { ref, onMounted, onUnmounted } from 'vue'
import { ed, getPeerId, generateKeyPair, bytesToBase64Url, base64UrlToBytes } from '~/utils/crypto'

interface Config {
  robots: Robot[]
  users: User[]
  version: number
}

interface Robot {
  name: string
  robot_peer_id: string
  status?: 'Online' | 'Unknown'
}

interface User {
  username: string
  public_key: string
}

interface Message {
  timestamp: string
  content: any
  from: string
  to: string | null
}

export class Agent {
  private ws: WebSocket | null = null
  private subscribers: ((message: any) => void)[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval: number | null = null
  public isConnected = false
  private robotPeerId: string | null = null
  private jobId: string | null = null

  constructor(
    private rpcUrl: string,
    private privateKey: Uint8Array,
    private publicKey: Uint8Array,
    private peerId: string,
    private ownerKey: string
  ) {}

  async connect() {
    try {
      this.ws = new WebSocket(this.rpcUrl)
      
      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.isConnected = true
        this.reconnectAttempts = 0
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval)
          this.reconnectInterval = null
        }
      }

      this.ws.onmessage = (event) => {
        console.log('onmessage', event)
        console.log('event.data', event.data);
        
        try {
          const messages = `[${event.data.replace(/}{/g, '},{')}]`
          const parsedMessages = JSON.parse(messages)
          
          for (const msg of parsedMessages) {
            const finalMessage = msg.message ? JSON.parse(msg.message) : msg
            this.notifySubscribers(finalMessage)
          }
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.isConnected = false
        this.reconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Connection error:', error)
      this.reconnect()
    }
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    if (!this.reconnectInterval) {
      this.reconnectInterval = window.setInterval(() => {
        this.reconnectAttempts++
        this.connect()
      }, 5000)
    }
  }

  async sendRequest(action: string, content = {}, to = '', signedMessage = {}, actionParam: string | null = null) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }
    console.log('sendRequest', action, content, to, signedMessage, actionParam)

    const message = {
      action,
      ...(Object.keys(content).length > 0 && {
        content: {
          content,
          to
        }
      }),
      ...(Object.keys(signedMessage).length > 0 && { signed_message: signedMessage }),
      ...(actionParam && { action_param: actionParam })
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'))
      }, 10000)

      const messageHandler = (event: MessageEvent) => {
        clearTimeout(timeoutId)
        this.ws?.removeEventListener('message', messageHandler)
        resolve(JSON.parse(event.data))
      }

      this.ws?.addEventListener('message', messageHandler)
      this.ws?.send(JSON.stringify(message))
    })
  }

  async sendSignedMessage(message: any) {
    console.log('sendSignedMessage', message);
    
    const messageStr = JSON.stringify(message)
    const messageBytes = new TextEncoder().encode(messageStr)
    const signature = await ed.sign(messageBytes, this.privateKey)

    await this.sendRequest('/send_signed_message', undefined, undefined, {
      sign: Array.from(signature),
      public_key: Array.from(this.publicKey),
      message: messageStr
    })
  }

  subscribe(callback: (message: any) => void) {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback)
    }
  }

  private notifySubscribers(message: any) {
    this.subscribers.forEach(callback => {
      try {
        callback(message)
      } catch (error) {
        console.error('Error in subscriber callback:', error)
      }
    })
  }

  async startReceiving() {
    await this.sendRequest('/subscribe_messages', {}, '', {}, this.peerId)
  }

  async getConfig(): Promise<Config> {
    console.log('getConfig')
    try {
      const data = await this.sendRequest('/config', {}, '', {}, this.ownerKey)
      if (data.ok === false) {
        return { robots: [], users: [], version: 0 }
      }
      return data
    } catch (error) {
      console.error('Error getting config:', error)
      return { robots: [], users: [], version: 0 }
    }
  }

  async getNetworkInfo() {
    try {
      const data = await this.sendRequest('/network_info', {}, '', {}, this.ownerKey)
      console.log('Network info response:', data)
      if (!data || data.ok === false) {
        console.warn('Invalid network info response:', data)
        return {}
      }
      return data
    } catch (error) {
      console.error('Error getting network info:', error)
      return {}
    }
  }

  async getRobots() {
    console.log('getRobots')
    const data = await this.getConfig()
    const networkInfo = await this.getNetworkInfo()
    
    return data.robots.map(robot => ({
      ...robot,
      status: networkInfo[robot.robot_peer_id]?.is_online ? 'Online' : 'Unknown'
    }))
  }

  async startJob(robotPeerId: string, jobId: string, jobType: string, jobArgs: any) {
    const message = await this.prepareMessage({
      type: 'StartJob',
      id: jobId,
      robot_id: robotPeerId,
      job_type: jobType,
      status: 'pending',
      args: JSON.stringify(jobArgs)
    }, robotPeerId)

    await this.sendSignedMessage(message)
  }

  private async prepareMessage(content: any, to: string | null = null): Promise<Message> {
    return {
      timestamp: Math.floor(Date.now() / 1000).toString(),
      content,
      from: this.peerId,
      to
    }
  }

  disconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
      this.reconnectInterval = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  async getJobs(robotPeerId: string) {
    try {
      return new Promise((resolve, reject) => {
        let messageHandler: ((message: any) => void) | null = null;
        
        // Create message handler
        messageHandler = (message: any) => {
          const content = message.content;
          console.log('messageHandler', message);
          
          if (message.from === robotPeerId && content?.response_type === 'ListJobs') {
            // Remove the handler once we get our response
            if (messageHandler) {
              this.subscribers = this.subscribers.filter(cb => cb !== messageHandler);
            }
            resolve(content.jobs || []);
          }
        };

        // Subscribe to messages
        this.subscribe(messageHandler);
        this.startReceiving() 
        // Send the message request
        this.sendSignedMessage({
          timestamp: Math.floor(Date.now() / 1000).toString(),
          content: {
            type: 'MessageRequest',
            request_type: 'ListJobs'
          },
          from: this.peerId,
          to: robotPeerId
        }).catch(reject);

        // Set a timeout of 10 seconds
        const timeout = setTimeout(() => {
          if (messageHandler) {
            this.subscribers = this.subscribers.filter(cb => cb !== messageHandler);
          }
          reject(new Error('Timeout waiting for job list response'));
        }, 10000);


      });


    } catch (error) {
      console.error('Error getting jobs:', error);
      return [];
    }
  }

  async startTerminalSession(robotPeerId: string, jobId: string) {
    if (process.client) {
      await this.startReceiving();
      
      // Store job and robot info for terminal commands
      this.robotPeerId = robotPeerId;
      this.jobId = jobId;

      // Send tunnel request
      const message = await this.prepareMessage({
        type: 'StartTunnelReq',
        job_id: jobId,
        peer_id: this.peerId
      }, robotPeerId);
      
      await this.sendSignedMessage(message);

      // Send initial newline to start the terminal
      await this.sendTerminalCommand('\n\r');
      
      return { success: true };
    } else {
      throw new Error('Terminal sessions can only be started on the client side');
    }
  }

  // Add new method for sending terminal commands
  async sendTerminalCommand(command: string) {
    if (!this.robotPeerId || !this.jobId) {
      throw new Error('Terminal session not initialized');
    }

    const message = await this.prepareMessage({
      type: 'JobMessage',
      job_id: this.jobId,
      content: {
        type: 'Terminal',
        stdin: command
      }
    }, this.robotPeerId);

    await this.sendSignedMessage(message);
  }

  unsubscribe(callback: (message: any) => void) {
    this.subscribers = this.subscribers.filter(cb => cb !== callback)
  }

  async getJobInfo(robotPeerId: string, jobId: string) {
    try {
      return new Promise((resolve, reject) => {
        const messageHandler = (message: any) => {
          console.log('messageHandler', message);
          const content = message.content;
          if (content.type === 'MessageResponse' && 
              content.response_type === 'JobInfo') {
            // Remove the handler once we get our response
            this.unsubscribe(messageHandler);
            console.log('content.job_info', content.job_info);
            resolve(content.job_info);
          }
        };

        // Subscribe to messages
        this.subscribe(messageHandler);
        this.startReceiving()
        
        // Send job info request
        this.sendSignedMessage({
          timestamp: Math.floor(Date.now() / 1000).toString(),
          content: {
            type: 'MessageRequest',
            request_type: 'JobInfo',
            job_id: jobId
          },
          from: this.peerId,
          to: robotPeerId
        }).catch(reject);

        // Set a timeout of 10 seconds
        setTimeout(() => {
          this.unsubscribe(messageHandler);
          reject(new Error('Timeout waiting for job info'));
        }, 10000);
      });
    } catch (error) {
      console.error('Error getting job info:', error);
      throw error;
    }
  }
}

// New function to create agent instance
export async function createAgent(rpcUrl: string, ownerKey: string, secretKeyBase64: string) {
  try {
    const fullKey = base64ToBytes(secretKeyBase64)
    const privateKey = fullKey.slice(0, 32)
    const publicKey = await ed.getPublicKey(privateKey)
    const peerId = await getPeerId(publicKey)
    
    const agent = new Agent(rpcUrl, privateKey, publicKey, peerId, ownerKey)
    await agent.connect()
    return { agent, error: null }
  } catch (err) {
    return { 
      agent: null, 
      error: err instanceof Error ? err.message : 'Unknown error occurred' 
    }
  }
}

// Keep the composable for use in components
export function useAgent(rpcUrl: string, ownerKey: string, secretKeyBase64: string) {
  const agent = ref<Agent | null>(null)
  const error = ref<string | null>(null)
  const isConnected = ref(false)

  const initializeAgent = async () => {
    try {
      const privateKey = base64ToBytes(secretKeyBase64)
      const publicKey = await ed.getPublicKey(privateKey)
      const peerId = await getPeerId(publicKey)

      agent.value = new Agent(rpcUrl, privateKey, publicKey, peerId, ownerKey)
      await agent.value.connect()
      isConnected.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      isConnected.value = false
    }
  }

  onMounted(() => {
    initializeAgent()
  })

  onUnmounted(() => {
    agent.value?.disconnect()
  })

  return {
    agent,
    error,
    isConnected
  }
}