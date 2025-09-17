import axios from 'axios'
import api from '../../api'
export default {
  namespaced: true,
  state: () => ({
    user: null
  }),
  mutations: {
    setUser(state, user) {
      state.user = user
    },
    clearUser(state) {
      state.user = null
    }
  },
  actions: {
    login({ commit }, { user }) {
      commit('setUser', user)
    },
    logout({ commit }) {
      commit('clearUser')
    },

    async fetchUser({ commit }) {
      try {
        const res = await axios.get(
          'https://trippifyb2-production.up.railway.app/auth/user'
        )
        commit('setUser', res.data)
      } catch (e) {
        commit('clearUser')
      }
    }
  },
  getters: {
    getUser: state => state.user,
    isLoggedIn: state => !!state.user
  }
}
