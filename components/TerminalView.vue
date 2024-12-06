<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { useRobotStore } from '~/stores/robotStore'
import 'xterm/css/xterm.css'

const props = defineProps<{
  jobId: string
  robotPeerId: string
}>()

const robotStore = useRobotStore()
const terminal = ref<Terminal | null>(null)
const fitAddon = ref<FitAddon | null>(null)

onMounted(async () => {
  if (!process.client) return;

  terminal.value = new Terminal({
    cursorBlink: true,
    theme: {
      background: '#1a1a1a'
    }
  })
  
  fitAddon.value = new FitAddon()
  terminal.value.loadAddon(fitAddon.value)
  
  const terminalElement = document.getElementById('terminal')
  if (terminalElement && terminal.value) {
    terminal.value.open(terminalElement)
    fitAddon.value.fit()

    // Subscribe to terminal input
    terminal.value.onData((data) => {
      robotStore.agent?.sendTerminalCommand(data)
    })

    // Subscribe to terminal output from robot
    robotStore.agent?.subscribe((message) => {
      const content = message.content || {}
      if (message.from === props.robotPeerId && 
          content.type === 'TunnelResponseMessage' && 
          'message' in content) {
        const terminalMessage = content.message?.TerminalMessage
        if (terminalMessage && terminalMessage !== '\x1b[6n') {
          terminal.value?.write(terminalMessage)
        }
      }
    })
  }

  // Handle window resize
  const handleResize = () => {
    fitAddon.value?.fit()
  }
  window.addEventListener('resize', handleResize)

  // Cleanup
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    terminal.value?.dispose()
  })
})

// Initialize terminal session
const initTerminal = async () => {
  try {
    await robotStore.agent?.startTerminalSession(props.robotPeerId, props.jobId)
  } catch (error) {
    console.error('Error initializing terminal:', error)
  }
}

// Start terminal session when component is mounted
onMounted(() => {
  initTerminal()
})
</script>

<template>
  <div class="h-full bg-[#1a1a1a]">
    <div id="terminal" class="h-full"></div>
  </div>
</template>

<style>
.xterm {
  height: 100%;
  padding: 1rem;
}
</style> 