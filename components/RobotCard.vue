<template>
  <div class="border border-white p-4">
    <pre class="mb-2 text-xs sm:text-sm md:text-base overflow-x-auto">
 _____
|     |
| o o |
|  ^  |
|_____|
    </pre>
    <h2 class="text-lg sm:text-xl mb-2">{{ robot.name || 'Unnamed Robot' }}</h2>
    <p class="mb-2 text-sm sm:text-base">
      Status: 
      <span :class="{'text-green-400': robot.status === 'Online'}">
        {{ robot.status || 'Unknown' }}
      </span>
    </p>
    <p class="text-sm sm:text-base">ID: {{ robot.robot_id }}</p>
    <div v-if="robot.tags.length" class="mb-2">
      <span v-for="tag in robot.tags" 
            :key="tag" 
            class="mr-2 text-sm bg-white/10 px-2 py-1 rounded">
        {{ tag }}
      </span>
    </div>
    <button class="mt-2 bg-white text-black px-2 py-1 text-sm sm:text-base hover:bg-gray-300"
    @click="navigateToRobot"
    >
      ACCESS INFO
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  robot: {
    type: Object,
    required: true,
    default: () => ({
      robot_id: '',
      robot_peer_id: '',
      robot_public_key: '',
      name: '',
      tags: [],
      status: ''
    })
  }
})


const navigateToRobot = () => {
  router.push(`/robots/${props.robot.robot_peer_id}`);
}

</script>
