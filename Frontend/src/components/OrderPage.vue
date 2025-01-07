<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
      <!-- หัวข้อ -->
      <h1 class="text-2xl font-bold text-gray-800 text-center mb-6">OUNG BEEF SHOP</h1>

      <!-- แบบฟอร์ม -->
      <form @submit.prevent="handleSubmit">
        <!-- เลือกสินค้า -->
        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2">เลือกสินค้า</label>
          <input
            type="text"
            v-model="formData.product"
            placeholder="กรอกชื่อสินค้า"
            class="w-full border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring focus:ring-green-200"
          />
        </div>

        <!-- ระบุปริมาณ (กิโลกรัม) -->
        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2">ระบุปริมาณ (กิโลกรัม)</label>
          <input
            type="number"
            v-model="formData.quantity"
            placeholder="ระบุปริมาณ"
            class="w-full border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring focus:ring-green-200"
          />
        </div>

        <!-- ราคา -->
        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2">ราคา</label>
          <input
            type="number"
            v-model="formData.price"
            placeholder="ระบุราคา"
            class="w-full border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring focus:ring-green-200"
          />
        </div>

        <!-- ระบุสถานที่จัดส่ง -->
        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2">ระบุสถานที่จัดส่ง</label>
          <input
            type="text"
            v-model="formData.deliveryLocation"
            placeholder="กรอกที่อยู่จัดส่ง"
            class="w-full border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring focus:ring-green-200"
          />
        </div>

        <!-- เบอร์ติดต่อ -->
        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2">เบอร์ติดต่อ</label>
          <input
            type="tel"
            v-model="formData.phone"
            placeholder="กรอกเบอร์โทร"
            class="w-full border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring focus:ring-green-200"
          />
        </div>

        <!-- ปุ่มยืนยัน -->
        <button
          type="submit"
          class="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 focus:outline-none focus:ring focus:ring-green-200"
        >
          ยืนยันการสั่งออเดอร์
        </button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      formData: {
        product: '',
        quantity: '',
        price: '',
        deliveryLocation: '',
        phone: '',
      },
    };
  },
  methods: {
    handleSubmit() {
      // ตรวจสอบข้อมูลก่อนส่ง
      if (
        !this.formData.product ||
        !this.formData.quantity ||
        !this.formData.price ||
        !this.formData.deliveryLocation ||
        !this.formData.phone
      ) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }
      alert('การสั่งซื้อสำเร็จ!');
      console.log(this.formData); // ส่งข้อมูลไปยัง backend ได้ที่นี่
    },
  },
};
</script>

<style scoped>
/* สามารถเพิ่ม CSS เพิ่มเติมได้ */
</style>
