<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'

const router = useRouter()
const showLoginModal = ref(false)
const user = ref(null)
const isLoading = ref(false) 

const getUser = async () => {
  try {
    const res = await axios.get('http://localhost:5000/auth/user', {
      withCredentials: true
    })
    user.value = res.data
    console.log('User data:', user.value)
  } catch (err) {
    user.value = null
  }
}

const loginWithGoogle = () => {
  window.location.href = 'http://localhost:5000/auth/google'
}

const logout = async () => {
  try {
    await axios.get('http://localhost:5000/auth/logout', {
      withCredentials: true
    })
    user.value = null
    showLoginModal.value = false // ปิด modal ทันที

    await Swal.fire({
      icon: 'success',
      title: 'Logged Out',
      text: 'You have successfully logged out.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#0ea5e9'
    })

    router.push('/') // กลับไปหน้า Home
  } catch (error) {
    console.error('Logout failed:', error)
    Swal.fire({
      icon: 'error',
      title: 'Logout Failed',
      text: 'Something went wrong. Please try again.',
      confirmButtonColor: '#0ea5e9'
    })
  }
}

// ฟังก์ชันสำหรับเปิด overlay ก่อนไปหน้าอื่น
const navigateWithLoading = async (path) => {
  if (!user.value) {
    Swal.fire({
      icon: 'warning',
      title: 'Please log in first',
      text: 'You need to log in to access this page.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#0ea5e9'
    })
    return
  }

  isLoading.value = true
  setTimeout(() => {
    router.push(path)
    isLoading.value = false
  }, 1000)
}

// ใช้ navigateWithLoading ทั้งคู่
const handleStartPlanning = () => {
  navigateWithLoading('/planner')
}

const goToPage = (path) => {
  navigateWithLoading(path)
}

onMounted(getUser)
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#FFFFFF]">
    <header class="w-full flex justify-between items-center py-4 px-8 fixed top-0 left-0 bg-[#FFFFFF] z-50">
      <router-link to="/">
        <img src="/1.png" alt="Logo" class="h-16 w-auto object-contain md:h-24" />
      </router-link>

      <nav class="flex items-center space-x-6 text-[#0D1282] font-bold font-kanit">
        <button
          v-if="!user"
          @click="showLoginModal = true"
          class="ml-4 bg-[#0D1282] text-[#EEEDED] px-4 py-2 rounded-full hover:bg-[#D71313] transition"
        >
          Login
        </button>
        <button
          v-else
          @click="showLoginModal = true"
          class="ml-4 h-10 w-10 rounded-full overflow-hidden hover:ring-2 hover:bg-[#D71313] transition-all flex items-center justify-center"
        >
          <img
            :src="user.photo"
            alt="User"
            class="w-full h-full object-cover"
          />
        </button>
      </nav>
    </header>

    <main class="flex flex-col md:flex-row items-center justify-center h-full flex-grow p-4 md:p-8 pt-28 m-4 md:m-8">
    <div class="md:w-1/2 text-center md:text-left md:pr-10">
      <h1 class="text-4xl md:text-5xl font-bold text-[#000000] mb-3 font-kanit">
        One platform for all your<br />travel planning needs
      </h1>
      <p class="text-[#000000] max-w-xl mt-4 mb-6 font-kanit">
        Plan trips effortlessly with Trippify, your all-in-one travel assistant.<br> 
        From smart itineraries to shared expense tracking, everything <br>
        your group needs in one place.
      </p>

      <!-- container ปุ่มแบบ flex -->
      <div class="flex flex-wrap gap-4 justify-center md:justify-start">
        <button 
          @click="handleStartPlanning" 
          class="group flex items-center gap-2 bg-[#0D1282] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#D71313] transition font-kanit"
        >
          Start Trip Planning 
          <svg xmlns="http://www.w3.org/2000/svg" 
              fill="none" viewBox="0 0 24 24" stroke-width="1.5" 
              stroke="currentColor" 
              class="size-6 transform transition-transform duration-300 group-hover:translate-x-1">
            <path stroke-linecap="round" stroke-linejoin="round" 
                  d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </button>

        <button 
          @click="goToPage('/saved-trips')"
          class="group flex items-center gap-2 bg-[#EEEDED] text-[#0D1282] px-6 py-3 rounded-full font-semibold hover:bg-gray-300 transition font-kanit"
        >
        Your Trips
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
        </button>
      </div>
    </div>
    <div class="md:w-1/2 mt-10 md:mt-0 flex justify-center items-center">
      <img src="/car.png" alt="Travel illustration" class="w-full max-w-md animate-drive"/>
    </div>
  </main>

    <!-- Login Modal -->
    <div
      v-if="showLoginModal"
      class="fixed inset-0 flex items-center justify-center z-50 bg-white/20 backdrop-blur-[3px]"
    >
    <div class="bg-white p-8 rounded-xl shadow-md text-center space-y-6 w-full max-w-md relative">
      <button
        @click="showLoginModal = false"
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl"
      >
      ✕
    </button>

    <template v-if="user">
      <img :src="user.photo" class="w-24 h-24 rounded-full mx-auto mb-4" />
      <h2 class="text-xl font-bold">{{ user.username }}</h2>
      <p class="text-gray-600">{{ user.gmail }}</p>
      <button
        @click="logout"
        class="mt-4 px-4 py-2 bg-red-400 text-white rounded hover:bg-red-500"
      >
        Logout
      </button>
    </template>

    <template v-else>
      <h1 class="text-2xl font-semibold text-gray-800">Welcome to Trippify</h1>
      <button
        @click="loginWithGoogle"
        class="flex items-center justify-center w-full max-w-xs border border-gray-300 rounded-lg px-4 py-2 bg-white hover:bg-gray-50 transition duration-200 shadow-sm mx-auto"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google icon"
          class="w-5 h-5 mr-3"
        />
        <span class="text-sm font-medium text-gray-700">Continue with Google</span>
      </button>
    </template>
    </div>
    </div>
    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      class="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md pointer-events-none"
    >
      <div class="flex flex-col items-center gap-4">
        <img src="/1.png" alt="Logo" class="w-24 h-24 bounce" />
        <p class="text-[#000000] font-bold text-lg animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  </div>
</template>
<style>
@keyframes drive {
  0%   { transform: translateY(0) rotate(0deg); }
  25%  { transform: translateY(-2px) rotate(-1deg); }
  50%  { transform: translateY(0) rotate(0deg); }
  75%  { transform: translateY(2px) rotate(1deg); }
  100% { transform: translateY(0) rotate(0deg); }
}

.animate-drive {
  animation: drive 0.7s infinite linear;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}
.bounce {
  animation: bounce 1s ease-in-out infinite;
}

</style>