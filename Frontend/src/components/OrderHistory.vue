<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
      <!-- หัวข้อ -->
      <h1 class="text-2xl font-bold text-gray-800 text-center mb-4">OUNG BEEF SHOP</h1>
      <h2 class="text-lg font-semibold text-gray-700 text-center mb-6">ประวัติการสั่งซื้อของฉัน</h2>

      <!-- รายการสั่งซื้อ -->
      <div class="border border-gray-300 rounded-lg p-4">
        <!-- ชื่อผู้สั่ง -->
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center">
            <img
              src="https://via.placeholder.com/40"
              alt="Profile"
              class="w-10 h-10 rounded-full mr-3"
            />
            <span class="text-gray-800 font-medium">Leo</span>
          </div>
          <span class="text-gray-500 text-sm">วันที่ 20/05/2567</span>
        </div>

        <!-- รายละเอียดการสั่งซื้อ -->
        <div class="text-gray-700 text-sm space-y-2">
          <p><strong>สินค้าที่สั่ง:</strong> เนื้อวัวเกรด A</p>
          <p><strong>ปริมาณที่สั่ง (กิโลกรัม):</strong> 2</p>
          <p><strong>ราคาที่สั่ง:</strong> 1,200 บาท</p>
          <p><strong>ที่จัดส่งสินค้า:</strong> 123/45 หมู่ 1 ถ.สุขุมวิท กรุงเทพฯ</p>
          <p><strong>เบอร์โทร:</strong> 081-234-5678</p>
          <p><strong>การชำระเงิน:</strong> โอนผ่านธนาคาร</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      orderHistory: {
        name: "Leo",
        date: "20/05/2567",
        product: "เนื้อวัวเกรด A",
        quantity: 2,
        price: "1,200 บาท",
        deliveryLocation: "123/45 หมู่ 1 ถ.สุขุมวิท กรุงเทพฯ",
        phone: "081-234-5678",
        paymentMethod: "โอนผ่านธนาคาร",
      },
    };
  },
};
</script>

<style scoped>
/* สามารถเพิ่ม CSS เฉพาะสำหรับหน้าได้ */
</style>
