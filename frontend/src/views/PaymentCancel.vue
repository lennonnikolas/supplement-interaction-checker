<template>
  <div class="payment-cancel-page">
    <v-container class="py-12">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card class="cancel-card text-center pa-8" elevation="0">
            <!-- Cancel Icon -->
            <div class="cancel-icon mb-6">
              <v-icon size="80" color="warning">mdi-close-circle</v-icon>
            </div>

            <!-- Cancel Message -->
            <h1 class="text-h3 font-weight-bold text-warning mb-4">
              Payment Cancelled
            </h1>
            
            <p class="text-h6 text-medium-emphasis mb-6">
              No worries! You can upgrade to Pro anytime. Your account remains active with free features.
            </p>

            <!-- Free Features Reminder -->
            <v-card class="features-reminder pa-6 mb-6" variant="outlined">
              <h3 class="text-h5 font-weight-semibold mb-4">You still have access to:</h3>
              <v-list class="bg-transparent">
                <v-list-item prepend-icon="mdi-check-circle" color="success">
                  <v-list-item-title>Basic Supplement Checks</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-check-circle" color="success">
                  <v-list-item-title>Interaction Analysis</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-check-circle" color="success">
                  <v-list-item-title>Safety Information</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-minus-circle" color="grey">
                  <v-list-item-title class="text-grey">Unlimited Checks (Pro)</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-minus-circle" color="grey">
                  <v-list-item-title class="text-grey">Save Stacks (Pro)</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <v-btn 
                color="primary" 
                size="large" 
                class="font-weight-bold mb-3"
                @click="tryAgain"
                prepend-icon="mdi-crown"
              >
                Try Pro Again
              </v-btn>
              
              <v-btn 
                variant="outlined" 
                size="large" 
                @click="goToHome"
                prepend-icon="mdi-home"
              >
                Continue with Free
              </v-btn>
            </div>

            <!-- Additional Info -->
            <div class="additional-info mt-8">
              <p class="text-caption text-medium-emphasis">
                Questions about Pro? Contact our support team.
              </p>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function tryAgain() {
  // Close this page and show the Pro modal again
  router.push('/')
  // You could emit an event to show the Pro modal
}

function goToHome() {
  router.push('/')
}
</script>

<style scoped>
.payment-cancel-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
}

.cancel-card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.cancel-icon {
  display: inline-block;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
  align-items: center;
}
.action-buttons .v-btn {
  width: 100%;
  max-width: 320px;
}

@media (max-width: 600px) {
  .action-buttons .v-btn {
    width: 100%;
    max-width: 100%;
  }
}

.additional-info {
  border-top: 1px solid #e2e8f0;
  padding-top: 24px;
}
</style> 