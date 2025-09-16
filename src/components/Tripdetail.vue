<script setup>
import { computed, watch, onMounted } from "vue";
import { useStore } from "vuex";
import Tripmap from "./Tripmap.vue";
import axios from "axios";
import { useRouter } from "vue-router";
import draggable from "vuedraggable";
import Swal from "sweetalert2";
import { useRoute } from "vue-router";
import { ref } from "vue";
import Header from "./Header.vue";

const route = useRoute();
const router = useRouter();
const store = useStore();
const trip = ref(null);
const userRole = ref(null);
// const showLoginModal = ref(false);
const user = ref(null);
const tripId = computed(() => route.params.tripId);

const tripPlan = computed(() => store.getters["trip/getTripPlan"]);
const transportInfo = computed(() => ({
  ...tripPlan.value?.transport_info,
  how_to_get_there: tripPlan.value?.how_to_get_there || "",
}));
const tripName = computed(() => tripPlan.value?.tripName || "My Trip");

const loadError = ref("");
const inviteLink = ref("");
const showEditControls = ref(false);
const isSavingTrip = ref(false);

const searchQuery = ref("");
const searchResults = ref([]);
const loadingSearch = ref(false);
// Nearby state
const nearbyPlaces = ref([]);
const allLocations = computed(() => {
  return (
    tripPlan.value?.days?.flatMap(
      (
        day,
        dayIndex // เพิ่ม dayIndex เข้ามา
      ) =>
        (day.locations || []).map((loc) => ({
          ...loc,
          lat: parseFloat(loc.lat),
          lng: parseFloat(loc.lng),
          day: dayIndex + 1, // เพิ่ม property 'day' โดยใช้ dayIndex
        }))
    ) || []
  );
});

const selectedDayIndex = ref(0); // วันที่กำลังดู
const loadingNearby = ref(false);
const selectedCategory = ref("cafe"); // เพิ่มตัวแปรสำหรับ category ที่เลือก

// --- Computed ---
const selectedDay = computed(
  () => tripPlan.value?.days[selectedDayIndex.value] || null
);
const activeTab = ref("plan");

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

const isSaved = ref(false);
const saveTrip = async () => {
  if (isSavingTrip.value) return;
  if (!tripPlan.value) return;

  isSavingTrip.value = true;
  try {
    const payload = {
      ...tripPlan.value,
    };

    console.log("Saving trip with ID:", payload.tripId || "(new trip)");

    const response = await axios.post(
      "http://localhost:5000/api/trip/saveOrUpdate",
      payload,
      { withCredentials: true }
    );

    const savedTrip = response.data;

    // ✅ ตรวจสอบว่า backend ส่ง tripId กลับมา
    if (!savedTrip.tripId) {
      console.error("Trip ID missing from backend!", savedTrip);
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: "Trip ID not returned from server.",
      });
      return;
    }

    // อัปเดต Vuex และ local trip
    trip.value = savedTrip;

    // ✅ อัปเดต tripPlan.tripId เพื่อให้ name และ invite link ถูกต้อง
    tripPlan.value.tripId = savedTrip.tripId;
    store.commit("trip/updateTripPlan", savedTrip);

    router.push(`/trip/${savedTrip.tripId}`);
    Swal.fire({
      icon: "success",
      title: "Trip saved successfully!",
      text: "Your travel plan has been saved 😊",
      confirmButtonColor: "#0ea5e9",
    });
  } catch (error) {
    console.error("Error saving trip:", error);
    Swal.fire({
      icon: "error",
      title: "Save Failed",
      text: "Something went wrong. Please try again.",
      confirmButtonColor: "#0ea5e9",
    });
  } finally {
    isSavingTrip.value = false;
  }
};

const generateInviteLink = () => {
  const tripId = tripPlan.value?.tripId;
  if (!tripId) {
    Swal.fire({
      icon: "warning",
      title: "Trip not saved yet!",
      text: "Please save your trip before sharing.",
    });
    return;
  }
  inviteLink.value = `${window.location.origin}/trip/${tripId}`;
};

const copyToClipboard = () => {
  navigator.clipboard.writeText(inviteLink.value);
  Swal.fire({
    icon: "success",
    title: "Copied!",
    text: "Invite link copied to clipboard.",
    timer: 1500,
    showConfirmButton: false,
  });
};

const goToPage = (url) => {
  router.push(url);
};

const modifyTrip = () => {
  showEditControls.value = true; // กดปุ่มแล้วเปิด editable
};

const cancelTrip = () => {
  Swal.fire({
    title: "Cancel this trip?",
    text: "Are you sure you want to cancel and discard your trip plan?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#0ea5e9",
    cancelButtonColor: "#a0aec0",
    confirmButtonText: "Yes, cancel it",
    cancelButtonText: "No, keep it",
  }).then((result) => {
    if (result.isConfirmed) {
      store.commit("trip/clearTripPlan");
      router.push("/");
      Swal.fire({
        icon: "info",
        title: "Trip cancelled",
        text: "Your trip plan has been discarded.",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  });
};

const removeLocation = (dayIndex, locIndex) => {
  Swal.fire({
    title: "Are you sure?",
    text: "Do you really want to remove this location from your trip plan?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#0ea5e9",
    cancelButtonColor: "#a0aec0",
    confirmButtonText: "Yes, remove it!",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      tripPlan.value.days[dayIndex].locations.splice(locIndex, 1);
      recalculateCosts();
      store.commit("trip/updateTripPlan", tripPlan.value);
      Swal.fire({
        title: "Removed!",
        text: "The location has been removed from your trip plan.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  });
};

const recalculateCosts = () => {
  let totalTripCost = 0;
  tripPlan.value.days.forEach((day) => {
    let dayCost = 0;
    if (day.locations && day.locations.length > 0) {
      day.locations.forEach((loc) => {
        const cost = parseFloat(loc.estimated_cost) || 0;
        dayCost += cost;
      });
    }
    day.total_day_cost = dayCost;
    totalTripCost += dayCost;
  });
  tripPlan.value.total_trip_cost = totalTripCost;
};
// debounce function
function debounce(fn, delay = 500) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// search function
const searchPlaces = async () => {
  if (!searchQuery.value.trim()) return;
  loadingSearch.value = true;
  try {
    const { data } = await axios.get(
      "http://localhost:5000/api/places/search",
      {
        params: { query: searchQuery.value },
        withCredentials: true,
      }
    );
    searchResults.value = data.places || [];
  } catch (err) {
    console.error("Search failed:", err);
    Swal.fire("Error", "Cannot fetch search results", "error");
  } finally {
    loadingSearch.value = false;
  }
};

// สร้าง debounce ใหม่ ชื่อไม่ซ้ำ
const debouncedSearchInput = debounce(() => {
  searchPlaces();
}, 500);

// watch input
watch(searchQuery, () => {
  debouncedSearchInput();
});

const fetchNearby = async (lat, lng, type = "cafe") => {
  if (!lat || !lng) return;
  loadingNearby.value = true;
  try {
    const res = await axios.get("http://localhost:5000/api/places/nearby", {
      params: { lat, lng, type, radius: 1000 },
    });

    // ตรวจสอบว่ามี array อยู่ใน key 'places'
    const placesArray = Array.isArray(res.data.places) ? res.data.places : [];

    nearbyPlaces.value = placesArray.map((p) => ({
      ...p,
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng),
    }));

    console.log("Nearby places:", nearbyPlaces.value);
  } catch (err) {
    console.error("Failed to fetch nearby places:", err.message);
    nearbyPlaces.value = [];
  } finally {
    loadingNearby.value = false;
  }
};

// Watch day and category change
watch(
  () => [selectedDayIndex.value, selectedCategory.value],
  async ([newIndex, newCategory]) => {
    const day = tripPlan.value?.days[newIndex];
    if (day?.locations?.length > 0) {
      const { lat, lng } = day.locations[0];
      await fetchNearby(lat, lng, newCategory);
    } else {
      nearbyPlaces.value = [];
    }
  },
  { immediate: true }
);

// Add nearby to trip
const addNearbyPlace = (place) => {
  const day = tripPlan.value.days[selectedDayIndex.value];
  day.locations.push({
    name: place.name,
    lat: parseFloat(place.lat),
    lng: parseFloat(place.lng),
    category: selectedCategory.value,
    estimated_cost: 0,
    currency: tripPlan.value.currency || "THB",
  });

  console.log("Added nearby place:", place.name);

  // ✅ แจ้งเตือนเมื่อ add สำเร็จ
  Swal.fire({
    icon: "success",
    title: "Added!",
    text: `${place.name} has been added to Day ${selectedDayIndex.value + 1}`,
    showConfirmButton: false,
    timer: 1500,
  });
};

// watch(
//   () => tripPlan.value,
//   (newVal) => {
//     console.log("Watcher triggered:", newVal)  // <== ดูว่ามี days.title ไหม

//     store.commit("trip/updateTripPlan", newVal);
//   },
//   { deep: true }
// );
onMounted(async () => {
  try {
    await getUser();

    if (route.params.tripId) {
      // เรียก join ก่อน (POST) ถ้ายังไม่เป็น member
      try {
        await axios.post(
          `http://localhost:5000/api/trip/${route.params.tripId}/join`,
          {},
          { withCredentials: true }
        );
      } catch (err) {
        console.warn("Already a member or join failed:", err);
      }

      // จากนั้น fetch ข้อมูล trip plan จริง
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/trip/${route.params.tripId}`,
          { withCredentials: true }
        );
        trip.value = data;
        store.commit("trip/setTripPlan", data);
      } catch (err) {
        console.error("Error fetching trip:", err);
      }
    }

    // ถ้ามี location แรก ให้ดึง nearby places
    if (
      tripPlan.value?.days?.length > 0 &&
      tripPlan.value.days[0].locations?.length > 0
    ) {
      const { lat, lng } = tripPlan.value.days[0].locations[0];
      await fetchNearby(lat, lng, selectedCategory.value);
    }
  } catch (err) {
    console.error("Error in onMounted:", err);
  }
});
</script>

<template>
  <div class="flex bg-[#FFFFFF]">
    <Header :user="user" @update:user="user = $event" />

    <main class="flex-1 flex flex-col md:flex-row overflow-hidden md:ml-48 pt-10">
      <div v-if="tripPlan" class="flex flex-col md:flex-row w-full">
        <div class="w-full md:w-[50%] p-8 md:p-8 overflow-y-auto">
          <div class="bg-[#EEEDED] rounded-3xl shadow-lg p-8">
            <h1 class="text-3xl font-extrabold text-[#000000] mb-2">
              {{ trip?.trip_name || tripPlan?.tripName || "My Trip" }}
            </h1>
            <p class="text-[#000000] text-sm mb-6">
              Your personalized travel itinerary.
            </p>

            <div
              class="flex flex-col md:flex-row items-stretch md:items-center justify-between mb-6 gap-4 md:gap-0"
            >
              <div class="flex border-b border-gray-500">
                <button
                  @click="activeTab = 'plan'"
                  :class="[
                    'px-4 py-2 text-base md:px-6 md:text-lg font-bold',
                    activeTab === 'plan'
                      ? 'text-[#0D1282] border-b-3 border-[#0D1282]'
                      : 'text-[#000000] hover:text-[#D71313] transition',
                  ]"
                >
                  Trip Plan
                </button>
                <button
                  @click="activeTab = 'nearby'"
                  :class="[
                    'px-4 py-2 text-base md:px-6 md:text-lg font-bold',
                    activeTab === 'nearby'
                      ? 'text-[#0D1282] border-b-3 border-[#0D1282]'
                      : 'text-[#000000] hover:text-[#D71313] transition',
                  ]"
                >
                  Nearby Places
                </button>
                <button
                  @click="activeTab = 'search'"
                  :class="[
                    'px-4 py-2 text-base md:px-6 md:text-lg font-bold',
                    activeTab === 'search'
                      ? 'text-[#0D1282] border-b-3 border-[#0D1282]'
                      : 'text-[#000000] hover:text-[#D71313] transition',
                  ]"
                >
                  Search Places
                </button>
              </div>

              <button
                @click="goToPage(`/expense/${tripId}`)"
                class="flex items-center justify-center gap-2 bg-[#D71313] hover:bg-red-600 text-white text-sm font-medium p-2 md:px-4 rounded-full transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                  />
                </svg>
                Expense
              </button>
            </div>

            <div v-show="activeTab === 'plan'">
              <div
                class="mb-6 flex justify-end gap-2 md:gap-4"
                v-if="!trip?.tripId || trip?.role === 'leader'"
              >
                <!-- Cancel Trip (เทา) -->
                <div
                  class="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 group"
                >
                  <div
                    class="absolute bottom-full mb-2 px-3 py-1 rounded-md bg-gray-800 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  >
                    Cancel Trip
                  </div>
                  <button
                    @click="cancelTrip"
                    class="flex items-center justify-center w-full h-full bg-gray-400 hover:bg-gray-500 text-white font-semibold rounded-full shadow transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-6 h-6"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                  </button>
                </div>

                <!-- Modify Trip (เหลือง) -->
                <div
                  class="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 group"
                >
                  <div
                    class="absolute bottom-full mb-2 px-3 py-1 rounded-md bg-gray-800 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  >
                    Modify Trip
                  </div>
                  <button
                    @click="modifyTrip"
                    class="flex items-center justify-center w-full h-full bg-[#F0DE36] hover:bg-yellow-400 text-[#0D1282] font-semibold rounded-full shadow transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-5 h-5 md:w-6 md:h-6"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                      />
                    </svg>
                  </button>
                </div>

                <!-- Save Trip (น้ำเงินเข้ม) -->
                <div
                  class="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 group"
                >
                  <div
                    class="absolute bottom-full mb-2 px-3 py-1 rounded-md bg-gray-800 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  >
                    Save Trip
                  </div>
                  <button
                    @click="saveTrip"
                    :disabled="isSavingTrip"
                    class="flex items-center justify-center w-full h-full bg-[#0D1282] hover:bg-blue-800 text-white font-semibold rounded-full shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-5 h-5 md:w-6 md:h-6"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3"
                      />
                    </svg>
                  </button>
                </div>

                <!-- Generate Invite Link (แดง) -->
                <div
                  class="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 group"
                >
                  <div
                    class="absolute bottom-full mb-2 px-3 py-1 rounded-md bg-gray-800 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  >
                    Generate Invite Link
                  </div>
                  <button
                    @click="generateInviteLink"
                    class="flex items-center justify-center w-full h-full bg-[#D71313] hover:bg-red-600 text-white font-semibold rounded-full shadow transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-5 h-5 md:w-6 md:h-6"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div v-if="inviteLink" class="text-right text-sm mt-6 p-4">
                <p class="text-gray-600 font-semibold mb-1">
                  Share this link with your friends:
                </p>
                <div class="relative flex items-center">
                  <input
                    class="w-full border border-gray-300 rounded-full pl-4 pr-12 py-3 text-sm text-gray-500 shadow-sm focus:ring-2 focus:ring-emerald-200 outline-none cursor-pointer bg-white"
                    :value="inviteLink"
                    readonly
                    @click="copyToClipboard"
                  />
                  <button
                    @click="copyToClipboard"
                    class="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-100 text-emerald-600 p-2 rounded-full hover:bg-emerald-200 transition"
                    title="Copy to clipboard"
                  >
                    <i class="fa-solid fa-copy"></i>
                  </button>
                </div>
              </div>

              <div
                class="mb-8 bg-white border-b border-gray-200 p-6 md:p-8 rounded-md shadow-sm w-full max-w-full"
              >
                <h2 class="text-xl md:text-2xl font-bold text-[#0D1282] mb-4">
                  <i class="fa-solid fa-plane-departure mr-2"></i>
                  Transportation
                </h2>
                <div
                  class="static rounded-xl shadow-lg overflow-hidden h-64 w-full md:fixed md:top-10 md:right-10 md:left-auto md:w-[600px] md:h-[90vh] md:block"
                  style="min-height: 300px"
                >
                  <Tripmap :locations="allLocations" />
                </div>
                <div class="w-full overflow-x-hidden">
                  <table
                    class="w-full table-fixed border-collapse text-sm md:text-base"
                  >
                    <thead>
                      <tr
                        class="bg-[#F0DE36] text-[#0D1282] font-bold tracking-wide"
                      >
                        <th class="p-1 sm:p-2 md:p-3 rounded-tl-xl"></th>
                        <th class="p-1 sm:p-2 md:p-3 text-center">🚗 Car</th>
                        <th class="p-1 sm:p-2 md:p-3 text-center">🚌 Bus</th>
                        <th class="p-1 sm:p-2 md:p-3 text-center">🚆 Train</th>
                        <th class="p-1 sm:p-2 md:p-3 text-center rounded-tr-xl">
                          ✈️ Flight
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="border-b border-gray-200 bg-white">
                        <td class="p-1 sm:p-2 md:p-3 text-gray-700 font-medium">
                          Distance
                        </td>
                        <td class="p-1 sm:p-2 md:p-3 text-center">
                          {{ transportInfo.car?.distance || "-" }}
                        </td>
                        <td class="p-1 sm:p-2 md:p-3 text-center">
                          {{ transportInfo.bus?.distance || "-" }}
                        </td>
                        <td class="p-1 sm:p-2 md:p-3 text-center">
                          {{ transportInfo.train?.distance || "-" }}
                        </td>
                        <td class="p-1 sm:p-2 md:p-3 text-center">
                          {{ transportInfo.flight?.distance || "-" }}
                        </td>
                      </tr>
                      <tr class="bg-[#EEEDED]">
                        <td class="p-1 sm:p-2 md:p-3 text-gray-700 font-medium">
                          Duration
                        </td>
                        <td class="p-1 sm:p-2 md:p-3 text-center">
                          {{ transportInfo.car?.duration || "-" }}
                        </td>
                        <td class="p-1 sm:p-2 md:p-3 text-center">
                          {{ transportInfo.bus?.duration || "-" }}
                        </td>
                        <td class="p-1 sm:p-2 md:p-3 text-center">
                          {{ transportInfo.train?.duration || "-" }}
                        </td>
                        <td class="p-1 sm:p-2 md:p-3 text-center">
                          {{ transportInfo.flight?.duration || "-" }}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <p
                    class="mt-2 sm:mt-4 text-gray-700 text-xs sm:text-sm md:text-base"
                  >
                    How to get there:
                    {{ transportInfo?.how_to_get_there || "N/A" }}
                  </p>
                </div>
              </div>

              <div
                v-for="(day, index) in tripPlan.days"
                :key="day.id || index"
                class="mb-8 bg-white/95 p-6 rounded-2xl shadow-lg border border-[#EEEDED]"
              >
                <!-- Header -->
                <h2
                  class="text-xl md:text-2xl font-bold text-[#0D1282] mb-4 flex items-center"
                >
                  <span
                    class="bg-[#D71313] text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mr-2"
                  >
                    {{ index + 1 }}
                  </span>
                  Day {{ index + 1 }}: {{ day.title }}
                </h2>
                <p class="text-gray-500 mb-4 text-sm">
                  {{
                    new Date(day.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  }}
                </p>
                <p class="text-gray-700 mb-6 text-sm">
                  {{ day.description || day.narrative || "No description." }}
                </p>

                <!-- ✅ Desktop Table -->
                <div class="hidden md:block">
                  <div
                    class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-3 bg-[#F0DE36] text-[#0D1282] font-semibold text-sm rounded-t-lg"
                  >
                    <div>Destination</div>
                    <div class="text-center">Category</div>
                    <div class="text-center">Transport</div>
                    <div class="text-center">Expense</div>
                    <div class="text-center">Distance</div>
                    <div class="text-center"></div>
                  </div>

                  <draggable
                    v-model="day.locations"
                    :group="'locations'"
                    item-key="name"
                    :disabled="!showEditControls"
                    class="space-y-2"
                    @change="recalculateCosts"
                  >
                    <template #item="{ element: loc, index: i }">
                      <div
                        class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-3 bg-white border-b border-gray-200 text-sm items-center hover:bg-[#EEEDED] transition rounded-md shadow-sm cursor-grab"
                      >
                        <div class="font-medium text-gray-800">
                          <i class="fa-solid fa-map-pin text-[#0D1282] mr-2"></i
                          >{{ loc.name }}
                        </div>
                        <div class="text-center text-gray-600">
                          {{ loc.category || "N/A" }}
                        </div>
                        <div class="text-center text-gray-600">
                          {{ loc.transport || "N/A" }}
                        </div>
                        <div class="text-center text-[#D71313] font-medium">
                          {{ loc.estimated_cost || 0 }}
                          {{ loc.currency || tripPlan.currency || "THB" }}
                        </div>
                        <div class="text-center text-gray-600">
                          {{ loc.distance_to_next || "N/A" }}
                        </div>
                        <div class="text-center" v-if="showEditControls">
                          <button
                            @click="removeLocation(index, i)"
                            class="text-red-500 hover:text-red-700 transition"
                            title="Delete location"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke-width="1.5"
                              stroke="currentColor"
                              class="w-4 h-4 sm:w-6 sm:h-6"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </template>
                  </draggable>
                </div>

                <!-- ✅ Mobile Card -->
                <div class="md:hidden mt-4 space-y-4">
                  <draggable
                    v-model="day.locations"
                    :group="'locations'"
                    item-key="name"
                    :disabled="!showEditControls"
                  >
                    <template #item="{ element: loc, index: i }">
                      <div
                        class="bg-white p-4 rounded-xl shadow border hover:bg-gray-50 transition cursor-grab"
                      >
                        <div class="flex items-center mb-2">
                          <i
                            class="fa-solid fa-map-pin text-[#0D1282] mr-2"
                          ></i>
                          <p class="font-bold text-[#0D1282]">{{ loc.name }}</p>
                        </div>
                        <p class="text-sm text-gray-600">
                          <span class="font-semibold">Category:</span>
                          {{ loc.category || "N/A" }}
                        </p>
                        <p class="text-sm text-gray-600">
                          <span class="font-semibold">Transport:</span>
                          {{ loc.transport || "N/A" }}
                        </p>
                        <p class="text-sm text-[#D71313] font-medium">
                          <span class="font-semibold">Expense:</span>
                          {{ loc.estimated_cost || 0 }}
                          {{ loc.currency || tripPlan.currency || "THB" }}
                        </p>
                        <p class="text-sm text-gray-600">
                          <span class="font-semibold">Distance:</span>
                          {{ loc.distance_to_next || "N/A" }}
                        </p>
                        <div class="mt-3 text-right" v-if="showEditControls">
                          <button
                            @click="removeLocation(index, i)"
                            class="text-red-500 hover:text-red-700 transition"
                            title="Delete location"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke-width="1.5"
                              stroke="currentColor"
                              class="w-4 h-4 sm:w-6 sm:h-6"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </template>
                  </draggable>
                </div>

                <!-- Footer -->
                <div class="mt-4 text-sm text-gray-700">
                  <p
                    v-if="day.daily_tips && day.daily_tips.length > 0"
                    class="mb-1"
                  >
                    💡 <span class="font-medium">Tips:</span>
                    {{ day.daily_tips.join(", ") }}
                  </p>
                  <p class="font-semibold text-right text-[#0D1282] text-lg">
                    💰 Day Total: {{ day.total_day_cost || 0 }}
                    {{ tripPlan.currency || "THB" }}
                  </p>
                </div>
              </div>
              <div
                class="flex items-center justify-between p-6 bg-[#FFFFFF] rounded-3xl text-[#0D1282] relative overflow-hidden">
                <svg class="absolute top-0 right-0 h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none"
                  fill="none">
                  <circle cx="90" cy="10" r="30" fill="currentColor" />
                  <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                </svg>

                <div class="z-10 flex flex-col">
                  <span class="text-lg font-medium">Total Trip Cost</span>
                  <span class="text-4xl font-extrabold mt-1">
                    {{ tripPlan.total_trip_cost || 0 }}
                    <span class="text-xl font-normal">{{
                      tripPlan.currency || "THB"
                    }}</span>
                  </span>
                </div>

                <div class="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                    stroke="currentColor" class="w-8 h-8 text-[#0D1282]">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
                  </svg>
                </div>
              </div>
            </div>

            <div v-show="activeTab === 'nearby'">
              <div class="flex flex-wrap gap-2 mb-6">
                <button
                  v-for="(day, index) in tripPlan.days"
                  :key="index"
                  @click="selectedDayIndex = index"
                  :class="[
                    'px-4 py-2 rounded-full font-medium text-sm transition-all',
                    selectedDayIndex === index
                      ? 'bg-[#F0DE36] text-[#0D1282] shadow-md'
                      : 'bg-[#0D1282] text-[#EEEDED] hover:bg-[#F0DE36]',
                  ]"
                >
                  Day {{ index + 1 }}
                </button>
              </div>

              <div class="mb-4 flex items-center gap-4">
                <label for="nearbyCategory" class="font-medium text-[#000000]"
                  >Category:</label
                >
                <select
                  id="nearbyCategory"
                  v-model="selectedCategory"
                  class="flex-1 py-2 px-4 border border-gray-300 rounded-full bg-white shadow-sm focus:ring-2 focus:ring-sky-200 outline-none"
                >
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Cafe</option>
                  <option value="hotel">Hotel</option>
                  <option value="attraction">Attraction</option>
                  <option value="park">Park</option>
                  <option value="shopping_mall">Shopping Mall</option>
                </select>
              </div>
              <div v-if="tripPlan.days?.[selectedDayIndex]" class="mb-4">
                <h3 class="text-xl font-bold text-[#000000]">
                  Nearby Places for Day {{ selectedDayIndex + 1 }}
                </h3>
                <p class="text-sm text-[#000000]">
                  {{ tripPlan.days[selectedDayIndex]?.title || "Untitled Day" }}
                </p>
              </div>

              <div v-if="loadingNearby" class="text-center text-gray-500 p-8">
                <div
                  class="animate-spin rounded-full h-8 w-8 border-4 border-t-[#0D1282] border-blue-200 mb-4 mx-auto"
                ></div>
                Searching for nearby places...
              </div>
              <ul v-else-if="nearbyPlaces.length" class="space-y-4">
                <li
                  v-for="place in nearbyPlaces"
                  :key="place.place_id"
                  class="bg-white/95 p-4 rounded-xl flex items-center justify-between shadow-sm"
                >
                  <div>
                    <p class="font-semibold text-gray-800">{{ place.name }}</p>
                    <p class="text-sm text-gray-500">{{ place.address }}</p>
                  </div>
                  <button
                    @click="addNearbyPlace(place)"
                    class="flex items-center gap-1 bg-[#D71313] hover:bg-red-600 text-white p-2 rounded-full shadow transition-all duration-200 text-sm"
                  >
                    <span>Add</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-5 h-5"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                  </button>
                </li>
              </ul>
              <div v-else class="text-center text-gray-500 p-8">
                No nearby places found for today.
              </div>
            </div>
            <div v-if="activeTab === 'search'">
              <div class="mb-4 flex gap-2">
                <input
                  v-model="searchQuery"
                  placeholder="Search places..."
                  class="flex-1 py-2 px-4 border border-gray-300 rounded-full bg-white shadow-sm focus:ring-2 focus:ring-sky-200 outline-none"
                />
                <button
                  @click="searchPlaces"
                  class="bg-[#0D1282] text-white px-4 py-2 rounded-lg hover:bg-blue-800"
                >
                  Search
                </button>
              </div>

              <div v-if="loadingSearch" class="text-center py-4 text-gray-500">
                <i class="fa-solid fa-spinner fa-spin mr-2"></i> Searching...
              </div>

              <div v-else>
                <ul v-if="searchResults.length > 0" class="space-y-3">
                  <li
                    v-for="place in searchResults"
                    :key="place.place_id"
                    class="bg-white shadow rounded-lg p-3 flex justify-between items-center"
                  >
                    <div>
                      <p class="font-bold text-[#0D1282]">{{ place.name }}</p>
                      <p class="text-sm text-gray-500">{{ place.address }}</p>
                      <p v-if="place.rating" class="text-yellow-600 text-sm">
                        ⭐ {{ place.rating }}
                      </p>
                    </div>
                    <button
                      @click="addNearbyPlace(place)"
                      class="flex items-center gap-1 bg-[#D71313] hover:bg-red-600 text-white p-2 rounded-full shadow transition-all duration-200 text-sm"
                    >
                      <span>Add</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-5 h-5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                      </svg>
                    </button>
                  </li>
                </ul>
                <p v-else class="text-gray-500 text-center py-6">
                  No results found.
                </p>
              </div>
            </div>
            <!-- <div
              class="static rounded-xl shadow-lg overflow-hidden  h-64 w-full md:fixed md:top-10 md:right-10 md:left-auto md:w-[600px] md:h-[90vh] md:block"
              style="min-height: 300px;">
              <Tripmap :locations="allLocations" />
            </div> -->
          </div>
        </div>
      </div>
      <div
        v-else
        class="flex-1 flex justify-center items-center text-gray-500 bg-white"
      >
        <div class="text-center">
          <div
            class="animate-spin rounded-full h-12 w-12 border-4 border-t-sky-500 border-sky-200 mb-4 mx-auto"
          ></div>
          <p class="text-lg">กำลังโหลดแผนการเดินทาง...</p>
        </div>
      </div>
    </main>

    <div
      v-if="loadError"
      class="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-50"
    >
      <div class="bg-white p-8 rounded-lg shadow-xl text-center">
        <h2 class="text-2xl font-bold text-red-600 mb-4">
          <i class="fa-solid fa-triangle-exclamation mr-2"></i> {{ title }}
        </h2>
        <p class="text-gray-700">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-kanit {
  font-family: "Kanit", sans-serif;
}
</style>
