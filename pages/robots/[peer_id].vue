<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useRobotStore } from '~/stores/robotStore'
import type { Job } from '~/types/robot'

const route = useRoute()
const robotStore = useRobotStore()
const peerId = route.params.peer_id as string
const isLoading = ref(false)
const showJobForm = ref(false)

const robot = computed(() => robotStore.getRobotById(peerId))
const jobs = computed(() => robotStore.getRobotJobs(peerId))

onMounted(async () => {
  await robotStore.fetchRobotJobs(peerId)

})

// Status badge color mapping
const getStatusColor = (status: Job['status']) => {
  const colors = {
    'pending': 'text-yellow-400',
    'in_progress': 'text-blue-400',
    'completed': 'text-green-400',
    'failed': 'text-red-400'
  }
  return colors[status] || 'text-gray-400'
}

// Format timestamp
const formatDate = (timestamp: string) => {
  return new Date(parseInt(timestamp) * 1000).toLocaleString()
}

const handleJobAdded = async () => {
  await robotStore.fetchRobotJobs(peerId)
  showJobForm.value = false
}

const selectedJobId = ref<string | null>(null)
const showJobInfo = ref(false)

const openJobInfo = (jobId: string) => {
  selectedJobId.value = jobId
  showJobInfo.value = true
}
</script>

<template>
  <div v-if="robot">
    <main>
      <section class="mb-8">
        <h2 class="text-xl mb-4">{{ robot.name || 'Unnamed Robot' }} (ID: {{ robot.robot_peer_id }})</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <pre class="text-xs sm:text-sm md:text-base overflow-x-auto mb-4">
     _____
    |     |
    | o o |
    |  ^  |
    |_____|
   /       \
  /  \___/  \
 /__|     |__\
    |     |
    |     |
    |_____|
    ===PLACE_FOR_ROBOT_IMAGE===
            </pre>
          </div>
          <div>
            <p class="mb-2">Status: 
              <span :class="{
                'text-green-400': robot.status === 'Online',
                'text-yellow-400': robot.status === 'Unknown'
              }">
                {{ robot.status }}
              </span>
            </p>
            <p class="mb-2">Last Seen: {{ new Date().toLocaleString() }}</p>
            <p class="mb-2">Location: Home Base</p>
          </div>
        </div>
      </section>
<!-- 
      <section class="mb-8">
        <h3 class="text-lg mb-2">Specifications</h3>
        <ul class="list-disc list-inside">
          <li>Height: 1.2 meters</li>
          <li>Weight: 45 kg</li>
          <li>Power Source: Lithium-ion battery</li>
          <li>Operating System: RoboOS v3.5</li>
          <li>Connectivity: Wi-Fi, Bluetooth 5.0, 5G</li>
        </ul>
      </section>

      <section class="mb-8">
        <h3 class="text-lg mb-2">Capabilities</h3>
        <ul class="list-disc list-inside">
          <li>Natural Language Processing</li>
          <li>Object Recognition</li>
          <li>Task Scheduling and Management</li>
          <li>Environmental Monitoring</li>
          <li>Basic Medical Diagnostics</li>
        </ul>
      </section> -->

      <!-- <section class="mb-8">
        <h3 class="text-lg mb-2">Recent Activities</h3>
        <div class="border border-white p-4 h-40 overflow-y-auto">
          <p v-for="job in jobs" :key="job.id">
            {{ formatDate(job.timestamp) }} - {{ job.type }} 
            <span :class="getStatusColor(job.status)">({{ job.status }})</span>
          </p>
          <p v-if="jobs.length === 0" class="text-gray-400">No recent activities</p>
        </div>
      </section> -->

      <section class="mb-8">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg">Docker Container Launch Jobs</h3>
          <button 
            @click="showJobForm = !showJobForm"
            class="bg-white text-black px-4 py-2 hover:bg-gray-300"
          >
            {{ showJobForm ? 'Hide Form' : 'Add Job' }}
          </button>
        </div>

        <!-- Job Form Spoiler -->
        <div v-show="showJobForm" class="mb-4">
          <JobForm 
            :peer-id="peerId"
            @job-added="handleJobAdded"
          />
        </div>
        
        <div class="overflow-x-auto">
          <div v-if="isLoading" class="text-center py-4">
            Loading jobs...
          </div>
          <div v-else-if="robotStore.error" class="text-red-400 text-center py-4">
            {{ robotStore.error }}
          </div>
          <table v-else class="w-full border-collapse">
            <thead>
              <tr class="border-b border-white">
                <th class="py-2 px-4 text-left">Job ID</th>
                <th class="py-2 px-4 text-left">Type</th>
                <th class="py-2 px-4 text-left">Status</th>
                <th class="py-2 px-4 text-left">Timestamp</th>
                <th class="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="job in jobs" 
                  :key="job.id" 
                  class="border-b border-white">
                <td class="py-2 px-4">{{ job.id }}</td>
                <td class="py-2 px-4">{{ job.type }}</td>
                <td class="py-2 px-4">
                  <span :class="getStatusColor(job.status)">{{ job.status }}</span>
                </td>
                <td class="py-2 px-4">{{ formatDate(job.timestamp) }}</td>
                <td class="py-2 px-4 space-x-2">
                  <button 
                    @click="openJobInfo(job.id)"
                    class="bg-white text-black px-2 py-1 text-sm hover:bg-gray-300"
                  >
                    More Info
                  </button>
                </td>
              </tr>
              <tr v-if="jobs.length === 0">
                <td colspan="5" class="py-4 text-center text-gray-400">No jobs found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- <section>
        <h3 class="text-lg mb-2">Command Terminal</h3>
        <div class="border border-white p-4">
          <p class="mb-2">> Enter command:</p>
          <input 
            type="text" 
            class="bg-black text-white border-b border-white focus:outline-none w-full" 
            placeholder="Type your command here..."
          >
        </div>
      </section> -->
    </main>
  </div>
  <div v-else class="text-center py-8">
    <p>Robot not found</p>
    <button 
      @click="$router.push('/robots')" 
      class="mt-4 bg-white text-black px-4 py-2"
    >
      Return to Robots List
    </button>
  </div>

  <!-- Add the JobInfo modal -->
  <JobInfo
    v-if="selectedJobId"
    :job-id="selectedJobId"
    :robot-peer-id="peerId"
    :show="showJobInfo"
    @close="showJobInfo = false"
  />
</template>
