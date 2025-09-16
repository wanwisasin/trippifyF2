<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import Swal from "sweetalert2";
import Header from "./Header.vue";
import draggable from "vuedraggable";

const route = useRoute();
const user = ref(null);
const tripId = route.params.tripId;
const tripPlan = ref(null);
const tripName = computed(() => tripPlan.value?.trip_name || "My Trip");

const reviews = ref([]); // เก็บรีวิวใน state
const loading = ref(false);
const error = ref(null);

const submitting = ref(false);
const showEditControls = ref(false); // สำหรับ draggable
const newReviewName = ref("");
// const newReviewEmail = ref("")
const newReviewComment = ref("");
const newReviewRating = ref(0); // ⭐ เก็บค่าดาว
const hoverRating = ref(0);
const expandedDays = ref({}); // เก็บสถานะ dropdown ของแต่ละ day
const allExpanded = ref(false); // สถานะ Expand/Collapse All

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

// โหลดแผนทริปจาก backend ได้ตามปกติ
const fetchTripPlan = async () => {
  try {
    const res = await axios.get(`http://localhost:5000/api/trip/${tripId}`, {
      withCredentials: true,
    });
    tripPlan.value = res.data;
  } catch (err) {
    error.value = err.response?.data?.message || "ไม่สามารถโหลดทริปได้";
  }
};
const fetchReviews = async () => {
  try {
    const res = await axios.get(`http://localhost:5000/api/reviews/${tripId}`);
    reviews.value = res.data;
  } catch (err) {
    console.error("โหลดรีวิวล้มเหลว:", err);
  }
};
// toggle แต่ละวัน
const toggleDay = (index) => {
  expandedDays.value[index] = !expandedDays.value[index];
};

// toggle ทุกวัน
const toggleAllDays = () => {
  allExpanded.value = !allExpanded.value;
  tripPlan.value?.days.forEach((_, index) => {
    expandedDays.value[index] = allExpanded.value;
  });
};

const averageRating = computed(() => {
  if (reviews.value.length === 0) return 0;
  const sum = reviews.value.reduce((acc, r) => acc + (r.rating || 0), 0);
  return (sum / reviews.value.length).toFixed(1);
});

const getRatingPercentage = (rating) => {
  if (reviews.value.length === 0) return "0%";
  const count = reviews.value.filter((r) => r.rating === rating).length;
  return Math.round((count / reviews.value.length) * 100) + "%";
};

// ✅ ส่งรีวิวใหม่ (เก็บใน state อย่างเดียว ไม่เรียก backend)
const submitReview = async () => {
  if (!newReviewRating.value) {
    Swal.fire({
      icon: "warning",
      title: "Please give a star rating",
      text: "You must select at least 1 star before submitting your review",
    });
    return;
  }
  if (!newReviewComment.value.trim()) {
    Swal.fire({
      icon: "warning",
      title: "Please enter your comment",
      text: "Don’t forget to write a review comment before submitting",
    });
    return;
  }

  submitting.value = true;

  try {
    const res = await axios.post(
      `http://localhost:5000/api/reviews/${tripId}`,
      {
        user_name: newReviewName.value || "Anonymous User",
        rating: newReviewRating.value,
        comment: newReviewComment.value,
      }
    );

    reviews.value.unshift(res.data);

    newReviewName.value = "";
    // newReviewEmail.value = "";
    newReviewComment.value = "";
    newReviewRating.value = 0;

    Swal.fire({
      icon: "success",
      title: "Review submitted successfully",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Failed to submit review",
      text: err.response?.data?.error || "Please try again",
    });
  } finally {
    submitting.value = false;
  }
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

onMounted(() => {
  getUser();
  fetchTripPlan();
  fetchReviews();
});
</script>

<template>
  <div class="min-h-screen bg-[#FFFFFF]">
    <Header :user="user" @update:user="user = $event" />

    <div class="max-w-5xl mx-auto py-10 px-4 space-y-8">
      <div v-if="tripPlan">
        <h1
          class="text-2xl font-bold text-[#0D1282] pt-6 mb-6 text-center sm:text-left"
        >
          {{ tripName || "Unnamed Trip" }}
        </h1>
        <!-- Trip Days Expand/Collapse All -->
        <div class="flex justify-end mb-4">
          <button
            @click="toggleAllDays"
            class="bg-[#0D1282] text-[#FFFFFF] font-semibold px-4 py-2 rounded-lg transition"
          >
            {{ allExpanded ? "Collapse All" : "Expand All" }}
          </button>
        </div>
        <div
          v-for="(day, index) in tripPlan.days"
          :key="index"
          class="mb-4 bg-white/95 rounded-2xl shadow-lg border border-[#EEEDED]"
        >
          <!-- หัวข้อ Day -->
          <button
            @click="toggleDay(index)"
            class="w-full px-6 py-4 text-left flex justify-between items-center text-xl font-bold text-[#0D1282] rounded-t-2xl"
          >
            <span>
              <span
                class="bg-[#D71313] text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mr-2"
              >
                {{ index + 1 }}
              </span>
              Day {{ index + 1 }}: {{ day.title }}
            </span>
            <span>
              <i
                :class="
                  expandedDays[index]
                    ? 'fas fa-chevron-up'
                    : 'fas fa-chevron-down'
                "
              ></i>
            </span>
          </button>

          <!-- เนื้อหา Expand/Collapse -->
          <div v-show="expandedDays[index]" class="px-6 pb-4">
            <p class="text-gray-500">{{ day.date }}</p>
            <p>{{ day.description || day.narrative || "No description." }}</p>

            <!-- ✅ Desktop Table -->
            <div class="hidden md:block mt-4">
              <div
                class="grid grid-cols-7 gap-2 px-4 py-3 bg-[#F0DE36] text-[#0D1282] font-semibold text-sm rounded-t-lg"
              >
                <div class="col-span-2">Destination</div>
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
              >
                <template #item="{ element: loc, index: i }">
                  <div
                    class="grid grid-cols-7 gap-2 px-4 py-3 bg-white border-b border-gray-200 text-sm items-center hover:bg-[#EEEDED] transition rounded-md shadow-sm cursor-grab"
                  >
                    <div class="col-span-2 font-medium text-gray-800">
                      <i class="fa-solid fa-map-pin text-[#0D1282] mr-2"></i>
                      {{ loc.name }}
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
                        @click="day.locations.splice(i, 1)"
                        class="text-red-500 hover:text-red-700"
                      >
                        ลบ
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
                      <i class="fa-solid fa-map-pin text-[#0D1282] mr-2"></i>
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
                        @click="day.locations.splice(i, 1)"
                        class="text-red-500 hover:text-red-700 text-sm"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </template>
              </draggable>
            </div>
          </div>
        </div>
      </div>
      <!-- Trip Reviews -->
      <div>
        <h2 class="text-3xl font-extrabold text-[#0D1282] mb-8">
          Trip Reviews
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div
            class="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 transition-transform duration-300 hover:-translate-y-1"
          >
            <h3 class="text-xl font-bold mb-4 text-[#0D1282]">
              Average Rating
            </h3>
            <div class="flex items-end mb-6">
              <span
                class="text-6xl font-extrabold text-[#D71313] leading-none"
                >{{ averageRating }}</span
              >
              <div class="ml-4 flex items-center space-x-1">
                <i
                  v-for="i in 5"
                  :key="i"
                  class="fa-star text-3xl"
                  :class="
                    i <= Math.round(averageRating)
                      ? 'fas text-[#F0DE36]'
                      : 'far text-gray-300'
                  "
                ></i>
              </div>
            </div>
            <div v-for="n in 5" :key="n" class="flex items-center text-sm mb-2">
              <span class="w-6 font-semibold text-gray-700">{{ 6 - n }}</span>
              <div class="flex-1 mx-3 bg-gray-200 rounded-full h-3">
                <div
                  class="bg-[#F0DE36] h-3 rounded-full transition-all duration-500 ease-out"
                  :style="{ width: getRatingPercentage(6 - n) }"
                ></div>
              </div>
              <span class="w-10 text-right font-medium text-[#0D1282]">{{
                getRatingPercentage(6 - n)
              }}</span>
            </div>
          </div>

          <div
            class="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 transition-transform duration-300 hover:-translate-y-1"
          >
            <h3 class="text-xl font-bold mb-4 text-[#0D1282]">
              Write Your Review
            </h3>
            <p class="text-gray-600 mb-6">
              Share your experience and help other travelers!
            </p>

            <div class="flex items-center mb-6">
              <span class="text-lg mr-4 font-semibold text-gray-700"
                >Rating :</span
              >
              <div class="flex space-x-2">
                <i
                  v-for="i in 5"
                  :key="i"
                  class="fa-star cursor-pointer text-4xl transition-colors duration-200"
                  :class="
                    i <= (hoverRating || newReviewRating)
                      ? 'fas text-[#F0DE36]'
                      : 'far text-gray-300'
                  "
                  @mouseover="hoverRating = i"
                  @mouseleave="hoverRating = 0"
                  @click="newReviewRating = i"
                ></i>
              </div>
            </div>

            <input
              v-model="newReviewName"
              type="text"
              placeholder="Your Name (optional)"
              class="border border-gray-200 rounded-xl px-4 py-3 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-[#F0DE36] transition"
            />
            <textarea
              v-model="newReviewComment"
              placeholder="Write your review here..."
              class="w-full h-32 border border-gray-200 rounded-xl p-4 text-gray-700 focus:ring-2 focus:ring-[#F0DE36] outline-none mb-6 transition"
            />

            <button
              @click="submitReview"
              :disabled="submitting"
              class="w-full bg-[#D71313] text-white font-bold text-lg py-4 rounded-xl hover:bg-[#B70F11] disabled:opacity-50 transition-colors transform hover:scale-105"
            >
              {{ submitting ? "Submitting..." : "Submit Review" }}
            </button>
          </div>
        </div>

        <div class="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
          <h3 class="text-2xl font-bold mb-6 text-[#0D1282]">
            Customer Comments
          </h3>
          <div
            v-if="reviews.length > 0"
            class="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar"
          >
            <div
              v-for="review in reviews"
              :key="review.id"
              class="bg-gray-50 p-6 rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-100 transition-colors"
            >
              <div class="flex items-start mb-2">
                <div
                  class="w-12 h-12 rounded-full bg-gradient-to-br from-[#0D1282] to-[#D71313] flex items-center justify-center text-white font-bold text-xl mr-4 flex-shrink-0"
                >
                  {{ review.user_name ? review.user_name.charAt(0) : "A" }}
                </div>
                <div class="flex flex-col">
                  <h4 class="font-semibold text-lg text-gray-800">
                    {{ review.user_name || "Anonymous User" }}
                  </h4>
                  <div class="flex mt-1">
                    <i
                      v-for="i in 5"
                      :key="i"
                      class="fa-star text-base"
                      :class="
                        i <= review.rating
                          ? 'fas text-[#F0DE36]'
                          : 'far text-gray-300'
                      "
                    ></i>
                  </div>
                </div>
              </div>
              <p class="text-gray-700 leading-relaxed mt-4">
                {{ review.comment }}
              </p>
              <span class="block mt-4 text-right text-xs text-gray-500">{{
                formatDate(review.createdAt)
              }}</span>
            </div>
          </div>
          <div v-else class="text-gray-500 text-center py-10">
            <p>No reviews yet for this trip.</p>
            <p class="mt-2">Be the first to share your experience!</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
textarea {
  resize: none;
}
</style>
