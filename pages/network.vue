<script setup lang="ts">
import { onMounted } from 'vue'
import { useRobotStore } from '~/stores/robotStore'
import type { Robot, NetworkPeer } from '~/types/robot'

const robotStore = useRobotStore()

onMounted(async () => {
  await robotStore.fetchRobots()
  await robotStore.fetchNetworkInfo()
})

// Format robot name for display
const formatRobotName = (robot: Robot) => {
  return robot.name || `Robot (${robot.robot_peer_id.slice(0, 8)}...)`
}

// Format timestamp
const formatLastHandshake = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString()
}

// Get connected peers for a robot
const getConnectedPeers = (robotPeerId: string) => {
  const info = robotStore.networkInfo[robotPeerId]
  if (!info) return []
  
  return info.peers
    .map(peerId => robotStore.robots.find(r => r.robot_peer_id === peerId))
    .filter(robot => robot !== undefined) as Robot[]
}

// Get peer info
const getPeerInfo = (robotPeerId: string): NetworkPeer | null => {
  return robotStore.networkInfo[robotPeerId] || null
}
</script>

<template>
  <div class="p-4">
    <div class="status mb-4">
      <div class="flex items-center gap-2">
        <span>Connection Status: {{ robotStore.agent?.isConnected ? 'Connected' : 'Disconnected' }}</span>
        <span v-if="robotStore.error" class="text-red-400">{{ robotStore.error }}</span>
      </div>
    </div>

    <h1 class="text-2xl mb-6">Network Topology</h1>


    <div v-if="robotStore.isLoading" class="text-center py-4">
      Loading network information...
    </div>

    <div v-else-if="robotStore.error" class="text-red-400 text-center py-4">
      {{ robotStore.error }}
    </div>

    <div v-else-if="robotStore.isLoading" class="text-center py-4">
      Loading robots...
    </div>

    <div v-else-if="robotStore.robots.length" class="space-y-8">
      <!-- Robots List -->
      <div class="bg-gray-900 p-6 rounded-lg">
        <h2 class="text-xl mb-4">Connected Robots</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="robot in robotStore.robots" 
            :key="robot.robot_peer_id"
            class="bg-gray-800 p-4 rounded-lg"
          >
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-semibold">{{ formatRobotName(robot) }}</h3>
              <span 
                :class="{
                  'text-green-400': getPeerInfo(robot.robot_peer_id)?.is_online,
                  'text-red-400': !getPeerInfo(robot.robot_peer_id)?.is_online
                }"
              >
                {{ getPeerInfo(robot.robot_peer_id)?.is_online ? 'Online' : 'Offline' }}
              </span>
            </div>
            
            <!-- Peer ID -->
            <div class="text-sm text-gray-400 mb-2">
              ID: {{ robot.robot_peer_id }}
            </div>
            
            <!-- Last Handshake -->
            <div class="text-sm text-gray-400 mb-2">
              Last Handshake: {{ getPeerInfo(robot.robot_peer_id)?.last_handshake 
                ? formatLastHandshake(getPeerInfo(robot.robot_peer_id)!.last_handshake)
                : 'Never' }}
            </div>

            <!-- Connected Peers -->
            <div class="text-sm">
              <h4 class="text-gray-400 mb-1">Connected Peers:</h4>
              <div v-if="getConnectedPeers(robot.robot_peer_id).length" class="space-y-1">
                <div 
                  v-for="peer in getConnectedPeers(robot.robot_peer_id)"
                  :key="peer.robot_peer_id"
                  class="flex items-center gap-2"
                >
                  <span class="w-2 h-2 rounded-full bg-green-400"></span>
                  <span>{{ formatRobotName(peer) }}</span>
                </div>
              </div>
              <div v-else class="text-gray-500">
                No direct connections
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Network Statistics -->
      <div class="bg-gray-900 p-6 rounded-lg">
        <h2 class="text-xl mb-4">Network Statistics</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gray-800 p-4 rounded-lg">
            <h3 class="text-gray-400 mb-2">Total Robots</h3>
            <p class="text-2xl">{{ robotStore.robots.length }}</p>
          </div>
          <div class="bg-gray-800 p-4 rounded-lg">
            <h3 class="text-gray-400 mb-2">Online Robots</h3>
            <p class="text-2xl text-green-400">
              {{ Object.values(robotStore.networkInfo).filter(info => info.is_online).length }}
            </p>
          </div>
       </div>
      </div>
    </div>

    <div v-else class="text-center py-8 text-gray-400">
      No robots available.
    </div>
  </div>
</template>
