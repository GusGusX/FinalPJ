import { createRouter, createWebHistory } from 'vue-router';
import OrderPage from '../components/OrderPage.vue';
import OrderHistory from '../components/OrderHistory.vue';
import Home from '../components/Home.vue';
import ProfilePage from '../components/ProfilePage.vue';

const routes = [
  {
    path: '/Order-Page',
    name: 'OrderPage',
    component: OrderPage, // หน้า OrderPage
  },
  { path: "/",
    name: "Home",
    component: Home },

  { path: '/order-history',
    name: 'OrderHistory',
    component: OrderHistory },

  { path: '/profile',
    name: 'Profile',
    component: ProfilePage },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // ใช้ history mode
  routes,
});

export default router;
