<template>
  <div class="container">
    <h1 class="text-xl font-semibold mb-4">ประวัติการสั่งซื้อ</h1>
    <div v-if="orders.length > 0">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-item p-4 mb-4 border rounded-lg shadow-sm bg-gray-50"
      >
        <p>ชื่อผู้สั่ง: {{ order.customer_name }}</p>
        <p>เบอร์โทร: {{ order.phone }}</p>
        <p>ที่อยู่: {{ order.address }}</p>
        <p>วันที่สั่งซื้อ: {{ formatDate(order.order_date) }}</p>
        <p>ยอดรวม: {{ order.price }} บาท</p>
        <hr class="my-2" />
      </div>
    </div>
    <div v-else>
      <p class="text-gray-500">ไม่มีประวัติการสั่งซื้อ</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      orders: [], // เก็บข้อมูลประวัติการสั่งซื้อ
    };
  },
  methods: {

    // ฟอร์แมตวันที่ให้ดูง่าย
    formatDate(dateString) {
      const options = { year: "numeric", month: "long", day: "numeric" };
      return new Date(dateString).toLocaleDateString("th-TH", options);
    },
  },
  async created() {
    try {
      const response = await fetch("http://192.168.0.110:8888/orders", {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        this.orders = await response.json();
      } else {
        console.error("Error loading order history.");
        alert("ไม่สามารถโหลดข้อมูลประวัติการสั่งซื้อได้");
      }
    } catch (error) {
      console.error("Error fetching order history:", error);
    }
  },
};
</script>

