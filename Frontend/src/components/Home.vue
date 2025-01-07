<template>
  <div class="min-h-screen bg-gray-100 flex flex-col items-center py-10">
    <h1 class="text-2xl font-bold text-gray-800 mb-8">OUNG BEEF SHOP</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
      <!-- Order Card -->
      <div
        class="bg-white shadow-md rounded-lg p-6 flex flex-col items-center hover:bg-gray-50 cursor-pointer"
        @click="navigateTo('order')"
      >
        <img
          src=""
          alt="Order Icon"
          class="w-20 h-20 mb-4"
        />
        <p class="text-lg font-medium text-gray-700">Order</p>
      </div>

      <!-- Stock Card -->
      <div
        class="bg-white shadow-md rounded-lg p-6 flex flex-col items-center hover:bg-gray-50 cursor-pointer"
        @click="navigateTo('stock')"
      >
        <img
          src=""
          alt="Stock Icon"
          class="w-20 h-20 mb-4"
        />
        <p class="text-lg font-medium text-gray-700">Stock</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "OrderStock",
  methods: {
    navigateTo(page) {
      if (page === "order") {
        this.$router.push("/Order-Page");
      } else if (page === "stock") {
        this.$router.push("/stock");
      }
    },
  },
};
</script>

<style>
/* ใส่ CSS เพิ่มเติมได้ที่นี่ */
</style>
