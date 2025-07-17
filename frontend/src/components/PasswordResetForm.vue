<template>
  <v-container class="d-flex align-center justify-center min-h-screen">
    <v-card max-width="420" class="w-100">
      <v-card-title class="font-weight-bold text-center">Set a New Password</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-text-field
            v-model="password"
            label="New Password"
            type="password"
            required
            :rules="passwordRules"
            autofocus
          />
          <v-text-field
            v-model="confirmPassword"
            label="Confirm Password"
            type="password"
            required
            :rules="[v => v === password || 'Passwords do not match']"
          />
          <v-btn type="submit" color="primary" :loading="loading" block class="mt-4" :disabled="loading || !password || !confirmPassword">
            Reset Password
          </v-btn>
        </v-form>
        <div v-if="message" class="mt-4 text-success text-center">{{ message }}</div>
        <div v-if="error" class="mt-4 text-error text-center">{{ error }}</div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const message = ref('')
const error = ref('')
const passwordRules = [v => !!v || 'Password required', v => v.length >= 6 || 'Min 6 characters']
const token = ref('')

onMounted(() => {
  token.value = route.query.token || ''
  if (!token.value) {
    error.value = 'Invalid or missing reset token.'
  }
})

async function submit() {
  if (!token.value) {
    error.value = 'Invalid or missing reset token.'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  message.value = ''
  error.value = ''
  try {
    const res = await axios.post('/api/password-reset/reset', { token: token.value, password: password.value })
    message.value = res.data.message
    setTimeout(() => router.push('/'), 2000)
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to reset password.'
  }
  loading.value = false
}
</script>

<style scoped>
@media (max-width: 600px) {
  .v-container {
    padding-left: 4px !important;
    padding-right: 4px !important;
  }
  .v-card {
    border-radius: 12px !important;
    padding: 8px 0 !important;
    margin-bottom: 14px !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  .v-card-title {
    font-size: 1.1rem !important;
    padding: 10px 8px !important;
  }
  .v-card-text {
    padding: 8px 8px !important;
  }
  .v-btn {
    width: 100% !important;
    font-size: 1rem !important;
    margin: 8px 0 !important;
  }
  .text-success, .text-error {
    font-size: 0.98rem !important;
  }
}
</style> 