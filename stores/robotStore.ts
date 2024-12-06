import { defineStore, acceptHMRUpdate } from 'pinia'
import { Robot, Job, type NetworkInfo } from '~/types/robot'
import { createAgent, Agent } from '~/composables/useAgent'
import { useCookies } from '@vueuse/integrations/useCookies'

const cookies = useCookies()

export const useRobotStore = defineStore('robot', {
  state: () => ({
    robots: [] as Robot[],
    selectedRobot: null as Robot | null,
    isLoading: false,
    error: null as string | null,
    jobs: [] as Job[],
    agent: null as Agent | null,
    wsUrl: 'ws://localhost:8888',
    ownerKey: 'INAD8ZJc+xsiUEcm3kQ057En9kVuLL6u4dR6//DVhyU=',
    secretKey: 'llIjB3j3YAXRK34YZg45ER5zXaDZm45cEUQVMhF/D9Ag0APxklz7GyJQRybeRDTnsSf2RW4svq7h1Hr/8NWHJQ==',
    networkInfo: {} as NetworkInfo,
  }),

  actions: {
    initializeSettingsFromCookies() {
      const cookies = useCookies()
      this.wsUrl = cookies.get('wsUrl') || this.wsUrl
      this.ownerKey = cookies.get('ownerKey') || this.ownerKey
      this.secretKey = cookies.get('secretKey') || this.secretKey
    },

    async initializeAgent() {


      // Return existing agent if already initialized
      if (this.agent?.isConnected) {
        return this.agent
      }

      const { agent, error } = await createAgent(this.wsUrl, this.ownerKey, this.secretKey)
      
      if (error) {
        this.error = error
        return null
      }
      
      // Wait for connection to be established (max 10 seconds)
      const timeout = 10000
      const startTime = Date.now()
      
      while (agent && !agent.isConnected) {
        if (Date.now() - startTime > timeout) {
          this.error = 'Connection timeout'
          return null
        }
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      this.agent = agent
      return agent
    },

    async fetchRobots() {
      if (!this.agent) return
      
      try {
        this.isLoading = true
        this.error = null
        this.robots = await this.agent.getRobots()
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to fetch robots'
        console.error('Error fetching robots:', err)
      } finally {
        this.isLoading = false
      }
    },

    async startRobotJob(robotPeerId: string, jobType: string, jobArgs: any = {}) {
      if (!this.agent) return null
      
      try {
        this.error = null
        const jobId = crypto.randomUUID()
        await this.agent.startJob(robotPeerId, jobId, jobType, jobArgs)
        return jobId
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to start robot job'
        console.error('Error starting robot job:', err)
        return null
      }
    },

    selectRobot(robotId: string) {
      this.selectedRobot = this.robots.find(robot => robot.robot_peer_id === robotId) || null
    },

    updateRobotStatus(robotPeerId: string, status: 'Online' | 'Unknown') {
      const robot = this.robots.find(r => r.robot_peer_id === robotPeerId)
      if (robot) {
        robot.status = status
      }
    },

    async fetchRobotJobs(robotPeerId: string) {
      if (!this.agent) {
        await this.initializeAgent()
        if (!this.agent) return
      }
      
      try {
        console.log('Fetching jobs for robot:', robotPeerId);
        
        const jobs = await this.agent.getJobs(robotPeerId)
        console.log('Jobs:', jobs);
        
        // Map the response to our Job interface
        this.jobs = jobs.map((job: any) => ({
          id: job.id || job.job_id,
          type: job.type || job.job_type,
          status: job.status,
          timestamp: job.timestamp,
          robot_peer_id: robotPeerId
        }))
      } catch (err) {
        console.error('Error fetching jobs:', err)
        this.error = err instanceof Error ? err.message : 'Failed to fetch robot jobs'
      }
    },

    updateJobStatus(jobId: string, status: Job['status']) {
      const job = this.jobs.find(j => j.id === jobId)
      if (job) {
        job.status = status
      }
    },

    async fetchNetworkInfo() {
      if (!this.agent) return
      
      try {
        this.isLoading = true
        this.error = null
        this.networkInfo = await this.agent.getNetworkInfo()
        console.log('Network info:', this.networkInfo)
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to fetch network info'
        console.error('Error fetching network info:', err)
      } finally {
        this.isLoading = false
      }
    },

    setSettings(wsUrl: string, ownerKey: string, secretKey: string) {
      this.wsUrl = wsUrl
      this.ownerKey = ownerKey
      this.secretKey = secretKey

      cookies.set('wsUrl', wsUrl)
      cookies.set('ownerKey', ownerKey)
      cookies.set('secretKey', secretKey)
    },
  },

  getters: {
    onlineRobots(): Robot[] {
      return this.robots.filter(robot => robot.status === 'Online')
    },
    
    getRobotById: (state) => (robotPeerId: string) => {
      return state.robots.find(robot => robot.robot_peer_id === robotPeerId)
    },
    
    getRobotJobs: (state) => (robotPeerId: string) => {
      return state.jobs.filter(job => job.robot_peer_id === robotPeerId)
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRobotStore, import.meta.hot))
}