<template>
  <div class="oauth-success-container">
    <v-container class="d-flex align-center justify-center" style="min-height: 60vh;">
      <v-card class="text-center pa-8" max-width="400">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
          class="mb-4"
        ></v-progress-circular>
        
        <h2 class="text-h4 font-weight-bold mb-4">
          Completing Sign-in...
        </h2>
        
        <p class="text-body-1 text-medium-emphasis">
          Please wait while we complete your authentication.
        </p>
      </v-card>
    </v-container>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

onMounted(() => {
  const token = route.query.token
  
  if (token) {
    // Store the token - App.vue will handle the rest
    localStorage.setItem('jwt', token)
    
    // Remove token from URL for security
    window.history.replaceState({}, document.title, '/oauth-success')
    
    // Redirect to home - App.vue will detect the token and load user
    setTimeout(() => {
      router.push('/')
    }, 1000)
  } else {
    // No token, redirect to home
    router.push('/')
  }
})
</script>

<style scoped>
.oauth-success-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}
</style> 