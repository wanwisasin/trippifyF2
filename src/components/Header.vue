<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import axios from "axios";

const props = defineProps({
  user: { type: Object, default: null },
});

const emit = defineEmits(["update:user"]);
const store = useStore();
const router = useRouter();
const route = useRoute();

const showLoginModal = ref(false);
const isSidebarOpen = ref(false);

const tripId = route.params.tripId;

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const goToPage = (path) => {
  if (props.user) {
    router.push(path);
  } else {
    Swal.fire({
      icon: "warning",
      title: "Please log in first",
      text: "You need to log in to access this page.",
      confirmButtonText: "OK",
      confirmButtonColor: "#0ea5e9",
    });
  }
};

const goToExpense = () => {
  if (!tripId) {
    Swal.fire("Error", "No Trip selected", "error");
    return;
  }
  goToPage(`/expense/${tripId}`);
};

const loginWithGoogle = () => {
  window.location.href = "http://localhost:5000/auth/google";
};

const logout = async () => {
  try {
    await axios.get("http://localhost:5000/auth/logout", {
      withCredentials: true,
    });
    emit("update:user", null);

    await Swal.fire({
      icon: "success",
      title: "Logged Out",
      text: "You have successfully logged out.",
      confirmButtonText: "OK",
      confirmButtonColor: "#0ea5e9",
    });

    router.push("/");
  } catch (error) {
    console.error("Logout failed:", error);
    Swal.fire({
      icon: "error",
      title: "Logout Failed",
      text: "Something went wrong. Please try again.",
      confirmButtonColor: "#0ea5e9",
    });
  }
};
</script>

<template>
  <!-- Sidebar Desktop -->
  <header
    class="h-screen w-48 pl-6 pr-4 flex flex-col justify-between items-center py-8 fixed top-0 left-0 bg-white z-50 shadow-lg hidden md:flex"
  >
    <div class="flex flex-col items-center w-full">
      <router-link to="/">
        <img src="/1.png" alt="Logo" class="h-20 w-auto object-contain mb-8" />
      </router-link>

      <nav
        class="flex flex-col space-y-6 text-[#0D1282] font-bold font-kanit w-full"
      >
        <button
          @click="goToPage('/')"
          class="flex items-center gap-2 hover:text-[#D71313] py-4 px-2 justify-start"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6 flex-none"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
          <span>Home</span>
        </button>

        <button
          @click="goToPage('/saved-trips')"
          class="flex items-center gap-2 hover:text-[#D71313] py-4 px-2 justify-start"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6 flex-none"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
            />
          </svg>
          <span>Planner</span>
        </button>

        <!-- <button @click="goToExpense" class="flex items-center gap-2 hover:text-[#D71313] py-4 px-2 justify-start">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 flex-none">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
          </svg>
          <span>Expense</span>
        </button> -->

        <button
          @click="goToPage('/saved-trip-review')"
          class="flex items-center gap-2 hover:text-[#D71313] py-4 px-2 justify-start"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6 flex-none"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
            />
          </svg>
          <span>Trip Review</span>
        </button>
      </nav>
    </div>

    <div class="w-full">
      <button
        v-if="!props.user"
        @click="showLoginModal = true"
        class="mt-4 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition w-full px-4 shadow-md"
      >
        <span class="font-semibold">Login</span>
      </button>

      <div
        v-else
        @click="showLoginModal = true"
        class="mt-4 p-3 bg-white rounded-xl shadow-lg border border-gray-200 cursor-pointer hover:shadow-xl transition-shadow duration-300 flex items-center w-full"
      >
        <img
          :src="props.user.photo"
          alt="User"
          class="w-10 h-10 object-cover rounded-full flex-shrink-0 border-2 border-[#0D1282]"
        />
        <div
          class="flex flex-col items-start ml-2 text-gray-900 min-w-0 flex-grow"
        >
          <h2
            class="font-bold text-sm truncate overflow-hidden whitespace-nowrap w-full"
          >
            {{ props.user.username }}
          </h2>
          <p
            class="text-xs text-gray-600 truncate overflow-hidden whitespace-nowrap w-full"
          >
            {{ props.user.gmail }}
          </p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          class="w-4 h-4 text-gray-400 ml-1 flex-shrink-0"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </div>
    </div>
  </header>

  <!-- Topbar Mobile -->
  <header
    class="fixed top-0 left-0 right-0 h-14 bg-white shadow-md z-50 flex items-center justify-between px-4 md:hidden"
  >
    <img src="/1.png" alt="Logo" class="h-12" />
    <button @click="toggleSidebar" class="text-gray-700 text-2xl">☰</button>
  </header>

  <!-- Drawer Mobile -->
  <div
    v-if="isSidebarOpen"
    class="fixed inset-0 z-40 md:hidden bg-white/30 backdrop-blur-sm"
    @click="toggleSidebar"
  ></div>
  <!-- Drawer Mobile -->
  <aside
    :class="[
      'fixed top-0 left-0 h-screen w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 md:hidden flex flex-col justify-between',
      isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
    ]"
  >
    <!-- Top section Drawer -->
    <div class="flex flex-col items-center w-full py-6">
      <router-link to="/">
        <img src="/1.png" alt="Logo" class="h-16 mb-6" />
      </router-link>

      <nav class="flex flex-col gap-4 w-full px-4 text-[#0D1282] font-bold">
        <button
          @click="goToPage('/')"
          class="flex items-center gap-2 hover:text-[#D71313] w-full py-2 px-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6 flex-none"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
          <span>Home</span>
        </button>

        <button
          @click="goToPage('/saved-trips')"
          class="flex items-center gap-2 hover:text-[#D71313] w-full py-2 px-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6 flex-none"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
            />
          </svg>
          <span>Planner</span>
        </button>

        <button
          @click="goToPage('/saved-trip-review')"
          class="flex items-center gap-2 hover:text-[#D71313] w-full py-2 px-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6 flex-none"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
            />
          </svg>
          <span>Trip Review</span>
        </button>
      </nav>
    </div>

    <!-- User Section Drawer -->
    <div class="flex flex-col items-center w-full py-4 px-4">
      <!-- ถ้าไม่ login -->
      <button
        v-if="!props.user"
        @click="showLoginModal = true"
        class="mt-4 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition w-full px-4 shadow-md"
      >
        <span class="font-semibold">Login</span>
      </button>

      <!-- ถ้า login แล้ว -->
      <div
        v-else
        @click="showLoginModal = true"
        class="mt-4 p-3 bg-white rounded-xl shadow-lg border border-gray-200 cursor-pointer hover:shadow-xl transition-shadow duration-300 flex items-center w-full"
      >
        <img
          :src="props.user.photo"
          alt="User"
          class="w-10 h-10 object-cover rounded-full flex-shrink-0 border-2 border-[#0D1282]"
        />
        <div
          class="flex flex-col items-start ml-2 text-[#0D1282] min-w-0 flex-grow"
        >
          <h2
            class="font-bold text-sm truncate overflow-hidden whitespace-nowrap w-full"
          >
            {{ props.user.username }}
          </h2>
          <p
            class="text-xs text-gray-500 truncate overflow-hidden whitespace-nowrap w-full"
          >
            {{ props.user.gmail }}
          </p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          class="w-4 h-4 text-gray-400 ml-1 flex-shrink-0"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </div>
    </div>
  </aside>

  <!-- Modal Login/Logout -->
  <div
    v-if="showLoginModal"
    class="fixed inset-0 flex items-center justify-center z-50 bg-white/20 backdrop-blur-[3px]"
  >
    <div
      class="bg-white p-8 rounded-2xl shadow-md text-center space-y-6 w-full max-w-md relative"
    >
      <button
        @click="showLoginModal = false"
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl"
      >
        ✕
      </button>

      <template v-if="props.user">
        <img
          :src="props.user.photo"
          class="w-24 h-24 rounded-full mx-auto mb-4"
        />
        <h2 class="text-xl font-bold">{{ props.user.username }}</h2>
        <p class="text-gray-600">{{ props.user.gmail }}</p>
        <button
          @click="logout"
          class="mt-4 px-4 py-2 bg-red-400 text-white rounded hover:bg-red-500"
        >
          Logout
        </button>
      </template>

      <template v-else>
        <h1 class="text-2xl font-semibold text-gray-800">
          Welcome to Trippify
        </h1>
        <button
          @click="loginWithGoogle"
          class="flex items-center justify-center w-full max-w-xs border border-gray-300 rounded-lg px-4 py-2 bg-white hover:bg-gray-50 transition"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google icon"
            class="w-5 h-5 mr-3"
          />
          <span class="text-sm font-medium text-gray-700"
            >Continue with Google</span
          >
        </button>
      </template>
    </div>
  </div>
</template>
