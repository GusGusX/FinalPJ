<template>
  <div class="profile-page p-4 sm:p-8">
    <h1 class="text-2xl sm:text-3xl font-bold mb-8 text-center sm:text-left">โปรไฟล์ผู้ใช้งาน</h1>
    <div class="flex flex-col items-center sm:flex-row sm:items-start mb-6">
      <img
        src="https://via.placeholder.com/80"
        alt="User Avatar"
        class="rounded-full border mb-4 sm:mb-0 sm:mr-4"
        width="80"
        height="80"
      />
      <h2 class="text-lg sm:text-xl font-semibold">ผู้ใช้งาน</h2>
    </div>
    <div class="bg-gray-100 rounded-lg shadow-lg p-4 sm:p-6">
      <form @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-gray-700 font-medium mb-2">ชื่อ:</label>
            <div class="flex items-center bg-white p-2 rounded-md border">
              <input
                v-model="user.firstName"
                type="text"
                class="flex-1 outline-none text-gray-800"
              />
              <button type="button" class="text-gray-500 hover:text-blue-500">
                ✏️
              </button>
            </div>
          </div>
          <div>
            <label class="block text-gray-700 font-medium mb-2">นามสกุล:</label>
            <div class="flex items-center bg-white p-2 rounded-md border">
              <input
                v-model="user.lastName"
                type="text"
                class="flex-1 outline-none text-gray-800"
              />
              <button type="button" class="text-gray-500 hover:text-blue-500">
                ✏️
              </button>
            </div>
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2">ที่อยู่:</label>
          <div class="flex items-center bg-white p-2 rounded-md border">
            <input
              v-model="user.address"
              type="text"
              class="flex-1 outline-none text-gray-800"
            />
            <button type="button" class="text-gray-500 hover:text-blue-500">
              ✏️
            </button>
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2">เบอร์โทร:</label>
          <div class="flex items-center bg-white p-2 rounded-md border">
            <input
              v-model="user.phone"
              type="text"
              class="flex-1 outline-none text-gray-800"
            />
            <button type="button" class="text-gray-500 hover:text-blue-500">
              ✏️
            </button>
          </div>
        </div>
        <button
          type="submit"
          class="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md w-full"
        >
          ยืนยันแก้ไขข้อมูล
        </button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: "ProfilePage",
  data() {
    return {
      user: {
        firstName: "อัง-มิน",
        lastName: "ชอน",
        address: "1 ม.1 อ.เมือง ต.อิสาณ จ.บุรีรัมย์",
        phone: "0935722000",
      },
    };
  },
  methods: {
    handleSubmit() {
      alert("บันทึกข้อมูลสำเร็จ!");
      console.log(this.user);
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
