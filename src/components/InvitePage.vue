<script setup>
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const loginWithGoogle = () => {
  const tripPath = route.params.tripId
    ? `/trip/${route.params.tripId}`
    : "/";

  window.location.href = `http://localhost:5000/auth/google?redirect=http://localhost:5173${tripPath}`;
};
</script>

<template>
  <div
    class="flex flex-col items-center justify-center h-screen bg-[#FFFFFF] space-y-6"
  >
  <img
      src="/1.png"
      alt="Logo"
      class="h-24 w-auto object-contain"
    />
    <div
      class="bg-white text-center rounded-2xl shadow-xl p-8 max-w-md w-full"
    >
      <h1 class="text-xl font-bold text-gray-800 mb-4">
        You’ve been invited to join this trip
      </h1>
      <p class="text-gray-600 mb-8">
        Please log in with Google to view the trip details.
      </p>

      <button
        @click="loginWithGoogle"
        class="flex items-center justify-center w-full border border-gray-300 rounded-lg px-4 py-3 bg-white hover:bg-gray-50 transition"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google icon"
          class="w-5 h-5 mr-3"
        />
        <span class="text-sm font-medium text-gray-700">
          Continue with Google
        </span>
      </button>
    </div>
  </div>
</template>
