<!-- src/components/SavedTripReview.vue -->
<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "vue-router";
import Header from "./Header.vue";

// ✅ ใช้โค้ดเดียวกับ SavedTrips.vue ได้เลย
const savedTrips = ref([]);
const router = useRouter();
const showLoginModal = ref(false);
const user = ref(null);
const joinTripLinkModal = ref(false);
const joinLinkInput = ref("");

const getUser = async () => {
  try {
    const res = await axios.get("http://localhost:5000/auth/user", {
      withCredentials: true,
    });
    user.value = res.data;
  } catch (err) {
    user.value = null;
  }
};

const fetchSavedTrips = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/trip/mine", {
      withCredentials: true,
    });
    savedTrips.value = res.data;
  } catch (err) {
    console.error("Failed to fetch saved trips:", err);
  }
};

const viewTripReview = (tripId) => {
  router.push(`/trip/${tripId}/review`);
};

const submitJoinLink = () => {
  if (!joinLinkInput.value || !joinLinkInput.value.includes("/trip/")) {
    Swal.fire({
      icon: "warning",
      title: "Invalid link",
      text: "Please enter a valid trip link.",
      confirmButtonColor: "#0ea5e9",
    });
    return;
  }

  const match = joinLinkInput.value.match(/\/trip\/([^/]+)/);
  const tripId = match ? match[1] : null;

  if (tripId) {
    joinTripLinkModal.value = false;
    joinLinkInput.value = "";
    router.push(`/trip/${tripId}`);
  } else {
    Swal.fire({
      icon: "error",
      title: "Join failed",
      text: "Could not extract trip ID from the link.",
      confirmButtonColor: "#0ea5e9",
    });
  }
};

onMounted(() => {
  getUser();
  fetchSavedTrips();
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#FFFFFF] text-gray-800 font-kanit">
    <!-- Header -->
    <Header :user="user" @update:user="user = $event" />

    <!-- Main Content -->
    <!-- Center Wrapper: Trip List -->
    <div class="flex items-center justify-center px-4 py-8 pt-18">
      <div class="w-full max-w-6xl space-y-8">
        <!-- Header with New Trip Button -->
        <div
          class="flex flex-col sm:flex-row gap-4 mb-8 sm:justify-between sm:items-center"
        >
          <!-- Title -->
          <h2
            class="text-2xl font-extrabold text-[#0D1282] text-center sm:text-left w-full sm:w-auto"
          >
            Your Saved Trips
          </h2>

          <!-- Buttons -->
          <div
            class="flex gap-3 w-full sm:w-auto justify-center sm:justify-end"
          >
            <!-- New Trip -->
            <button
              @click="router.push('/planner')"
              class="bg-[#0D1282] text-[#FFFFFF] px-6 py-3 rounded-full font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              New Trip
            </button>

            <!-- Join Trip -->
            <button
              @click="joinTripLinkModal = true"
              class="bg-[#D71313] text-[#FFFFFF] px-6 py-3 rounded-full font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="h-5 w-5 sm:h-6 sm:w-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                />
              </svg>
              Join Trip
            </button>
          </div>
        </div>

        <!-- Trips Grid -->
        <div v-if="savedTrips.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <div v-for="trip in savedTrips" :key="trip.tripId"
            class="p-5 sm:p-6 rounded-2xl bg-[#EEEDED] shadow-xl hover:shadow-2xl hover:bg-sky-50 transition-all duration-300 transform hover:scale-105 cursor-pointer"
            @click="viewTripReview(trip.tripId)">
            <div class="flex items-center space-x-3 sm:space-x-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 sm:h-10 sm:w-10 text-[#0D1282]" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <h3 class="text-lg sm:text-xl font-bold text-[#0D1282]">
                  {{ trip.trip_name || "Unnamed Trip" }}
                </h3>
                <p class="text-gray-500 text-sm mt-1">
                  <span class="font-semibold">Date :</span> {{ new Date(trip.days[0].date).toLocaleDateString('en-US')
                  }} -
                  {{ new Date(trip.days[trip.days.length - 1].date).toLocaleDateString('en-US') }}
                </p>
              </div>
            </div>
            <div v-if="trip.members && trip.members.length" class="flex -space-x-2 items-center">
              <div v-for="member in trip.members.slice().sort((a, b) => b.role === 'leader' ? 1 : 0)"
                :key="member.user_id" class="relative group w-8 h-8 z-10">

                <!-- Crown for leader -->
                <span v-if="member.role === 'leader'"
                  class="absolute -top-2 left-1/2 transform -translate-x-1/2 text-yellow-400 text-sm z-20">
                  👑
                </span>

                <!-- Avatar -->
                <img v-if="member.photo" :src="member.photo" :alt="member.username || 'Unknown user'"
                  class="w-8 h-8 rounded-full border-2 border-gray-300" />
                <div v-else
                  class="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-200 text-gray-500 font-bold text-sm">
                  {{ member.username?.trim().charAt(0) || '?' }}
                </div>

                <!-- Tooltip -->
                <div
                  class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-[#0D1282] text-white text-xs rounded py-1 px-2 z-30 whitespace-nowrap">
                  {{ member.username || 'Unknown' }}
                </div>
              </div>
            </div>


            <div class="mt-3 sm:mt-4 border-t pt-3 sm:pt-4 border-gray-100">
              <p class="text-gray-700 font-semibold text-sm sm:text-base">
                Total Cost:
                <span class="text-green-600">{{ trip.total_trip_cost }} {{ trip.currency || "THB" }}</span>
              </p>
            </div>
          </div>
        </div>
        <!-- <div
          v-if="savedTrips.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full"
        >
          <div
            v-for="trip in savedTrips"
            :key="trip.tripId"
            class="p-6 rounded-2xl bg-[#EEEDED] shadow-xl hover:shadow-2xl hover:bg-sky-50 transition-all duration-300 transform hover:scale-105 cursor-pointer"
            @click="viewTripReview (trip.tripId)"
          >
            <div class="flex items-center space-x-3 sm:space-x-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-10 w-10 text-[#0D1282]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div>
                <h3 class="text-xl font-bold text-[#0D1282]">{{ trip?.trip_name || tripPlan?.tripName  || 'Unnamed Trip' }}</h3>
                <p class="text-gray-500 text-sm mt-1">
                  <span class="font-semibold">Saved on:</span> {{ new Date(trip.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
                </p>
              </div>
            </div>
            <div class="mt-4 border-t pt-4 border-gray-100">
              <p class="text-gray-700 font-semibold">
                Total Cost:
                <span class="text-green-600"
                  >{{ trip.total_trip_cost }} {{ trip.currency || "THB" }}</span
                >
              </p>
            </div>
          </div>
        </div> -->

        <!-- Empty state -->
        <div v-else class="text-center py-16 sm:py-20 text-gray-500 text-lg sm:text-xl font-semibold">
          <p>You haven't planned any trips yet.</p>
          <p>Let's start your first adventure!</p>
        </div>
      </div>
    </div>

    <!-- Join Link Modal -->
    <div
      v-if="joinTripLinkModal"
      class="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4"
    >
      <div
        class="bg-white p-8 rounded-2xl shadow-2xl space-y-6 w-full max-w-sm relative transform scale-100 transition-transform duration-300"
      >
        <button
          @click="joinTripLinkModal = false"
          class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold transition"
        >
          ✕
        </button>
        <h2 class="text-2xl font-bold text-sky-700 text-center">
          Join Trip via Link
        </h2>
        <input
          v-model="joinLinkInput"
          type="text"
          placeholder="Paste the invite link here..."
          class="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-4 focus:ring-sky-200 focus:border-sky-500 outline-none transition"
        />
        <button
          @click="submitJoinLink"
          class="w-full bg-[#0D1282] text-white px-4 py-3 rounded-lg font-semibold hover:bg-sky-900 transition transform hover:scale-95"
        >
          Join Trip
        </button>
      </div>
    </div>
  </div>
</template>
