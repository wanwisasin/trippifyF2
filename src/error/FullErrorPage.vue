<template>
  <section class="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 text-center px-4">
    <div>
      <h1 class="text-6xl font-extrabold text-primary-600 dark:text-primary-500">{{ code }}</h1>
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white my-4">{{ title }}</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-6">{{ message }}</p>
      <RouterLink to="/" class="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-800">
        Back to Homepage
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
defineProps({
  code: { type: String, default: '404' },
  title: { type: String, default: 'Page Not Found' },
  message: { type: String, default: 'The page you’re looking for doesn’t exist.' }
})
</script>
