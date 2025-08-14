import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import customView from '../views/customView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/custom',
      name: 'custom',
      // route level code-splitting
      // this generates a separate chunk (custom.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: customView,
    },
  ],
})

export default router
