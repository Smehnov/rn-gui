<script setup lang="ts">
const props = defineProps<{
  jobId: string
  robotPeerId: string
  show: boolean
}>()

const emit = defineEmits<{
  'close': []
}>()

import { useRobotStore } from '~/stores/robotStore'
import { Terminal } from 'xterm'
const robotStore = useRobotStore()
const jobInfo = ref<any>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const fetchJobInfo = async () => {
  if (!robotStore.agent) return
  
  try {
    isLoading.value = true
    error.value = null
    jobInfo.value = await robotStore.agent.getJobInfo(props.robotPeerId, props.jobId)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch job info'
    console.error('Error fetching job info:', err)
  } finally {
    isLoading.value = false
  }
}

watch(() => props.show, (newValue) => {
  if (newValue) {
    fetchJobInfo()
  }
})

const canOpenTerminal = (jobInfo: any) => {
  return jobInfo?.docker_status === 'running'
}

const showTerminal = ref(false)
const terminalRef = ref<InstanceType<typeof TerminalView> | null>(null)

const openTerminal = async () => {
  if (!robotStore.agent || !jobInfo.value) return
  
  try {
    const response = await robotStore.agent.startTerminalSession(props.robotPeerId, props.jobId)
    showTerminal.value = true
    
    // Wait for terminal component to mount
    await nextTick()
    
    // Connect WebSocket using the tunnel ID from the response
    if (response?.tunnel_id && terminalRef.value) {
      terminalRef.value.connectWebSocket(response.tunnel_id)
    }
  } catch (error) {
    console.error('Error opening terminal:', error)
  }
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div class="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Job Information</h3>
        <button @click="emit('close')" class="text-gray-400 hover:text-white">
          ×
        </button>
      </div>

      <div v-if="isLoading" class="text-center py-4">
        Loading job information...
      </div>

      <div v-else-if="error" class="text-red-400 text-center py-4">
        {{ error }}
      </div>

      <div v-else-if="jobInfo" class="space-y-4">
       

        <div>
          <h4 class="font-semibold mb-2">Job Type</h4>
          <p>{{ jobInfo.job_type }}</p>
        </div>

        <div v-if="jobInfo.container_id">
          <h4 class="font-semibold mb-2">Container ID</h4>
          <p class="font-mono text-sm">{{ jobInfo.container_id }}</p>
        </div>

        <div v-if="jobInfo.image">
          <h4 class="font-semibold mb-2">Image</h4>
          <p>{{ jobInfo.image }}</p>
        </div>

        <div v-if="jobInfo.docker_status">
          <h4 class="font-semibold mb-2">Docker Status</h4>
          <p>{{ jobInfo.docker_status }}</p>
        </div>
         <div v-if="canOpenTerminal(jobInfo)" class="flex justify-end">
          <button 
            @click="openTerminal"
            class="bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600"
          >
            Open Terminal
          </button>
        </div>

        <div v-if="jobInfo.last_logs">
          <h4 class="font-semibold mb-2">Last Logs</h4>
          <pre class="bg-black p-4 rounded overflow-x-auto whitespace-pre-wrap text-sm">{{ jobInfo.last_logs }}</pre>
        </div>
      </div>
    </div>
  </div>

  <!-- Terminal Modal -->
  <div v-if="showTerminal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-gray-800 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
      <div class="flex justify-between items-center p-4 border-b border-gray-700">
        <h3 class="text-lg font-semibold">Terminal - Job {{ jobId }}</h3>
        <button @click="showTerminal = false" class="text-gray-400 hover:text-white">
          ×
        </button>
      </div>
      <div class="flex-1 min-h-0">
        <client-only>
          <TerminalView
            ref="terminalRef"
            :job-id="jobId"
            :robot-peer-id="robotPeerId"
          />
        </client-only>
      </div>
    </div>
  </div>
</template> 