import { createRouter, createWebHistory } from 'vue-router';
import OrderPage from '../components/OrderPage.vue';
import OrderHistory from '../components/OrderHistory.vue';
import Home from '../components/Home.vue';
import ProfilePage from '../components/ProfilePage.vue';
import Stock from '../components/Stock.vue';
import CheckoutPage from '../components/CheckoutPage.vue'
import LiffLogin from '../components/LiffLogin.vue'

const routes = [
  { path: "/Stock",
    name: "Stock",
    component: Stock },

  {
    path: '/Order-Page',
    name: 'OrderPage',
    component: OrderPage },

  { path: "/Home",
    name: "Home",
    component: Home },

  { path: '/order-history',
    name: 'OrderHistory',
    component: OrderHistory },

  { path: '/profile',
    name: 'Profile',
    component: ProfilePage },

    {
      path: "/checkout",
      name: "CheckoutPage",
      component: CheckoutPage, },

      {
        path: "/",
        name: "LiffLogin",
        component: LiffLogin, },
];


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // ใช้ history mode
  routes,
});

export default router;
