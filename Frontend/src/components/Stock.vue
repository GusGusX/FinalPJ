<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
    <h1 class="text-2xl sm:text-3xl font-semibold mb-6 sm:mb-8 text-center text-gray-800">Stock เนื้อสัตว์</h1>
    <div class="overflow-x-auto shadow-lg rounded-lg">
      <table class="table-auto w-full border-collapse">
        <thead>
          <tr class="bg-gradient-to-r from-blue-500 to-teal-500 text-white">
            <th class="border-t border-b px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium">ชื่อเนื้อสัตว์</th>
            <th class="border-t border-b px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium">จำนวนคงเหลือ (กิโลกรัม)</th>
            <th class="border-t border-b px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium">ราคา (บาท/กิโลกรัม)</th>
            <th class="border-t border-b px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id" class="hover:bg-gray-50 transition duration-200">
            <td class="px-4 sm:px-6 py-4 border-b text-xs sm:text-sm">{{ product.product_name }}</td>
            <td class="px-4 sm:px-6 py-4 border-b text-xs sm:text-sm">{{ product.quantity }} กิโลกรัม</td>
            <td class="px-4 sm:px-6 py-4 border-b text-xs sm:text-sm">฿{{ product.price }}</td>
            <td
              class="px-4 sm:px-6 py-4 border-b font-semibold text-xs sm:text-sm"
              :class="product.quantity > 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{ product.quantity > 0 ? 'มีของ' : 'หมดสต็อก' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>


<script>
import axios from "axios";

export default {
  data() {
    return {
      products: [], // เก็บรายการสินค้าเนื้อสัตว์
    };
  },
  async mounted() {
    // ดึงข้อมูลเนื้อสัตว์จาก API
    try {
      const response = await axios.get("http://192.168.0.108:8888/products");
      this.products = response.data;
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  },
  methods: {
    editProduct(productId) {
      console.log("Editing product:", productId);
      // เพิ่ม logic สำหรับแก้ไขข้อมูลเนื้อสัตว์
    },
    deleteProduct(productId) {
      console.log("Deleting product:", productId);
      // เพิ่ม logic สำหรับลบข้อมูลเนื้อสัตว์
    },
  },
};
</script>
