// src/router.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from './components/Home.vue'
import Planner from './components/Planner.vue'
import Tripdetail from './components/Tripdetail.vue'
import SavedTrips from './components/SavedTrips.vue'
import FullErrorPage from './error/FullErrorPage.vue'
import Expense from './components/Expense.vue'
import InvitePage from './components/InvitePage.vue'
import Review from './components/Review.vue'
import SavedTripReview from './components/SavedTripReview.vue'
import axios from 'axios'

const routes = [
  { path: '/', component: Home },
  { path: '/planner', component: Planner },
  { path: '/tripdetail', component: Tripdetail },
  { path: '/trip/:tripId', component: Tripdetail }, 
  { path: '/saved-trips', component: SavedTrips },
  { path: '/saved-trip-review', component: SavedTripReview },
  { path: '/expense/:tripId', component: Expense },
  { path: '/trip/:tripId/review', component: Review},
  { path: '/invite/:tripId', component: InvitePage },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: FullErrorPage,
    props: {
      code: '404',
      title: 'Page Not Found',
      message: 'The page you’re looking for does not exist.'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ✅ Navigation Guard
router.beforeEach(async (to, from, next) => {
  if (to.path.startsWith('/trip/')) {
    try {
      const res = await axios.get('http://localhost:5000/auth/user', {
        withCredentials: true,
      })
      if (res.data) {
        next()
      } else {
        // ✅ ดึง tripId จาก param แล้ว redirect ไป /invite/:tripId
        next({ path: `/invite/${to.params.tripId}` })
      }
    } catch (err) {
      next({ path: `/invite/${to.params.tripId}` })
    }
  } else {
    next()
  }
})

export default router
