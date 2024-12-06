<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-gray-800 rounded-lg w-full max-w-md p-6">
      <h3 class="text-lg font-semibold mb-4">Settings</h3>
      <form @submit.prevent="saveSettings">
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">WebSocket URL</label>
          <input v-model="wsUrl" type="text" class="w-full p-2 bg-gray-700 rounded" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">Owner Key</label>
          <input v-model="ownerKey" type="text" class="w-full p-2 bg-gray-700 rounded" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">Secret Key</label>
          <input v-model="secretKey" type="text" class="w-full p-2 bg-gray-700 rounded" />
        </div>
        <div class="flex justify-end">
          <button type="button" @click="close" class="bg-red-500 text-white px-3 py-1.5 rounded mr-2">Cancel</button>
          <button type="submit" class="bg-blue-500 text-white px-3 py-1.5 rounded">Save</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRobotStore } from '~/stores/robotStore'
import { useCookies } from '@vueuse/integrations/useCookies'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits(['close'])

const robotStore = useRobotStore()
const cookies = useCookies()

const wsUrl = ref(robotStore.$state.wsUrl)
const ownerKey = ref(robotStore.$state.ownerKey)
const secretKey = ref(robotStore.$state.secretKey)

const saveSettings = () => {
  robotStore.setSettings(wsUrl.value, ownerKey.value, secretKey.value)
  emit('close')
}

const close = () => {
  emit('close')
}
</script> 