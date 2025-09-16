<!-- src/error/ErrorArea.vue -->
<template>
  <div class="bg-red-50 p-6 rounded-lg shadow text-center border border-red-200">
    <h2 class="text-2xl font-bold text-red-600 mb-2">{{ title }}</h2>
    <p class="text-red-500 text-sm">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Oops! Something went wrong.' },
  message: { type: String, default: 'Please try again later or contact support.' }
})
</script>
