<template>
  <v-dialog v-model="open" max-width="420">
    <v-card>
      <v-card-title class="font-weight-bold text-center">Reset Your Password</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            required
            :rules="emailRules"
            autofocus
          />
          <v-btn type="submit" color="primary" :loading="loading" block class="mt-4" :disabled="loading || !email">
            Send Reset Link
          </v-btn>
        </v-form>
        <div v-if="message" class="mt-4 text-success text-center">{{ message }}</div>
        <div v-if="error" class="mt-4 text-error text-center">{{ error }}</div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="onClose">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'
const props = defineProps({ open: Boolean, onClose: Function })
const open = ref(props.open)
watch(() => props.open, v => open.value = v)

const email = ref('')
const loading = ref(false)
const message = ref('')
const error = ref('')
const emailRules = [v => !!v || 'Email required', v => /.+@.+\..+/.test(v) || 'Invalid email']

async function submit() {
  loading.value = true
  message.value = ''
  error.value = ''
  try {
    const res = await axios.post('/api/password-reset/request', { email: email.value })
    message.value = res.data.message
    email.value = ''
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to send reset email.'
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