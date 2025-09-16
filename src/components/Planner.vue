<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { thaiProvinces } from "../assets/provinces";
import Swal from "sweetalert2";
import Header from "./Header.vue";

const store = useStore();
const router = useRouter();
const user = ref(null);
const trip_type = ref("");
const from = ref("");
const to = ref("");
const startDate = ref("");
const endDate = ref("");
const budget = ref("");
const currency = ref("THB");
const tripName = ref("");
const isLoading = ref(false);

const travelPreferences = ref([]);
const travelStyles = [
  "Temple",
  "Cafe",
  "Photo",
  "Foodie",
  "Adventure",
  "Nature",
  "Beach",
  "Family",
  "Creator",
];

const submitTrip = async () => {
  if (!validateForm()) return;

  const payload = {
    userId: user.value?.user_id,
    tripName: tripName.value,
    from: from.value,
    to: to.value,
    startDate: startDate.value,
    endDate: endDate.value,
    budget: budget.value,
    currency: currency.value,
    preferences: travelPreferences.value,
    trip_type: trip_type.value,
  };

  try {
    isLoading.value = true;
    const res = await axios.post("http://localhost:5000/api/trip", payload);
    store.commit("trip/setTripPlan", res.data);
    setTimeout(() => router.push("/tripdetail"), 500);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Submission Failed",
      text: "Something went wrong while submitting your trip. Please try again.",
      confirmButtonText: "OK",
      confirmButtonColor: "#0ea5e9",
    });
  } finally {
    isLoading.value = false;
  }
};

const getUser = async () => {
  try {
    const res = await axios.get("http://localhost:5000/auth/user", { withCredentials: true });
    user.value = res.data;
  } catch {
    user.value = null;
  }
};

const validateForm = () => {
  if (!tripName.value || !from.value || !to.value || !startDate.value || !endDate.value || !budget.value || !trip_type.value) {
    Swal.fire({
      icon: "warning",
      title: "Incomplete Information",
      text: "Please fill out all required fields before starting your trip plan.",
      confirmButtonText: "OK",
      confirmButtonColor: "#0ea5e9",
    });
    return false;
  }
  if (from.value === to.value) {
    Swal.fire({
      icon: "warning",
      title: "Invalid Route",
      text: "Origin and destination cannot be the same.",
      confirmButtonText: "OK",
      confirmButtonColor: "#0ea5e9",
    });
    return false;
  }
  if (new Date(startDate.value) > new Date(endDate.value)) {
    Swal.fire({
      icon: "warning",
      title: "Invalid Dates",
      text: "Start date cannot be later than end date.",
      confirmButtonText: "OK",
      confirmButtonColor: "#0ea5e9",
    });
    return false;
  }
  return true;
};

onMounted(getUser);
onMounted(() => {
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/litepicker/dist/bundle.js";
  script.onload = () => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdn.jsdelivr.net/npm/litepicker/dist/css/litepicker.css";
    document.head.appendChild(css);

    const picker = new window.Litepicker({
      element: document.getElementById("dateRange"),
      singleMode: false,
      numberOfMonths: 1, // ปรับมือถือ
      numberOfColumns: 1,
      autoApply: true,
      format: "YYYY-MM-DD",
      minDate: new Date(),
      maxDays: 7,
      setup: (picker) => {
        picker.on("selected", (start, end) => {
          startDate.value = start.format("YYYY-MM-DD");
          endDate.value = end.format("YYYY-MM-DD");
        });
      },
    });
  };
  document.body.appendChild(script);
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#FFFFFF] px-4 sm:px-6">
    <Header :user="user" @update:user="user = $event" />
    <h2 class="text-2xl sm:text-3xl font-extrabold text-center mt-[100px] sm:mt-[80px] text-[#0D1282]">
      SMART TRIP PLANNER
    </h2>

    <div class="w-full max-w-md sm:max-w-4xl mx-auto bg-[#EEEDED] rounded-2xl shadow-lg p-4 sm:p-10 mt-6">
      <div class="space-y-4 sm:space-y-6">
        <!-- Trip Name -->
        <div class="bg-white p-3 rounded-xl shadow-sm">
          <p class="text-sm font-light text-gray-500 font-kanit">TRIP NAME</p>
          <input
            v-model="tripName"
            type="text"
            placeholder="e.g. Bangkok Adventure"
            class="w-full border-0 bg-white text-lg sm:text-xl outline-none font-bold font-kanit mt-1 text-[#0D1282]"
          />
        </div>

        <!-- From/To -->
        <div class="flex flex-col sm:flex-row gap-2 items-center">
          <div class="w-full bg-white p-3 rounded-xl shadow-sm">
            <p class="text-sm font-light text-gray-500 font-kanit">FROM</p>
            <select v-model="from" class="w-full border-0 bg-white text-lg sm:text-xl outline-none font-bold font-kanit mt-1">
              <option disabled value="">Select Province</option>
              <option v-for="province in thaiProvinces" :key="province" :value="province">{{ province }}</option>
            </select>
          </div>

          <button
            @click="[from, to] = [to, from]"
            class="w-10 h-10 flex-none rounded-full bg-[#0D1282] text-white flex items-center justify-center -rotate-90 sm:rotate-0 hover:bg-[#F0DE36] hover:text-[#0D1282] transition duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>

          <div class="w-full bg-white p-3 rounded-xl shadow-sm">
            <p class="text-sm font-light text-gray-500 font-kanit">TO</p>
            <select v-model="to" class="w-full border-0 bg-white text-lg sm:text-xl outline-none font-bold font-kanit mt-1">
              <option disabled value="">Select Province</option>
              <option v-for="province in thaiProvinces" :key="province" :value="province">{{ province }}</option>
            </select>
          </div>
        </div>

        <!-- Dates & Budget -->
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="w-full bg-white p-3 rounded-xl shadow-sm">
            <p class="text-sm font-light text-gray-500 font-kanit">DEPARTURE - RETURN</p>
            <input id="dateRange" type="text" placeholder="Select date range" class="w-full border-0 bg-white text-lg sm:text-xl outline-none font-bold font-kanit mt-1 text-[#0D1282]" />
          </div>

          <div class="w-full bg-white p-3 rounded-xl shadow-sm relative">
            <p class="text-sm font-light text-gray-500 font-kanit">BUDGET</p>
            <input v-model="budget" type="number" min="0" placeholder="Enter budget" class="w-full border-0 bg-white text-lg sm:text-xl outline-none font-bold font-kanit mt-1 text-[#0D1282]" />
            <span class="absolute right-3 top-1/2 -translate-y-1 text-lg sm:text-2xl text-[#0D1282] font-semibold font-kanit">฿</span>
          </div>
        </div>

        <!-- Travel Type -->
        <div class="bg-white p-3 rounded-xl shadow-sm mt-2">
          <p class="text-sm font-light text-gray-500 font-kanit mb-2">TRAVEL TYPE</p>
          <div class="grid grid-cols-3 gap-2">
            <label v-for="type in [{ label: 'Solo', value: 'solo' }, { label: 'Couple', value: 'couple' }, { label: 'Group', value: 'group' }]" :key="type.value"
              class="relative flex items-center justify-center p-2 rounded-xl border-2 cursor-pointer transition-all duration-300 ease-in-out"
              :class="{
                'bg-white border-slate-300 shadow-sm hover:bg-slate-50': !trip_type.includes(type.value),
                'bg-[#E5F3FF] border-[#0D1282] shadow-md': trip_type.includes(type.value),
              }"
            >
              <input type="radio" name="trip_type" class="hidden" :value="type.value" v-model="trip_type" />
              <span class="w-full text-sm sm:text-base font-bold font-kanit text-center transition-all duration-200"
                :class="{'text-[#0D1282]': trip_type === type.value, 'text-black': trip_type !== type.value}">{{ type.label }}</span>
              <div v-if="trip_type.includes(type.value)" class="absolute top-1 right-1 w-5 h-5 bg-[#0D1282] rounded-full flex items-center justify-center">
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </label>
          </div>
        </div>

        <!-- Travel Styles -->
        <h3 class="font-semibold mb-2 font-mitr text-[#0D1282] pt-2 text-sm sm:text-base">Choose Your Travel Style:</h3>
        <div class="w-full flex overflow-x-auto gap-3 sm:gap-6 py-2 custom-scrollbar">
          <label v-for="style in travelStyles" :key="style" class="relative flex-none flex flex-col items-center justify-center text-center p-1 cursor-pointer transition-all duration-200">
            <input type="checkbox" :value="style" v-model="travelPreferences" class="appearance-none absolute inset-0 opacity-0 cursor-pointer" />
            <div class="flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 mb-1 rounded-full transition-all duration-200"
              :class="{'bg-[#F0DE36] text-[#0D1282]': travelPreferences.includes(style),'bg-gray-200 text-gray-500': !travelPreferences.includes(style)}">
              <img v-if="style === 'Temple'" src="/temple.png" alt="Tag icon" class="size-6 sm:size-7" />
              <img v-else-if="style === 'Cafe'" src="/cafe.png" alt="Tag icon" class="size-6 sm:size-7" />
              <img v-else-if="style === 'Photo'" src="/camera.png" alt="Tag icon" class="size-6 sm:size-7" />
              <img v-else-if="style === 'Foodie'" src="/food.png" alt="Tag icon" class="size-6 sm:size-7" />
              <img v-else-if="style === 'Adventure'" src="/hiking.png" alt="Tag icon" class="size-6 sm:size-7" />
              <img v-else-if="style === 'Nature'" src="/nature.png" alt="Tag icon" class="size-6 sm:size-7" />
              <img v-else-if="style === 'Beach'" src="/beach.png" alt="Tag icon" class="size-6 sm:size-7" />
              <img v-else-if="style === 'Family'" src="/family.png" alt="Tag icon" class="size-6 sm:size-7" />
              <img v-else-if="style === 'Creator'" src="/slate.png" alt="Tag icon" class="size-6 sm:size-7" />
            </div>
            <span class="font-semibold font-kanit text-xs sm:text-sm transition-all duration-200"
              :class="{'text-[#D71313]': travelPreferences.includes(style), 'text-gray-500': !travelPreferences.includes(style)}">{{ style }}</span>
          </label>
        </div>

        <div class="text-center pt-2">
          <button @click="submitTrip" class="bg-[#0D1282] text-white px-5 py-2 rounded-full font-semibold hover:bg-[#F0DE36] hover:text-[#0D1282] transition font-kanit text-sm sm:text-base">
            Start Planning
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md pointer-events-none">
      <div class="flex flex-col items-center gap-4">
        <img src="/1.png" alt="Loading Logo" class="w-20 h-20 sm:w-24 sm:h-24 bounce" />
        <p class="text-[#000000] font-bold text-sm sm:text-lg animate-pulse">Creating your trip...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes bounce {
  0%,100%{transform:translateY(0);}
  50%{transform:translateY(-15px);}
}
.bounce{animation:bounce 1s ease-in-out infinite;}

/* custom horizontal scrollbar for travel styles */
.custom-scrollbar::-webkit-scrollbar { height: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #0D1282; border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #E5E7EB; }
</style>
