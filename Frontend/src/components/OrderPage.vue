<template>
  <div class="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
    <!-- หัวข้อ -->
    <h1 class="text-2xl sm:text-3xl font-semibold text-gray-800 text-center mb-6">
      สั่งซื้อสินค้า OUNG BEEF
    </h1>

    <!-- ส่วนแสดงสินค้า -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="product in products"
        :key="product.id"
        class="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <div class="p-4">
          <h2 class="text-lg sm:text-xl font-semibold text-gray-800">{{ product.product_name }}</h2>
          <p class="text-gray-600">฿{{ product.price }}/กิโลกรัม</p>
          <p class="text-sm text-gray-500">คงเหลือ: {{ product.quantity }} กิโลกรัม</p>
          <div class="mt-4">
            <label for="quantity" class="block text-gray-700">ระบุน้ำหนัก (กิโลกรัม):</label>
            <input
              type="number"
              v-model.number="product.inputQuantity"
              min="0.5"
              step="0.1"
              class="w-full mt-2 border rounded-lg px-2 py-1"
            />
          </div>
          <button
            @click="addToCart(product)"
            class="w-full mt-4 bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600"
          >
            เพิ่มลงตะกร้า
          </button>
        </div>
      </div>
    </div>

    <!-- Icon Cart ที่ลอย -->
    <div class="fixed top-8 right-8 z-50">
      <button
        @click="toggleCartDropdown"
        class="relative text-gray-800 hover:text-orange-600 border-4 border-white rounded-full p-3 bg-white shadow-lg"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-12 h-12"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19.5 9.5L18.7896 6.89465C18.5157 5.89005 18.3787 5.38775 18.0978 5.00946C17.818 4.63273 17.4378 4.34234 17.0008 4.17152C16.5619 4 16.0413 4 15 4M4.5 9.5L5.2104 6.89465C5.48432 5.89005 5.62128 5.38775 5.90221 5.00946C6.18199 4.63273 6.56216 4.34234 6.99922 4.17152C7.43808 4 7.95872 4 9 4" stroke="#000000" stroke-width="1.5"></path> <path d="M9 4C9 3.44772 9.44772 3 10 3H14C14.5523 3 15 3.44772 15 4C15 4.55228 14.5523 5 14 5H10C9.44772 5 9 4.55228 9 4Z" stroke="#000000" stroke-width="1.5"></path> <path d="M8 13V17" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M16 13V17" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M12 13V17" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M3.864 16.4552C4.40967 18.6379 4.68251 19.7292 5.49629 20.3646C6.31008 21 7.435 21 9.68486 21H14.3155C16.5654 21 17.6903 21 18.5041 20.3646C19.3179 19.7292 19.5907 18.6379 20.1364 16.4552C20.9943 13.0234 21.4233 11.3075 20.5225 10.1538C19.6217 9 17.853 9 14.3155 9H9.68486C6.14745 9 4.37875 9 3.47791 10.1538C2.94912 10.831 2.87855 11.702 3.08398 13"
          />
        </svg>
        <!-- แสดงจำนวนสินค้าในตะกร้า -->
        <span
          v-if="cart.length > 0"
          class="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
        >
          {{ cart.length }}
        </span>
      </button>

      <!-- Dropdown Cart -->
      <div
        v-if="showCartDropdown"
        class="absolute right-0 mt-2 w-72 bg-white shadow-lg rounded-lg p-4 z-10"
      >
        <h3 class="text-lg font-semibold text-gray-800 mb-4">ตะกร้าสินค้า</h3>
        <div v-if="cart.length === 0" class="text-gray-600 text-center">
          ไม่มีสินค้าในตะกร้า
        </div>
        <div v-else>
          <div
            v-for="(item, index) in cart"
            :key="index"
            class="flex justify-between items-center mb-4"
          >
            <div>
              <p class="font-medium text-gray-800">{{ item.name }}</p>
              <p class="text-gray-600">
                ฿{{ item.price }} x {{ item.quantity }} กิโลกรัม
              </p>
            </div>
            <button
              @click="removeFromCart(index)"
              class="text-red-500 hover:text-red-600 font-bold"
            >
              ลบ
            </button>
          </div>
          <hr class="my-4" />
          <div class="flex justify-between font-medium text-gray-800">
            <p>ยอดรวม:</p>
            <p>฿{{ totalPrice.toFixed(2) }}</p>
          </div>
          <button
            @click="checkout"
            class="w-full mt-4 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600"
          >
            ยืนยันการสั่งซื้อ
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
export default {
  data() {
    return {
      products: [], // รายการสินค้า
      cart: [], // รายการในตะกร้า
      showCartDropdown: false, // ใช้แสดง/ซ่อน dropdown
      userId: 1, // จำลองข้อมูลผู้ใช้
    };
  },
  computed: {
    // คำนวณยอดรวมในตะกร้า
    totalPrice() {
      return this.cart.reduce((total, item) => total + item.price * item.quantity, 0);
    },
  },
  methods: {
    // ดึงข้อมูลสินค้า
    async fetchProducts() {
      try {
        const response = await fetch("http://192.168.0.108:8888/products");
        this.products = await response.json();
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    },
    // เพิ่มสินค้าเข้าตะกร้า
    addToCart(product) {
  // ตรวจสอบให้แน่ใจว่าได้ระบุน้ำหนักและไม่เป็นค่าต่ำกว่าหรือเท่ากับ 0
  if (!product.inputQuantity || product.inputQuantity <= 0) {
    alert("กรุณาระบุน้ำหนักให้ถูกต้อง");
    return;
  }

  // ตรวจสอบหาสินค้าในตะกร้าโดยใช้แค่ id ของสินค้า
  const existingItem = this.cart.find((item) => item.id === product.id && item.inputQuantity === product.inputQuantity);

  if (existingItem) {
    existingItem.quantity += product.inputQuantity;
  } else {
    // ถ้ายังไม่มีก็เพิ่มสินค้าใหม่ในตะกร้า
    this.cart.push({
      id: product.id,
      name: product.product_name,
      price: product.price,
      quantity: product.inputQuantity,

    });
  }
      product.inputQuantity = 0; // รีเซ็ต
    },
    // ลบสินค้าออกจากตะกร้า
    removeFromCart(index) {
      this.cart.splice(index, 1);
    },
    // แสดง/ซ่อน dropdown
    toggleCartDropdown() {
      this.showCartDropdown = !this.showCartDropdown;
    },
    // ส่งคำสั่งซื้อไปยัง backend
    async checkout() {
    try {
      const response = await fetch("http://192.168.0.108:8888/checkout", {
        cart: this.cart,
      });

      alert("การสั่งซื้อเสร็จสมบูรณ์! รหัสคำสั่งซื้อ: " + response.data.orderId);

      // รีเซ็ตตะกร้าสินค้า
      this.cart = [];
      this.showCartDropdown = false;

      // เปลี่ยนเส้นทางไปหน้าประวัติการสั่งซื้อ
      this.$router.push("/order-history");
    } catch (error) {
      console.error("Error during checkout:", error);
      alert("เกิดข้อผิดพลาดระหว่างการสั่งซื้อ");
    }
  },
},
  mounted() {
    this.fetchProducts();
  },
};
</script>

