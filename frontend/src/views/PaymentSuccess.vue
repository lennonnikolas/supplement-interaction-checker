<template>
  <div class="payment-success-page">
    <v-container class="py-12">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card class="success-card text-center pa-8" elevation="0">
            <!-- Success Icon -->
            <div class="success-icon mb-6">
              <v-icon size="80" color="success">mdi-check-circle</v-icon>
            </div>

            <!-- Success Message -->
            <h1 class="text-h3 font-weight-bold text-success mb-4">
              Welcome to Pro!
            </h1>
            
            <p class="text-h6 text-medium-emphasis mb-6">
              Your subscription has been activated successfully. You now have access to all Pro features.
            </p>

            <!-- Pro Features Reminder -->
            <v-card class="features-reminder pa-6 mb-6" variant="outlined">
              <h3 class="text-h5 font-weight-semibold mb-4">Your Pro Benefits:</h3>
              <v-list class="bg-transparent">
                <v-list-item prepend-icon="mdi-check-circle" color="success">
                  <v-list-item-title>Unlimited Supplement Checks</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-check-circle" color="success">
                  <v-list-item-title>Save & Manage Stacks</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-check-circle" color="success">
                  <v-list-item-title>Detailed Interaction Evidence</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-check-circle" color="success">
                  <v-list-item-title>Alternative Suggestions</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-check-circle" color="success">
                  <v-list-item-title>Priority Support</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <v-btn 
                color="primary" 
                size="large" 
                class="font-weight-bold mb-3"
                @click="goToHome"
                prepend-icon="mdi-home"
              >
                Start Using Pro Features
              </v-btn>
              
              <v-btn 
                variant="outlined" 
                size="large" 
                @click="goToProfile"
                prepend-icon="mdi-account"
              >
                Manage Subscription
              </v-btn>
            </div>

            <!-- Additional Info -->
            <div class="additional-info mt-8">
              <p class="text-caption text-medium-emphasis">
                You'll receive a confirmation email shortly. 
                Your subscription will automatically renew each month.
              </p>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // You could verify the session_id here if needed
  const urlParams = new URLSearchParams(window.location.search)
  const sessionId = urlParams.get('session_id')
})

function goToHome() {
  router.push('/')
}

function goToProfile() {
  router.push('/profile')
}
</script>

<style scoped>
.payment-success-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
}

.success-card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.success-icon {
  display: inline-block;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  padding: 20px;
  color: white;
}

.features-reminder {
  border-radius: 16px;
  border-color: #e2e8f0;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.additional-info {
  border-top: 1px solid #e2e8f0;
  padding-top: 24px;
}
</style> 