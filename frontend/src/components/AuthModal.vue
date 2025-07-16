<template>
  <v-dialog v-model="internalOpen" max-width="420" persistent>
    <v-card>
      <v-card-title class="font-weight-bold text-center">Sign In or Create Account</v-card-title>
      <v-card-text>
        <v-btn block color="primary" class="mb-2" @click="oauth('google')">
          <v-icon left>mdi-google</v-icon> Sign in with Google
        </v-btn>
        <v-btn block color="black" class="mb-4" @click="oauth('apple')">
          <v-icon left>mdi-apple</v-icon> Sign in with Apple
        </v-btn>
        <v-tabs v-model="tab" grow class="mb-2">
          <v-tab value="login">Sign In</v-tab>
          <v-tab value="signup">Sign Up</v-tab>
        </v-tabs>
        <v-window v-model="tab">
          <v-window-item value="login">
            <v-form @submit.prevent="login">
              <v-text-field v-model="loginEmail" label="Email" type="email" required class="mb-2" />
              <v-text-field v-model="loginPassword" label="Password" type="password" required class="mb-2" />
              <v-btn type="submit" color="primary" block :loading="loading">Sign In</v-btn>
              <div v-if="loginError" class="mt-2 text-error">{{ loginError }}</div>
            </v-form>
          </v-window-item>
          <v-window-item value="signup">
            <v-form @submit.prevent="signup">
              <v-text-field v-model="signupEmail" label="Email" type="email" required class="mb-2" />
              <v-text-field v-model="signupPassword" label="Password" type="password" required class="mb-2" />
              <v-btn type="submit" color="primary" block :loading="loading">Sign Up</v-btn>
              <div v-if="signupError" class="mt-2 text-error">{{ signupError }}</div>
            </v-form>
          </v-window-item>
        </v-window>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'
const props = defineProps({ open: Boolean })
const emit = defineEmits(['close', 'auth-success'])
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const tab = ref('login')
const internalOpen = ref(props.open)
watch(() => props.open, v => internalOpen.value = v)
watch(internalOpen, v => { if (!v) emit('close') })
const loginEmail = ref('')
const loginPassword = ref('')
const signupEmail = ref('')
const signupPassword = ref('')
const loginError = ref('')
const signupError = ref('')
const loading = ref(false)
function close() { internalOpen.value = false }
function oauth(provider) {
  window.location.href = `${API_BASE_URL}/auth/${provider}`
}
async function login() {
  loading.value = true
  loginError.value = ''
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, { email: loginEmail.value, password: loginPassword.value })
    emit('auth-success', res.data)
    close()
  } catch (e) {
    loginError.value = e.response?.data?.error || 'Login failed.'
  }
  loading.value = false
}
async function signup() {
  loading.value = true
  signupError.value = ''
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/signup`, { email: signupEmail.value, password: signupPassword.value })
    emit('auth-success', res.data)
    close()
  } catch (e) {
    signupError.value = e.response?.data?.error || 'Signup failed.'
  }
  loading.value = false
}
</script> 