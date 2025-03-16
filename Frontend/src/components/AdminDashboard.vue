<template>
  <div class="flex flex-col md:flex-row min-h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside class="w-full md:w-64 bg-orange-300 text-white p-4 md:block hidden">
      <h2 class="text-xl font-bold mb-4 text-orange-900">📌 เมนู</h2>
      <ul>
        <li class="mb-2">
          <button class="w-full text-left px-4 py-2 bg-orange-200 text-orange-900 rounded hover:bg-orange-400 transition" @click="currentTab = 'products'">
            🛒 การจัดการสินค้า
          </button>
        </li>
        <li class="mb-2">
          <button class="w-full text-left px-4 py-2 bg-orange-200 text-orange-900 rounded hover:bg-orange-400 transition" @click="currentTab = 'orders'">
            📜 ประวัติการสั่งซื้อ
          </button>
        </li>
        <li class="mb-2">
          <button class="w-full text-left px-4 py-2 bg-orange-200 text-orange-900 rounded hover:bg-orange-400 transition"
            @click="openLineManager">
            🔗 จัดการ LINE Business
  </button>
</li>
      </ul>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-6">
      <h1 class="text-2xl font-bold text-orange-700 mb-4" v-if="currentTab === 'products'">📦 การจัดการสินค้าร้านอึ่งเนื้อวัว</h1>
      <h1 class="text-2xl font-bold text-orange-700 mb-4" v-if="currentTab === 'orders'">📜 ประวัติการสั่งซื้อ</h1>

      <div v-if="currentTab === 'products'">
        <!-- ฟอร์มเพิ่มสินค้า -->
        <div class="bg-white p-4 rounded-lg shadow mb-6 border-l-4 border-orange-400">
          <h2 class="text-lg font-bold text-orange-600 mb-2">เพิ่มสินค้าใหม่</h2>
          <input v-model="newProduct.product_name" type="text" placeholder="ชื่อสินค้า" class="border p-2 w-full mb-2 rounded">
          <input v-model="newProduct.price" type="number" placeholder="กรอกจำนวนเงิน" class="border p-2 w-full mb-2 rounded">
          <input v-model="newProduct.quantity" type="number" placeholder="กรอกจำนวนกิโลกรัม" class="border p-2 w-full mb-2 rounded">
          <input v-model="newProduct.image_url" type="text" placeholder="URL รูปภาพสินค้า" class="border p-2 w-full mb-2 rounded">
          <button @click="addProduct" class="bg-orange-400 text-white px-4 py-2 rounded hover:bg-orange-600 transition">เพิ่มสินค้า</button>
        </div>

        <!-- ตารางสินค้า -->
        <div class="bg-white p-4 rounded-lg shadow border-l-4 border-orange-400">
          <h2 class="text-lg font-bold text-orange-600 mb-2">📋 รายการสินค้า</h2>
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-orange-200 text-gray-800">
                <th class="border p-2">ลำดับ</th>
                <th class="border p-2">รูป</th>
                <th class="border p-2">ชื่อสินค้า</th>
                <th class="border p-2">ราคา (บาท)</th>
                <th class="border p-2">คงเหลือ (กิโลกรัม)</th>
                <th class="border p-2">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(product, index) in products" :key="product.product_id" class="hover:bg-gray-100 transition">
                <td class="border p-2">{{ index + 1 }}</td>
                <td class="border p-2">
                  <img :src="product.image_url" class="w-16 h-16 object-cover rounded" v-if="product.image_url">
                </td>
                <td class="border p-2">
                  <input v-if="product.editing" v-model="product.product_name" class="border p-1 rounded">
                  <span v-else>{{ product.product_name }}</span>
                </td>
                <td class="border p-2">
                  <input v-if="product.editing" v-model="product.price" type="number" class="border p-1 rounded">
                  <span v-else>{{ product.price }} บาท</span>
                </td>
                <td class="border p-2">
                  <input v-if="product.editing" v-model="product.quantity" type="number" class="border p-1 rounded">
                  <span v-else>{{ product.quantity }} กก.</span>
                </td>
                <td class="border p-2">
                  <button v-if="product.editing" @click="updateProduct(product)" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-700 transition">💾 บันทึก</button>
                  <button v-else @click="product.editing = true" class="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-700 transition">✏️ แก้ไข</button>
                  <button @click="deleteProduct(product.product_id)" class="bg-red-500 text-white px-2 py-1 rounded ml-2 hover:bg-red-700 transition">🗑 ลบ</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

  <div v-if="currentTab === 'orders'">
  <p v-if="orders.length === 0" class="text-gray-600">ไม่มีประวัติการสั่งซื้อ</p>
  <ul v-else>
  <li v-for="order in orders" :key="order.id" class="border p-4 mb-2 rounded bg-white shadow">
    <div class="flex flex-col md:flex-row justify-between">
      <span class="text-lg font-bold text-orange-600">🧑‍💼 {{ order.customer_name }}</span>
    </div>

    <!-- ✅ แสดงรายละเอียดคำสั่งซื้อทั้งหมด -->
    <div class="mt-4 p-4 bg-gray-100 rounded-lg">
      <p><strong>📞 เบอร์โทร:</strong> {{ order.phone }}</p>
      <p><strong>📍 ที่อยู่:</strong> {{ order.address }}</p>
      <p><strong>🗓 วันที่สั่งซื้อ:</strong> {{ formatDate(order.order_date) }}</p>

      <h2 class="text-lg font-bold text-orange-600 mt-4">📦 รายการสินค้า</h2>
      <ul class="mt-2 space-y-2">
        <li v-for="item in order.items" :key="item.product_id"
          class="bg-white p-3 rounded border-l-4 border-orange-400 shadow-sm">
          <p><strong>สินค้า:</strong> {{ item.product_name }}</p>
          <p>จำนวน: {{ item.quantity }} ชิ้น | ราคา: {{ item.price }} บาท/ชิ้น</p>
          <p class="text-gray-700">
          💳 สถานะการชำระเงิน:
          <span :class="order.payment_status === 'จ่ายแล้ว' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'">
            {{ order.payment_status }}
          </span>
        </p>
        <button
          @click="togglePaymentStatus(order)"
          class="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-700 transition">
          💰 เปลี่ยนสถานะ
        </button>
        </li>
      </ul>

      <p class="text-xl font-bold text-orange-600 mt-4 text-right">
        💰 ยอดรวม: {{ order.total_price }} บาท
      </p>
    </div>
  </li>
</ul>
</div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const openLineManager = () => {
  window.open("https://manager.line.biz/", "_blank");
};

const currentTab = ref('products');
const products = ref([]);
const orders = ref([]);
const newProduct = ref({ product_name: "", price: "", quantity: "", image_url: "" });

const togglePaymentStatus = async (order) => {
  if (!order.order_id) {
    console.error("❌ Error: order_id ไม่ถูกต้อง", order);
    return;
  }

  try {
    const newStatus = order.payment_status === "จ่ายแล้ว" ? "ไม่จ่าย" : "จ่ายแล้ว";
    console.log(`📌 อัปเดต Payment Status: Order ID ${order.order_id} เป็น ${newStatus}`);

    await axios.put(`${import.meta.env.VITE_API_URL}/orders/${order.order_id}/payment`, {
      payment_status: newStatus
    });

    order.payment_status = newStatus;
  } catch (error) {
    console.error("❌ Error updating payment status:", error);
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "ไม่ทราบวันที่"; // กรณีไม่มีข้อมูล
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('th-TH', options);
};

const fetchOrders = async () => {
  try {
    const response = await axios.get(import.meta.env.VITE_API_URL + "/orders");
    orders.value = response.data.map(order => ({
      ...order,
      showDetails: false,
      payment_status: order.payment_status || "ยังไม่จ่าย"
    }));
  } catch (error) {
    console.error("Error fetching orders:", error);
  }
};

const fetchProducts = async () => {
  try {
    const response = await axios.get(import.meta.env.VITE_API_URL + "/products");
    products.value = response.data.map(product => ({ ...product, editing: false }));
  } catch (error) {
    console.error("Error fetching products:", error);
  }
};

const addProduct = async () => {
  try {
    await axios.post(import.meta.env.VITE_API_URL + "/products", newProduct.value);
    fetchProducts();
    newProduct.value = { product_name: "", price: "", quantity: "", image_url: "" };
  } catch (error) {
    console.error("Error adding product:", error);
  }
};

const updateProduct = async (product) => {
  try {
    await axios.put(`${import.meta.env.VITE_API_URL}/products/${product.product_id}`, product);
    product.editing = false;
  } catch (error) {
    console.error("Error updating product:", error);
  }
};

const deleteProduct = async (id) => {
  try {
    await axios.delete(`${import.meta.env.VITE_API_URL}/products/${id}`);
    fetchProducts();
  } catch (error) {
    console.error("Error deleting product:", error);
  }
};

onMounted(() => {
  fetchProducts();
  fetchOrders();
});
</script>
