<script setup lang="ts">
import { onMounted } from 'vue'
import { useRobotStore } from '~/stores/robotStore'

const robotStore = useRobotStore()

onMounted(async () => {
})

const startRobotJob = async (robotPeerId: string) => {
  await robotStore.startRobotJob(robotPeerId, 'example-job', {})
}
</script>

<template>
  <div>
    <div class="status">
      Connection Status: {{ robotStore.agent?.isConnected ? 'Connected' : 'Disconnected' }}
      <span v-if="robotStore.error" class="error">{{ robotStore.error }}</span>
    </div>

    <h1 class="text-2xl mb-4 cursor">Robot Entities Database</h1>

    <div v-if="robotStore.isLoading" class="loading">
      Loading robots...
    </div>

    <div
      v-else-if="robotStore.robots.length"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div v-for="robot in robotStore.robots" :key="robot.robot_peer_id">
        <RobotCard 
          :robot="robot" 
          @start-job="startRobotJob(robot.robot_peer_id)"
        />
      </div>
    </div>

    <div v-else class="no-robots">
      No robots found.
    </div>
  </div>
</template>

<style scoped>
.error {
  color: red;
  margin-left: 1rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.no-robots {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>