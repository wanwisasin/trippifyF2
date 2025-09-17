// src/store/trip.js
import axios from "axios";
import api from "../../api";
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
        const res = await axios.get(`https://trippifyb2-production.up.railway.app/api/trip/${tripId}`, { withCredentials: true });
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
