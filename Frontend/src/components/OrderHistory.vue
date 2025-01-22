<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
      <!-- หัวข้อ -->
      <h1 class="text-2xl font-bold text-gray-800 text-center mb-4">OUNG BEEF SHOP</h1>
      <h2 class="text-lg font-semibold text-gray-700 text-center mb-6">ประวัติการสั่งซื้อของฉัน</h2>

      <!-- รายการสั่งซื้อ -->
      <div v-for="order in orderHistory" :key="order.order_id" class="border border-gray-300 rounded-lg p-4 mb-4">
        <!-- ชื่อผู้สั่ง -->
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center">
            <img
              src="https://via.placeholder.com/40"
              alt="Profile"
              class="w-10 h-10 rounded-full mr-3"
            />
            <span class="text-gray-800 font-medium">{{ order.name }}</span>
          </div>
          <span class="text-gray-500 text-sm">{{ order.date }}</span>
        </div>

        <!-- รายละเอียดการสั่งซื้อ -->
        <div class="text-gray-700 text-sm space-y-2">
          <p><strong>สินค้าที่สั่ง:</strong> {{ order.product_name }}</p>
          <p><strong>ปริมาณที่สั่ง (กิโลกรัม):</strong> {{ order.quantity }}</p>
          <p><strong>ราคาที่สั่ง:</strong> ฿{{ order.price }}</p>
          <p><strong>ราคารวม:</strong> ฿{{ order.total_price }}</p>
          <p><strong>สถานะคำสั่งซื้อ:</strong> {{ order.status }}</p>
          <p><strong>ที่จัดส่งสินค้า:</strong> {{ order.deliveryLocation }}</p>
          <p><strong>เบอร์โทร:</strong> {{ order.phone }}</p>
          <p><strong>การชำระเงิน:</strong> {{ order.paymentMethod }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      orderHistory: [], // เก็บข้อมูลจาก API
    };
  },
  mounted() {
    this.fetchOrderHistory(); // ดึงข้อมูลเมื่อคอมโพเนนต์โหลดเสร็จ
  },
  methods: {
    async fetchOrderHistory() {
  try {
    const response = await axios.get("http://192.168.0.108:8888/order-history");
    this.orderHistory = response.data; // เก็บข้อมูลในตัวแปร orderHistory
  } catch (error) {
    console.error("Error fetching order history:", error);
  }
 },
},
};
</script>

<style scoped>
/* สามารถเพิ่ม CSS เฉพาะสำหรับหน้าได้ */
</style>
