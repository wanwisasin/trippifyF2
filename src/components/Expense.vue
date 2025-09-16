<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import Swal from "sweetalert2";
import Header from "./Header.vue";
import { useStore } from "vuex";

const route = useRoute();
const router = useRouter();
const store = useStore();

const isMobileMenuOpen = ref(false);
const showMobileSummary = ref(false);
const user = ref(null);
const showExpenseModal = ref(false);
const showCategoryModal = ref(false);
const activeTab = ref("expenses");
const trip = ref(null);
const tripId = route.params.tripId;
const selectedDate = ref(new Date().toISOString().split("T")[0]);
const dateInput = ref(null);
const selectedCategory = ref("");
const categories = ["Sleep", "Transport", "See & Do", "Eat & Drink", "Other"];
const amount = ref("");
const selectedCurrency = ref("THB");
const currencies = ["THB", "USD"];
const isPaid = ref(false);
const note = ref("");
const paidBy = ref("");
const splitWith = ref([]);
const editingIndex = ref(null);

const participants = ref([]);

const currentUserEmail = ref("");
paidBy.value = currentUserEmail.value;
const tripLeader = computed(() => {
  return participants.value.find(p => p.role === "leader")?.gmail || "";
});
const expenses = ref([]);

// ---------------- User ----------------
const getUser = async () => {
  try {
    const res = await axios.get("http://localhost:5000/auth/user", {
      withCredentials: true,
    });
    user.value = res.data;
    console.log("User data:", user.value);
  } catch (err) {
    user.value = null;
  }
};

// ---------------- Load Expenses ----------------
const loadExpenses = async () => {
  if (!tripId) return;
  try {
    const res = await axios.get(`http://localhost:5000/api/expense/${tripId}`, {
      withCredentials: true,
    });
    expenses.value = res.data.map(e => ({
      ...e,
      amount: parseFloat(e.amount) || 0,
      isPaid: e.isPaid === 1 || e.isPaid === '1' || e.isPaid === true || e.isPaid === 'true',
      splitWith: Array.isArray(e.splitWith) ? e.splitWith : JSON.parse(e.splitWith || "[]")
    }));
  } catch (err) {
    console.error("Error loading expenses:", err);
  }
};
const loadTrip = async () => {
  try {
    const res = await axios.get(`http://localhost:5000/api/trip/${tripId}`, {
      withCredentials: true,
    });
    trip.value = res.data;
    participants.value = trip.value.members || [];
    currentUserEmail.value = store.state.user?.gmail || "";
    paidBy.value = currentUserEmail.value;
  } catch (err) {
    console.error(err);
  }
};
// ---------------- Save Expense ----------------
const saveExpense = async () => {
  const newExpense = {
    date: selectedDate.value,
    category: selectedCategory.value,
    amount: parseFloat(amount.value),
    paidBy: paidBy.value,
    note: note.value,
    isPaid: isPaid.value ? 1 : 0,
    currency: selectedCurrency.value,
    splitWith: splitWith.value,
  };

  try {
    if (editingIndex.value !== null) {
      const expenseId = expenses.value[editingIndex.value].expense_id;
      await axios.put(`http://localhost:5000/api/expense/${expenseId}`, newExpense, {
        withCredentials: true,
      });
    } else {
      await axios.post(`http://localhost:5000/api/expense/${tripId}`, newExpense, {
        withCredentials: true,
      });
    }

    await loadExpenses();
    resetForm();
    closeExpenseModal();

    Swal.fire({
      icon: "success",
      title: "Saved",
      text: "Expense saved successfully!",
      confirmButtonText: "OK",
      confirmButtonColor: "#0ea5e9",
    });
  } catch (err) {
    console.error("saveExpense error:", err);
    Swal.fire("Error", "Failed to save expense", "error");
  }
};

// ---------------- Delete Expense ----------------
const deleteExpense = async (index) => {
  const expenseId = expenses.value[index].expense_id;
  const confirm = await Swal.fire({
    icon: "warning",
    title: "Are you sure?",
    text: "This expense will be deleted.",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it",
    confirmButtonColor: "#ef4444",
  });

  if (confirm.isConfirmed) {
    try {
      await axios.delete(`http://localhost:5000/api/expense/${expenseId}`, {
        withCredentials: true,
      });
      await loadExpenses();
      Swal.fire("Deleted!", "Your expense has been removed.", "success");
    } catch (err) {
      console.error("deleteExpense error:", err);
      Swal.fire("Error", "Failed to delete expense", "error");
    }
  }
};

// ---------------- Edit Expense ----------------
const editExpense = (index) => {
  const expense = expenses.value[index];
  selectedCategory.value = expense.category;
  amount.value = expense.amount;
  selectedCurrency.value = expense.currency;
  note.value = expense.note;
  isPaid.value = !!expense.isPaid;
  paidBy.value = participants.value.find(p => p.gmail === expense.paidBy)?.gmail || currentUserEmail.value;
  splitWith.value = Array.isArray(expense.splitWith) ? expense.splitWith : JSON.parse(expense.splitWith || "[]");
  editingIndex.value = index;
  showExpenseModal.value = true;
};

// ---------------- Reset Form ----------------
const resetForm = () => {
  amount.value = "";
  selectedCategory.value = "";
  note.value = "";
  isPaid.value = false;
  selectedCurrency.value = "THB";
  paidBy.value = currentUserEmail.value;
  splitWith.value = [];
  editingIndex.value = null;
};

// ---------------- Computed ----------------
const totalCost = computed(() => expenses.value.reduce((sum, e) => sum + (e.amount || 0), 0));
const pendingCost = computed(() => expenses.value.filter(e => !e.isPaid).reduce((sum, e) => sum + (e.amount || 0), 0));
const paidPercentage = computed(() => (totalCost.value ? ((totalCost.value - pendingCost.value) / totalCost.value) * 100 : 0));
const pendingPercentage = computed(() => (totalCost.value ? (pendingCost.value / totalCost.value) * 100 : 0));

const categoryTotals = computed(() => {
  const totals = {};
  categories.forEach(cat => totals[cat] = 0);
  expenses.value.forEach(e => {
    if (totals[e.category] !== undefined) totals[e.category] += e.amount || 0;
  });
  return totals;
});

const balances = computed(() => {
  const result = {};
  participants.value.forEach(p => result[p.gmail] = { paid: 0, share: 0 });
  expenses.value.forEach(exp => {
    const peopleToSplit = exp.splitWith && exp.splitWith.length ? exp.splitWith : participants.value.map(p => p.gmail);
    const share = exp.amount / peopleToSplit.length;
    if (result[exp.paidBy]) result[exp.paidBy].paid += exp.amount;
    peopleToSplit.forEach(gmail => { if (result[gmail]) result[gmail].share += share; });
  });
  return result;
});

// ---------------- Modal & Helpers ----------------
const openExpenseModalForAdd = () => {
  resetForm();
  showExpenseModal.value = true;
  isMobileMenuOpen.value = false;
};
const closeExpenseModal = () => {
  showExpenseModal.value = false;
  resetForm();
};
const openDatePicker = () => dateInput.value?.showPicker?.() || dateInput.value?.click();
const getCategoryIcon = (category) => {
  switch (category) {
    case "Sleep": return "fa-bed";
    case "Transport": return "fa-car";
    case "See & Do": return "fa-camera";
    case "Eat & Drink": return "fa-utensils";
    default: return "fa-ellipsis";
  }
};
const getParticipantName = (gmail) => participants.value.find(p => p.gmail === gmail)?.username || gmail;

// ---------------- Lifecycle ----------------
onMounted(() => {
  getUser();
  if (tripId) loadExpenses();
  loadTrip();
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#EEEDED] text-gray-800 font-kanit">
    <Header :user="user" @update:user="user = $event" />

    <div class="flex flex-1 min-h-screen bg-[#EEEDED] sm:ml-48 md:ml-48">
      <aside class="hidden sm:block sm:w-64 md:w-72 bg-[#FFFFFF] p-6 shadow-xl flex flex-col justify-between text-white relative z-20">
        <div>
          <h2 class="text-2xl font-extrabold text-[#0D1282] mb-4">Budget</h2>
          <div class="space-y-2">
            <button class="w-full text-left rounded-xl p-3 flex items-center gap-3 transition-colors" :class="{
              'bg-[#F0DE36] text-[#0D1282] font-bold': activeTab === 'expenses',
              'text-[#0D1282] hover:text-[#D71313]/90 transition font-bold': activeTab !== 'expenses',
            }" @click="activeTab = 'expenses'">
              <span>🧾</span><span class="text-sm">Expenses</span>
            </button>
            <button class="w-full text-left rounded-xl p-3 flex items-center gap-3 transition-colors" :class="{
              'bg-[#F0DE36] text-[#0D1282] font-bold hover:bg-[#F0DE36]': activeTab === 'balance',
              'text-[#0D1282] hover:text-[#D71313]/90 transition font-bold': activeTab !== 'balance',
            }" @click="activeTab = 'balance'">
              <span>⚖️</span><span class="text-sm">Balance</span>
            </button>
          </div>

          <button @click="openExpenseModalForAdd" v-if="trip && trip.role === 'leader'"
            class="mt-8 w-full bg-[#F0DE36] hover:bg-yellow-400 text-[#0D1282] font-bold py-3 px-4 rounded-full shadow-md transition">
            <i class="fa-solid fa-plus-circle mr-2"></i> Add expense
          </button>

          <div class="mt-8 p-4 bg-[#EEEDED] rounded-xl text-sm text-[#0D1282]">
            <p class="font-semibold mb-2">Manage your budget together</p>
            <p class="text-gray-600 text-xs">
              Invite your friends to budget your trip together!
            </p>
          </div>
        </div>
      </aside>

      <div class="p-4 sm:hidden flex items-center justify-between bg-[#FFFFFF] fixed top-0 left-0 right-0 z-40">
        <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="text-[#0D1282] text-2xl">
          <i class="fa-solid fa-bars"></i>
        </button>
        <h2 class="text-xl font-extrabold text-[#0D1282]">Budget</h2>
      </div>

      <div v-if="isMobileMenuOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 sm:hidden" @click="isMobileMenuOpen = false">
        <div class="fixed top-0 left-0 w-64 bg-[#FFFFFF] p-6 shadow-xl h-screen flex flex-col justify-between z-50" @click.stop>
          <div>
            <h2 class="text-2xl font-extrabold text-[#0D1282] mb-4">Budget</h2>
            <div class="space-y-2">
              <button class="w-full text-left rounded-xl p-3 flex items-center gap-3 transition-colors" :class="{
                'bg-[#F0DE36] text-[#0D1282] font-bold': activeTab === 'expenses',
                'text-[#0D1282] hover:text-[#D71313]/90 transition font-bold': activeTab !== 'expenses',
              }" @click="activeTab = 'expenses'; isMobileMenuOpen = false;">
                <span>🧾</span><span class="text-sm">Expenses</span>
              </button>
              
              <button class="w-full text-left rounded-xl p-3 flex items-center gap-3 transition-colors" :class="{
                'bg-[#F0DE36] text-[#0D1282] font-bold hover:bg-[#F0DE36]': activeTab === 'balance',
                'text-[#0D1282] hover:text-[#D71313]/90 transition font-bold': activeTab !== 'balance',
              }" @click="activeTab = 'balance'; isMobileMenuOpen = false;">
                <span>⚖️</span><span class="text-sm">Balance</span>
              </button>
            </div>

            <div class="mt-8 p-4 bg-[#EEEDED] rounded-xl text-sm text-[#0D1282]">
              <p class="font-semibold mb-2">Manage your budget together</p>
              <p class="text-gray-600 text-xs">
                Invite your friends to budget your trip together!
              </p>
            </div>
          </div>
          
          <button @click="isMobileMenuOpen = false" class="mt-8 w-full bg-red-100 text-red-700 font-bold py-3 px-4 rounded-full shadow-md transition">
            Close Menu
          </button>
        </div>
      </div>

      <main class="flex-1 p-4 md:p-8 overflow-y-auto bg-white" :class="{ 'pt-16 sm:pt-8': !isMobileMenuOpen, 'pt-16': isMobileMenuOpen }">
        <template v-if="activeTab === 'expenses'">
          <h3 class="text-2xl md:text-3xl font-extrabold text-[#0D1282] mb-4 md:mb-6 border-b-2 border-[#D71313] pb-1 md:pb-2">
            📝 Saved Expenses
          </h3>

          <div v-if="expenses.length === 0" class="flex flex-col items-center justify-center text-center text-gray-500 min-h-[60vh]">
            <img src="/expense.png" alt="No expenses" class="w-32 h-32 mb-4 opacity-40" />
            <p class="font-bold text-lg">No expenses yet</p>
            <p class="text-sm text-gray-400">
              Add custom expenses or start planning your trip.
            </p>
          </div>

          <div v-else v-for="(expense, index) in expenses" :key="index"
            class="bg-[#EEEDED] rounded-xl shadow-lg p-6 flex justify-between items-center mb-4 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl border-l-4"
            :class="expense.isPaid ? 'border-[#0D1282]' : 'border-[#D71313]'">
            <div class="flex items-center space-x-4">
              <div class="w-10 h-10 md:w-14 md:h-14 bg-[#0D1282] rounded-full flex items-center justify-center text-white text-xl shadow-md flex-shrink-0">
                <i :class="['fa-solid', getCategoryIcon(expense.category)]"></i>
              </div>
              <div>
                <p class="font-bold text-lg text-gray-800">
                  {{ expense.note }}
                </p>
                <p class="text-sm text-gray-600">
                  <span class="font-medium text-[#0D1282]">{{ expense.category }}</span>
                  by
                  <span class="text-gray-800 font-semibold">{{ getParticipantName(expense.paidBy) }}</span>
                  on {{ expense.date }}
                </p>
              </div>
            </div>

            <div class="text-right">
              <p class="text-2xl font-extrabold text-[#0D1282]">
                {{ expense.amount.toFixed(2) }} {{ expense.currency }}
              </p>
              <p class="text-sm font-semibold" :class="expense.isPaid ? 'text-green-600' : 'text-[#D71313]'">
                {{ expense.isPaid ? "Paid" : "Unpaid" }}
              </p>

              <div class="flex gap-2 justify-end mt-2" v-if="trip && trip.role === 'leader'">
                <button @click="editExpense(index)"
                  class="px-4 py-1 text-sm rounded-full bg-[#F0DE36] hover:bg-yellow-400 text-[#0D1282] font-semibold shadow-md transition-all duration-200">
                  Edit
                </button>
                <button @click="deleteExpense(index)"
                  class="px-4 py-1 text-sm rounded-full bg-[#D71313] hover:bg-red-700 text-white font-semibold shadow-md transition-all duration-200">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </template>

        <template v-if="activeTab === 'balance'">
          <h2 class="text-2xl md:text-3xl font-extrabold text-[#0D1282] mb-2 md:mb-4">
            Total Expense:
            <span class="font-extrabold text-[#D71313]">
              {{ totalCost.toFixed(2) }} {{ selectedCurrency }}
            </span>
          </h2>

          <div class="bg-[#EEEDED] rounded-xl shadow-lg p-6 mb-6">
            <h3 class="text-xl font-bold text-[#0D1282] mb-2 border-b-2 border-[#F0DE36] pb-1">
              👥 Trip Members ({{ participants.length }})
            </h3>
            <ul class="list-none text-gray-700 space-y-2">
              <li v-for="p in participants" :key="p.gmail" class="mb-2 bg-white p-3 rounded-lg shadow-sm flex items-center gap-2">
                <span class="font-bold text-[#0D1282]">{{ p.username }}</span>
                <span class="text-sm text-gray-500 truncate">({{ p.gmail }})</span>
                <span v-if="p.gmail === tripLeader"
                  class="ml-auto text-xs bg-[#F0DE36] text-[#0D1282] font-bold px-2 py-0.5 rounded-full">
                  Leader
                </span>
              </li>
            </ul>
          </div>

          <div class="bg-[#EEEDED] rounded-xl shadow-lg p-6 mb-6">
            <h3 class="text-xl font-bold text-[#0D1282] mb-2 border-b-2 border-[#F0DE36] pb-1">
              ⚖️ Balance per person
            </h3>
            <ul class="text-gray-700 space-y-3">
              <li v-for="p in participants" :key="p.gmail" class="bg-white p-4 rounded-lg shadow-sm flex flex-col gap-2">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-[#0D1282] text-lg">{{ p.username }}</span>
                  <span v-if="p.gmail === currentUserEmail" class="text-sm text-gray-500 italic"> (You)</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Paid:</span>
                  <span class="font-semibold text-green-600">
                    {{ balances[p.gmail].paid.toFixed(2) }} {{ selectedCurrency }}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Should Pay:</span>
                  <span class="font-extrabold" :class="balances[p.gmail].share > 0 ? 'text-[#D71313]' : 'text-green-600'">
                    {{ balances[p.gmail].share.toFixed(2) }} {{ selectedCurrency }}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </template>
      </main>

      <aside class="hidden md:block md:w-1/3 lg:w-1/4 bg-[#FFFFFF] border-l border-gray-200 p-6 shadow-xl sticky top-0 h-screen overflow-y-auto">
        <div class="text-center mb-6 bg-[#EEEDED] rounded-2xl p-6 shadow-inner">
          <div class="relative w-40 h-40 mx-auto">
            <div class="absolute top-1/2 left-1/2 w-full h-full rounded-full -translate-x-1/2 -translate-y-1/2" :style="{
              background: totalCost === 0
                ? '#e5e7eb'
                : `conic-gradient(
                    #F0DE36 0% ${paidPercentage}%,
                    #D71313 ${paidPercentage}% 100%
                  )`
            }"></div>
            <div class="absolute inset-10 bg-white rounded-full flex items-center justify-center">
              <p class="text-xl font-bold">{{ totalCost.toFixed(2) }}</p>
            </div>
          </div>
          <p class="text-xl font-bold mt-4 text-[#0D1282]">Total trip cost</p>
          <div class="flex justify-center space-x-4 mt-2 text-sm font-semibold">
            <span class="text-yellow-600">
              🟡 Paid {{ (totalCost - pendingCost).toFixed(2) }}
            </span>
            <span class="text-[#D71313]">
              🔴 Pending {{ pendingCost.toFixed(2) }}
            </span>
          </div>
        </div>

        <ul class="bg-[#EEEDED] rounded-xl shadow-lg p-6 space-y-4 mt-8">
          <li v-for="cat in categories" :key="cat" class="flex justify-between items-center text-[#0D1282] py-2">
            <div class="flex items-center gap-3">
              <i :class="['fa-solid', getCategoryIcon(cat)]" class="w-6 text-center text-[#D71313] text-lg"></i>
              <span class="font-medium">{{ cat }}</span>
            </div>
            <span class="font-bold text-right">
              {{ categoryTotals[cat].toFixed(2) }} {{ selectedCurrency }}
            </span>
          </li>
        </ul>
      </aside>

      <div class="fixed bottom-4 right-4 z-40 sm:hidden flex flex-col items-end space-y-4">
        <button @click="openExpenseModalForAdd" v-if="trip && trip.role === 'leader'"
          class="w-16 h-16 rounded-full bg-[#F0DE36] hover:bg-yellow-400 text-[#0D1282] shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110">
          <i class="fa-solid fa-plus text-2xl font-bold"></i>
        </button>
        
        <button @click="showMobileSummary = !showMobileSummary"
          class="w-16 h-16 rounded-full bg-[#0D1282] text-white shadow-xl flex items-center justify-center text-xl font-bold transition-all duration-300 transform hover:scale-110">
          <i class="fa-solid fa-chart-pie"></i>
        </button>

        <button @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="w-16 h-16 rounded-full bg-[#0D1282] text-white shadow-xl flex items-center justify-center text-xl font-bold transition-all duration-300 transform hover:scale-110">
          <i class="fa-solid fa-bars"></i>
        </button>
      </div>

      <div v-if="showMobileSummary" class="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end" @click="showMobileSummary = false">
        <div class="w-full bg-[#FFFFFF] p-6 rounded-t-3xl shadow-xl z-50" @click.stop>
          <h3 class="text-xl font-bold text-[#0D1282] mb-4 border-b-2 border-[#F0DE36] pb-1">Summary</h3>
          <div class="text-center mb-6 bg-[#EEEDED] rounded-2xl p-6 shadow-inner">
            <div class="relative w-32 h-32 mx-auto">
              <div class="absolute top-1/2 left-1/2 w-full h-full rounded-full -translate-x-1/2 -translate-y-1/2" :style="{
                background: totalCost === 0
                  ? '#e5e7eb'
                  : `conic-gradient(
                      #F0DE36 0% ${paidPercentage}%,
                      #D71313 ${paidPercentage}% 100%
                    )`
              }"></div>
              <div class="absolute inset-8 bg-white rounded-full flex items-center justify-center">
                <p class="text-lg font-bold">{{ totalCost.toFixed(2) }}</p>
              </div>
            </div>
            <p class="text-lg font-bold mt-3 text-[#0D1282]">Total trip cost</p>
            <div class="flex justify-center space-x-4 mt-2 text-sm font-semibold">
              <span class="text-yellow-600">
                🟡 Paid {{ (totalCost - pendingCost).toFixed(2) }}
              </span>
              <span class="text-[#D71313]">
                🔴 Pending {{ pendingCost.toFixed(2) }}
              </span>
            </div>
          </div>
          <ul class="bg-[#EEEDED] rounded-xl shadow-lg p-6 space-y-4">
            <li v-for="cat in categories" :key="cat" class="flex justify-between items-center text-[#0D1282] py-2">
              <div class="flex items-center gap-3">
                <i :class="['fa-solid', getCategoryIcon(cat)]" class="w-6 text-center text-[#D71313] text-lg"></i>
                <span class="font-medium">{{ cat }}</span>
              </div>
              <span class="font-bold text-right">
                {{ categoryTotals[cat].toFixed(2) }} {{ selectedCurrency }}
              </span>
            </li>
          </ul>
          <button @click="showMobileSummary = false" class="mt-6 w-full bg-red-100 text-red-700 font-bold py-2 px-4 rounded-full shadow-md transition">
            Close Summary
          </button>
        </div>
      </div>

      <div v-if="showExpenseModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="flex flex-col md:flex-row gap-6 w-full max-w-4xl overflow-y-auto">
          <div class="bg-[#EEEDED] rounded-3xl w-full p-6 shadow-2xl relative flex flex-col max-h-[80vh] overflow-y-auto">
            <h2 class="text-2xl font-bold text-center mb-6 text-[#0D1282]">
              {{ editingIndex !== null ? 'Edit Expense' : 'New Expense' }}
            </h2>

            <div class="flex flex-col sm:flex-row gap-2 mb-6">
              <button class="flex-1 border border-[#0D1282]/30 rounded-full py-3 text-sm text-[#0D1282] font-semibold transition hover:bg-[#0D1282]/10"
                @click="showCategoryModal = true">
                📂 {{ selectedCategory || "Category" }}
              </button>

              <button @click="openDatePicker"
                class="flex-1 border border-[#0D1282]/30 rounded-full py-3 text-sm text-[#0D1282] font-semibold transition hover:bg-[#0D1282]/10">
                📅
                {{ new Date(selectedDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })
                }}
              </button>
              <input ref="dateInput" v-model="selectedDate" type="date" :min="new Date().toISOString().split('T')[0]" class="hidden" />
            </div>

            <div class="flex items-center justify-center mb-4 border border-[#0D1282]/30 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-[#F0DE36] transition">
              <input v-model="amount" type="number" min="0" step="0.01" class="w-32 px-4 py-3 text-2xl font-bold text-[#0D1282] text-right focus:outline-none bg-transparent"
                placeholder="0.00" />
              <div class="w-px h-8 bg-[#0D1282]/20"></div>
              <select v-model="selectedCurrency" class="px-4 py-3 text-base text-[#0D1282] bg-transparent focus:outline-none cursor-pointer">
                <option v-for="cur in currencies" :key="cur" :value="cur">
                  {{ cur }}
                </option>
              </select>
            </div>

            <div class="flex items-center bg-white p-3 rounded-xl border border-[#0D1282]/30 mb-4 focus-within:ring-2 focus-within:ring-[#F0DE36] transition">
              <i class="fa-solid fa-note-sticky text-[#0D1282]/60 mr-3"></i>
              <input type="text" placeholder="Enter expense name..." class="w-full outline-none bg-transparent text-[#0D1282]" v-model="note" />
            </div>

            <div class="flex justify-between items-center mb-6">
              <span class="text-[#0D1282] font-medium">Status</span>
              <label class="flex items-center cursor-pointer">
                <input type="checkbox" v-model="isPaid" class="sr-only" />
                <div class="w-12 h-6 rounded-full shadow-inner relative transition-colors duration-300" :class="isPaid ? 'bg-emerald-500' : 'bg-gray-300'">
                  <div class="dot absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300" :class="isPaid ? 'translate-x-full' : 'translate-x-0.5'"></div>
                </div>
                <span class="ml-3 font-semibold" :class="isPaid ? 'text-emerald-600' : 'text-gray-500'">
                  {{ isPaid ? "Paid" : "Unpaid" }}
                </span>
              </label>
            </div>

            <div class="mb-6">
              <label class="block font-semibold text-[#0D1282] mb-2">Paid by</label>
              <select v-model="paidBy" class="w-full border border-[#0D1282]/30 rounded-full px-4 py-3 text-[#0D1282] focus:outline-none focus:ring-2 focus:ring-[#F0DE36] transition">
                <option v-for="p in participants" :key="p.gmail" :value="p.gmail">
                  {{ p.username }}
                </option>
              </select>
            </div>

            <div class="flex justify-end gap-4 mt-auto">
              <button @click="closeExpenseModal" class="px-6 py-3 rounded-full bg-[#EEEDED] text-[#0D1282] font-semibold border border-[#0D1282]/30 hover:bg-[#D71313] transition">
                Cancel
              </button>
              <button @click="saveExpense" class="px-8 py-3 rounded-full bg-[#0D1282] text-white font-bold hover:bg-[#0D1282]/90 shadow-md transition">
                Save expense
              </button>
            </div>

            <button @click="closeExpenseModal" class="absolute top-4 right-4 text-gray-400 hover:text-[#D71313] text-2xl font-bold transition">
              ✕
            </button>
          </div>

          <div class="bg-[#EEEDED] rounded-3xl w-full md:w-[420px] p-6 shadow-2xl relative flex flex-col max-h-[80vh] overflow-y-auto">
            <h2 class="text-2xl font-bold text-center mb-6 text-[#0D1282]">
              Participants
            </h2>
            <div class="space-y-3">
              <label class="block font-semibold text-[#0D1282]">Split with</label>

              <div class="space-y-2 max-h-48 overflow-y-auto pr-2">
                <label v-for="p in participants" :key="p.gmail"
                  class="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ease-in-out"
                  :class="{
                    'bg-white border-slate-300 shadow-sm hover:bg-slate-50': !splitWith.includes(p.gmail),
                    'bg-[#E5F3FF] border-[#0D1282] shadow-md': splitWith.includes(p.gmail),
                  }">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out" :class="{
                    'bg-slate-200': !splitWith.includes(p.gmail),
                    'bg-[#0D1282] scale-100': splitWith.includes(p.gmail),
                    'scale-0': !splitWith.includes(p.gmail),
                  }">
                    <svg v-if="splitWith.includes(p.gmail)" class="w-4 h-4 text-white" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span class="text-slate-800">{{ p.username }}</span>
                  <input type="checkbox" :value="p.gmail" v-model="splitWith" class="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showCategoryModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-[#EEEDED] p-6 rounded-2xl w-full max-w-sm shadow-xl relative">
          <h3 class="text-xl font-bold mb-4 text-[#0D1282]">
            Select Category
          </h3>
          <button @click="showCategoryModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-[#0D1282] transition">
            ✕
          </button>
          <ul>
            <li v-for="cat in categories" :key="cat" @click="
              selectedCategory = cat;
              showCategoryModal = false;
            " class="cursor-pointer p-3 hover:bg-[#F0DE36]/40 rounded-xl flex items-center gap-3 transition">
              <i :class="['fa-solid', getCategoryIcon(cat)]" class="w-5 text-center text-[#0D1282]"></i>
              {{ cat }}
            </li>
          </ul>
          <div class="mt-4 border-t pt-4">
            <button
              class="w-full bg-[#D71313]/10 text-[#D71313] py-2 rounded-full hover:bg-[#D71313]/20 transition font-semibold"
              @click="
                selectedCategory = '';
                showCategoryModal = false;
              ">
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any specific styles here if needed, but Tailwind should cover most cases */
.menu-item-wrapper:hover {
  background-color: #d1fae5;
}

/* Styles for the toggle switch */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>