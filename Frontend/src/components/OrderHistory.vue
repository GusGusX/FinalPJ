<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-orange-600 mb-8">ประวัติการสั่งซื้อ</h1>
    <div v-if="orders.length > 0">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-item bg-white p-6 mb-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
      >
        <div class="space-y-4">
          <p class="text-lg font-semibold text-gray-800">
            ชื่อผู้สั่ง: <span class="text-orange-500">{{ order.customer_name }}</span>
          </p>
          <p class="text-gray-700">
            เบอร์โทร: <span class="font-medium">{{ order.phone }}</span>
          </p>
          <p class="text-gray-700">
            ที่อยู่: <span class="font-medium">{{ order.address }}</span>
          </p>
          <p class="text-gray-700">
            วันที่สั่งซื้อ: <span class="font-medium">{{ formatDate(order.order_date) }}</span>
          </p>
          <p class="text-xl font-bold text-orange-600">
            ยอดรวม: {{ order.total_price }} บาท
          </p>
          <hr class="my-4 border-t border-orange-200" />
          <h2 class="text-2xl font-bold text-orange-600 mb-2">รายการสินค้า:</h2>
          <ul class="space-y-2">
            <li
              v-for="item in order.items"
              :key="item.product_id"
              class="bg-orange-50 p-3 rounded-lg"
            >
              <p class="text-gray-800">
                {{ item.product_name }} -
                <span class="text-orange-500">{{ item.quantity }} ชิ้น</span> -
                <span class="text-orange-500">{{ item.price }} บาท/ชิ้น</span>
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div v-else>
      <p class="text-gray-500 text-center py-8">ไม่มีประวัติการสั่งซื้อ</p>
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
      const response = await fetch("http://localhost:8888/orders", {
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

<style scoped>
/* เพิ่มสไตล์เพิ่มเติมหากจำเป็น */
.order-item:hover {
  transform: translateY(-2px);
}
</style>
