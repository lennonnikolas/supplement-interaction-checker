<template>
  <v-card class="mb-3" outlined>
    <v-card-title>Get Monthly Supplement Safety Updates</v-card-title>
    <v-card-text>
      <v-form @submit.prevent="submit">
        <v-text-field v-model="email" label="Email" type="email" required :rules="[v => !!v || 'Email required', v => /.+@.+\..+/.test(v) || 'Invalid email']" />
        <v-btn type="submit" color="primary" :loading="loading" :disabled="loading || !email">Subscribe</v-btn>
      </v-form>
      <div v-if="message" class="mt-2 text-success">{{ message }}</div>
      <div v-if="error" class="mt-2 text-error">{{ error }}</div>
    </v-card-text>
  </v-card>
</template>
<script setup>
import { ref } from 'vue'
import axios from 'axios'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const email = ref('')
const loading = ref(false)
const message = ref('')
const error = ref('')
async function submit() {
  loading.value = true
  message.value = ''
  error.value = ''
  try {
    const res = await axios.post(`${API_BASE_URL}/subscribe`, { email: email.value })
    message.value = res.data.message
    email.value = ''
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to subscribe.'
  }
  loading.value = false
}
</script>
<style scoped>
@media (max-width: 600px) {
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