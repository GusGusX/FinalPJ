<template>
  <div class="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg">
    <h1 class="text-2xl sm:text-3xl font-semibold text-center text-gray-800 mb-6">กรอกข้อมูลการสั่งซื้อ</h1>

    <!-- สินค้าในตะกร้า -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">สินค้าในตะกร้า</h2>
      <table class="w-full table-auto border-collapse">
        <thead>
          <tr class="text-left bg-gray-100">
            <th class="px-4 py-2 border-b text-sm font-semibold text-gray-600">ชื่อสินค้า</th>
            <th class="px-4 py-2 border-b text-sm font-semibold text-gray-600">ราคา</th>
            <th class="px-4 py-2 border-b text-sm font-semibold text-gray-600">จำนวน</th>
            <th class="px-4 py-2 border-b text-sm font-semibold text-gray-600">รวม</th>
            <th class="px-4 py-2 border-b text-sm font-semibold text-gray-600"> </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in cart" :key="item.product_id" class="odd:bg-gray-50">
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.name }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">฿{{ item.price }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.quantity }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">฿{{ item.price * item.quantity }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">
              <button
                @click="removeItem(index)"
                class="text-red-600 hover:text-red-800"
              >
                ลบ
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- ยอดรวม -->
      <div class="mt-4 text-right text-lg font-semibold">
        <p>ยอดรวม: ฿{{ totalAmount }} บาท</p>
      </div>
    </div>

    <!-- กรอกข้อมูลการสั่งซื้อ -->
    <form @submit.prevent="submitOrder" class="space-y-6">
      <div class="space-y-4">
        <label class="block text-lg font-medium text-gray-700">ชื่อ:</label>
        <input
          v-model="customer_name"
          type="text"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
        />

        <label class="block text-lg font-medium text-gray-700">เบอร์โทร:</label>
        <input
          v-model="phone"
          type="tel"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
        />

        <label class="block text-lg font-medium text-gray-700">ที่อยู่:</label>
        <textarea
          v-model="address"
          required
          rows="4"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
        ></textarea>
      </div>

      <!-- ปุ่มสั่งซื้อ -->
      <div class="mt-6 flex justify-center gap-x-6">
        <button
          type="submit"
          class="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          สั่งซื้อ
        </button>

        <button
          type="button"
          @click="goBack"
          class="px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          ย้อนกลับ
        </button>
      </div>
    </form>
  </div>
</template>


<script>
console.log();
export default {
  data() {
    return {
      customer_name: "",
      phone: "",
      address: "",
      cart: JSON.parse(localStorage.getItem("cart")) || [],
    };
  },
  computed: {
    // คำนวณยอดรวมจากราคาสินค้าในตะกร้า
    totalAmount() {
      return this.cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
    }
  },
  methods: {

    goBack() {
      window.history.back(); // กลับไปหน้าก่อนหน้า
    },

    submitOrder() {
      if (this.cart.length === 0) {
        alert("ไม่มีสินค้าในตะกร้า");
        return;
      }

      const orderData = {
        customer_name: this.customer_name,
        phone: this.phone,
        address: this.address,
        items: this.cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity // คำนวณ subtotal
   })),
   total_price: this.cart.reduce((total, item) => total + item.price * item.quantity, 0) // คำนวณ total_price
};

      console.log(orderData);  // ตรวจสอบค่าที่จะส่งไปใน `orderData`

      fetch("http://192.168.0.110:8888/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })
        .then((response) => {
          if (response.ok) {
            alert("สั่งซื้อสำเร็จ");
            localStorage.removeItem("cart");
            this.$router.push("/Home");
          } else {
            alert("เกิดข้อผิดพลาด");
          }
        })
        .catch((error) => {
          console.error("Error submitting order:", error);
          alert("ไม่สามารถสั่งซื้อได้");
        });
    },
    // ฟังก์ชันสำหรับลบสินค้าออกจากตะกร้า
    removeItem(index) {
      this.cart.splice(index, 1); // ลบสินค้าตาม index
    }
  },
};
</script>
