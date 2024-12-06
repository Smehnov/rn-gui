<template>
  <div class="bg-black text-white p-4 font-mono min-h-screen">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-end mb-4">
        <button @click="showSettings = true" class="text-white hover:text-gray-400">
          ⚙️
        </button>
      </div>
      <NuxtPage />
    </div>
    <SettingsModal :show="showSettings" @close="showSettings = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { onMounted } from 'vue'
import { useRobotStore } from '~/stores/robotStore'
import SettingsModal from '~/components/SettingsModal.vue'

const robotStore = useRobotStore()
const showSettings = ref(false)

onMounted(async () => {
  // Initialize settings from cookies first
  robotStore.initializeSettingsFromCookies()
  
  // Then initialize agent with the loaded settings
  const agent = await robotStore.initializeAgent()
  
  if (agent) {
    await robotStore.fetchRobots()
    
    agent.subscribe((message) => {
      console.log('Received message:', message)
      if (message.type === 'RobotStatus') {
        robotStore.updateRobotStatus(message.robot_peer_id, message.status)
      }
    })
  }
})
</script>
