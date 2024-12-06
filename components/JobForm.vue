<script setup lang="ts">
const props = defineProps<{
  peerId: string
}>()

const emit = defineEmits<{
  'job-added': []
}>()

import { useRobotStore } from '~/stores/robotStore'
const robotStore = useRobotStore()
const isLoading = ref(false)

// Template options based on job examples
const jobTemplates = {
  'terminal.job': {
    image: 'alpine:3',
    custom_cmd: 'sh',
    container_name: '',
    ports: [],
    network_mode: 'default',
    volumes: [],
    privileged: false,
    env: []
  },
  'hello.job': {
    image: 'hello-world:linux',
    container_name: '',
    ports: [],
    network_mode: 'default',
    volumes: [],
    privileged: false,
    env: []
  }
}

const selectedTemplate = ref('terminal.job')
const newJob = ref({
  type: 'docker-container-launch',
  id: '',
  robot_id: props.peerId,
  job_type: 'docker-container-launch',
  status: 'pending',
  args: { ...jobTemplates['terminal.job'] }
})

// Helper functions for array fields
const addPort = () => {
  newJob.value.args.ports.push('')
}

const removePort = (index: number) => {
  newJob.value.args.ports.splice(index, 1)
}

const addVolume = () => {
  newJob.value.args.volumes.push('')
}

const removeVolume = (index: number) => {
  newJob.value.args.volumes.splice(index, 1)
}

const addEnvVar = () => {
  newJob.value.args.env.push('')
}

const removeEnvVar = (index: number) => {
  newJob.value.args.env.splice(index, 1)
}

// Load template
const loadTemplate = () => {
  newJob.value.args = { ...jobTemplates[selectedTemplate.value] }
}

const addJob = async () => {
  isLoading.value = true
  try {
    const jobId = `job_${Date.now()}`
    await robotStore.agent?.startJob(
      props.peerId,
      jobId,
      newJob.value.job_type,
      newJob.value.args
    )
    // Reset form to default template
    loadTemplate()
    emit('job-added')
  } catch (error) {
    console.error('Error adding job:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="bg-gray-800 p-4 rounded-lg">
    <div class="mb-4">
      <label class="block mb-2">Job Template</label>
      <select 
        v-model="selectedTemplate"
        @change="loadTemplate"
        class="w-full bg-gray-700 p-2 rounded"
      >
        <option value="terminal.job">Terminal Job</option>
        <option value="hello.job">Hello World Job</option>
      </select>
    </div>

    <div class="mb-4">
      <label class="block mb-2">Docker Image</label>
      <input 
        v-model="newJob.args.image"
        type="text"
        class="w-full bg-gray-700 p-2 rounded"
        placeholder="e.g., alpine:3"
      >
    </div>

    <div v-if="selectedTemplate === 'terminal.job'" class="mb-4">
      <label class="block mb-2">Custom Command</label>
      <input 
        v-model="newJob.args.custom_cmd"
        type="text"
        class="w-full bg-gray-700 p-2 rounded"
        placeholder="e.g., sh"
      >
    </div>

    <div class="mb-4">
      <label class="block mb-2">Container Name (optional)</label>
      <input 
        v-model="newJob.args.container_name"
        type="text"
        class="w-full bg-gray-700 p-2 rounded"
        placeholder="e.g., my-container"
      >
    </div>

    <div class="mb-4">
      <label class="block mb-2">Network Mode</label>
      <input 
        v-model="newJob.args.network_mode"
        type="text"
        class="w-full bg-gray-700 p-2 rounded"
        placeholder="default"
      >
    </div>

    <div class="mb-4">
      <label class="block mb-2 flex justify-between">
        <span>Ports</span>
        <button 
          @click="addPort"
          class="text-sm bg-gray-700 px-2 py-1 rounded"
        >
          + Add Port
        </button>
      </label>
      <div v-for="(port, index) in newJob.args.ports" :key="index" class="flex gap-2 mb-2">
        <input 
          v-model="newJob.args.ports[index]"
          type="text"
          class="flex-1 bg-gray-700 p-2 rounded"
          placeholder="e.g., 8080:80"
        >
        <button 
          @click="() => removePort(index)"
          class="bg-red-500 px-2 rounded"
        >
          ×
        </button>
      </div>
    </div>

    <div class="mb-4">
      <label class="block mb-2 flex justify-between">
        <span>Volumes</span>
        <button 
          @click="addVolume"
          class="text-sm bg-gray-700 px-2 py-1 rounded"
        >
          + Add Volume
        </button>
      </label>
      <div v-for="(volume, index) in newJob.args.volumes" :key="index" class="flex gap-2 mb-2">
        <input 
          v-model="newJob.args.volumes[index]"
          type="text"
          class="flex-1 bg-gray-700 p-2 rounded"
          placeholder="e.g., /host/path:/container/path"
        >
        <button 
          @click="() => removeVolume(index)"
          class="bg-red-500 px-2 rounded"
        >
          ×
        </button>
      </div>
    </div>

    <div class="mb-4">
      <label class="block mb-2 flex justify-between">
        <span>Environment Variables</span>
        <button 
          @click="addEnvVar"
          class="text-sm bg-gray-700 px-2 py-1 rounded"
        >
          + Add Environment Variable
        </button>
      </label>
      <div v-for="(envVar, index) in newJob.args.env" :key="index" class="flex gap-2 mb-2">
        <input 
          v-model="newJob.args.env[index]"
          type="text"
          class="flex-1 bg-gray-700 p-2 rounded"
          placeholder="e.g., MY_ENV_VAR=value"
        >
        <button 
          @click="() => removeEnvVar(index)"
          class="bg-red-500 px-2 rounded"
        >
          ×
        </button>
      </div>
    </div>

    <div class="flex justify-end">
      <button 
        @click="addJob"
        class="bg-white text-black px-4 py-2 hover:bg-gray-300"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Adding...' : 'Add Job' }}
      </button>
    </div>
  </div>
</template> 