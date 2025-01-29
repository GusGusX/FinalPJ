<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div v-if="!user" class="bg-white p-8 rounded-lg shadow-md text-center">
      <h1 class="text-2xl font-bold mb-4">Welcome to LIFF App</h1>
      <p class="mb-6">Please login with your LINE account to continue.</p>
      <button
        @click="login"
        class="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition duration-300"
      >
        Login with LINE
      </button>
    </div>

    <div v-else class="text-center">
      <h1 class="text-2xl font-bold mb-4">Login Successful!</h1>
      <p class="mb-6">Redirecting to Home Page...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import liff from '@line/liff';
import { useRouter } from 'vue-router';

const user = ref(null);
const router = useRouter();

const login = async () => {
  try {
    const liffId = '2006452709-NJ2Qkk3o';

    // ตรวจสอบว่า liffId มีค่าหรือไม่
    if (!liffId) {
      throw new Error('LIFF ID is not defined in environment variables.');
    }

    // Initialize LIFF
    await liff.init({
      liffId: liffId,
      withLoginOnExternalBrowser: true,
    });

    // ตรวจสอบการ Login
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    // ดึงข้อมูลผู้ใช้
    const profile = await liff.getProfile();
    user.value = profile;

    // Redirect ไปหน้า Home หลังจาก Login สำเร็จ
    setTimeout(() => {
      router.push('/home');
    }, 2000); // หน่วงเวลา 2 วินาที

  } catch (error) {
    console.error('LIFF Error:', error);
  }
};

onMounted(() => {
  // ตรวจสอบว่าเป็น LINE ในตัวหรือไม่
  if (liff.isInClient()) {
    login();
  } else {
    console.warn('This app is not running inside the LINE app.');
  }
});
</script>
