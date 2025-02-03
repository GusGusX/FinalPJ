<template>
  <div class="profile-page p-4 sm:p-8 bg-gray-50 min-h-screen">
    <h1 class="text-2xl sm:text-3xl font-bold mb-8 text-center sm:text-left text-green-600">โปรไฟล์ผู้ใช้งาน</h1>
    <div class="flex flex-col items-center sm:flex-row sm:items-start mb-6">
      <img
        :src="user.pictureUrl"
        alt="User Avatar"
        class="rounded-full border-4 border-green-500 mb-4 sm:mb-0 sm:mr-4"
        width="80"
        height="80"
      />
      <h2 class="text-lg sm:text-xl font-semibold text-gray-800">{{ user.displayName || 'ผู้ใช้งาน' }}</h2>
    </div>
    <div class="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <form @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2">ชื่อ:</label>
          <div class="flex items-center bg-gray-100 p-2 rounded-md border border-gray-200">
            <input
              v-model="user.firstName"
              type="text"
              class="flex-1 outline-none text-gray-800 bg-transparent"
              :readonly="!isEditing"
            />
            <button type="button" class="text-gray-500 hover:text-green-600" @click="toggleEdit">
              {{ isEditing ? '💾' : '✏️' }}
            </button>
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2">ที่อยู่:</label>
          <div class="flex items-center bg-gray-100 p-2 rounded-md border border-gray-200">
            <input
              v-model="user.address"
              type="text"
              class="flex-1 outline-none text-gray-800 bg-transparent"
              :readonly="!isEditing"
            />
            <button type="button" class="text-gray-500 hover:text-green-600" @click="toggleEdit">
              {{ isEditing ? '💾' : '✏️' }}
            </button>
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2">เบอร์โทร:</label>
          <div class="flex items-center bg-gray-100 p-2 rounded-md border border-gray-200">
            <input
              v-model="user.phone"
              type="text"
              class="flex-1 outline-none text-gray-800 bg-transparent"
              :readonly="!isEditing"
            />
            <button type="button" class="text-gray-500 hover:text-green-600" @click="toggleEdit">
              {{ isEditing ? '💾' : '✏️' }}
            </button>
          </div>
        </div>
        <button
          type="submit"
          class="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md w-full"
          :class="{ 'opacity-50 cursor-not-allowed': !isEditing }"
          :disabled="!isEditing"
        >
          ยืนยันแก้ไขข้อมูล
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import liff from '@line/liff';

export default {
  name: "ProfilePage",
  data() {
    return {
      user: {
        displayName: "", // ชื่อที่ได้จาก LIFF
        pictureUrl: "", // URL รูปภาพจาก LIFF
        firstName: "", // ชื่อ
        address: "", // ที่อยู่
        phone: "", // เบอร์โทร
      },
      isEditing: false, // สถานะการแก้ไข
    };
  },
  async created() {
    await this.initializeLiff();
  },
  methods: {
    async initializeLiff() {
      try {
        // Initialize LIFF
        await liff.init({ liffId: '2006452709-NJ2Qkk3o' }); // ใส่ LIFF ID ของคุณตรงนี้

        // ตรวจสอบการ Login
        if (!liff.isLoggedIn()) {
          liff.login(); // ถ้ายังไม่ล็อกอิน ให้ล็อกอิน
          return;
        }

        // ดึงข้อมูลโปรไฟล์ผู้ใช้
        const profile = await liff.getProfile();

        // นำข้อมูลโปรไฟล์มาใส่ใน user
        this.user.displayName = profile.displayName;
        this.user.pictureUrl = profile.pictureUrl;

        // ใช้ชื่อจาก displayName เป็น firstName
        this.user.firstName = profile.displayName || '';

      } catch (error) {
        console.error('LIFF Error:', error);
      }
    },
    toggleEdit() {
      this.isEditing = !this.isEditing;
    },
    handleSubmit() {
      if (this.isEditing) {
        alert("บันทึกข้อมูลสำเร็จ!");
        console.log('ข้อมูลที่บันทึก:', this.user);
        this.isEditing = false;
      }
    },
  },
};
</script>

<style scoped>
.profile-page {
  background-color: #f9fafb;
  min-height: 100vh;
}

form input {
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 4px;
}
</style>
