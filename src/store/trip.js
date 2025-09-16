// src/store/trip.js
import axios from "axios";

export default {
  namespaced: true,
  state: () => ({
    tripPlan: { days: [] }, // default
  }),
mutations: {
  setTripPlan(state, data) {
    state.tripPlan = data || { days: [] }
  },
  updateTripPlan(state, data) {
    state.tripPlan = { ...state.tripPlan, ...data }
  },
  clearTripPlan(state) {
    state.tripPlan = { days: [] }
  },
}
,
  actions: {
    async fetchTripPlan({ commit }, tripId) {
      try {
        const res = await axios.get(`/api/trip/${tripId}`, { withCredentials: true });
        commit("setTripPlan", res.data); 
      } catch (err) {
        console.error("Error fetching trip plan:", err);
        commit("clearTripPlan");
      }
    },
  },
  getters: {
    getTripPlan(state) {
      return state.tripPlan;
    },
  },
};
