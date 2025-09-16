import { createStore } from 'vuex'
import trip from './trip'
import auth from './auth'
export default createStore({
  modules: {
    trip,
    auth
  }
})
