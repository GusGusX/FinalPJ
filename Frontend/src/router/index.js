import { createRouter, createWebHistory } from 'vue-router';
import OrderPage from '../components/OrderPage.vue';
import OrderHistory from '../components/OrderHistory.vue';
import ProfilePage from '../components/ProfilePage.vue';
import CheckoutPage from '../components/CheckoutPage.vue';
import LiffLogin from '../components/LiffLogin.vue';
import AdminDashboard from '../components/AdminDashboard.vue'; // ✅ เพิ่มหน้า Admin

const routes = [
  {
    path: '/home',
    name: 'OrderPage',
    component: OrderPage,
  },
  {
    path: '/order-history',
    name: 'OrderHistory',
    component: OrderHistory,
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfilePage,
  },
  {
    path: "/checkout",
    name: "CheckoutPage",
    component: CheckoutPage,
  },
  {
    path: "/",
    name: "LiffLogin",
    component: LiffLogin,
  },
  {
    path: "/admin",
    name: "AdminDashboard",
    component: AdminDashboard,
    meta: { requiresAdmin: true }, // ✅ กำหนดว่าเฉพาะ Admin เท่านั้นที่เข้าได้
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// ✅ เพิ่ม Navigation Guard ตรวจสอบ Role ก่อนเข้า Admin
router.beforeEach((to, from, next) => {
  const userRole = localStorage.getItem("userRole");

  // 🔹 ถ้าหน้านั้นต้องการสิทธิ์ Admin แต่ User ไม่ใช่ Admin → Redirect ไป Home
  if (to.meta.requiresAdmin && userRole !== "admin") {
    alert("❌ คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
    next("/home");
  } else {
    next(); // ✅ ให้ผ่านไปตามปกติ
  }
});

export default router;
