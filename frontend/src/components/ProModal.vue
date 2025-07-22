<template>
  <v-dialog v-model="open" max-width="480" persistent>
    <v-card class="pro-modal-card">
      <v-card-text class="text-center py-8">
        <!-- Header -->
        <div class="pro-modal-header mb-6">
          <div class="pro-icon-large mb-4">
            <v-icon size="64" color="primary">mdi-crown</v-icon>
          </div>
          <h2 class="text-h4 font-weight-bold text-gray-900 mb-2">Upgrade to Pro</h2>
          <p class="text-h6 text-gray-600">Unlock the full potential of your supplement safety</p>
        </div>

        <!-- Pricing -->
        <div class="pricing-section mb-6">
          <div class="price-display">
            <span class="price-amount">$9.99</span>
            <span class="price-period">/month</span>
          </div>
        </div>

        <!-- Features -->
        <div class="features-section mb-8">
          <div class="feature-item">
            <v-icon color="success" size="20" class="mr-3">mdi-check-circle</v-icon>
            <div class="feature-content">
              <span class="feature-title">Unlimited Supplement Checks</span>
              <span class="feature-desc">Check as many supplements as you want</span>
            </div>
          </div>
          <div class="feature-item">
            <v-icon color="success" size="20" class="mr-3">mdi-check-circle</v-icon>
            <div class="feature-content">
              <span class="feature-title">Save & Manage Stacks</span>
              <span class="feature-desc">Store your favorite supplement combinations</span>
            </div>
          </div>
          <div class="feature-item">
            <v-icon color="success" size="20" class="mr-3">mdi-check-circle</v-icon>
            <div class="feature-content">
              <span class="feature-title">Detailed Interaction Evidence</span>
              <span class="feature-desc">See scientific research behind each interaction</span>
            </div>
          </div>
          <div class="feature-item">
            <v-icon color="success" size="20" class="mr-3">mdi-check-circle</v-icon>
            <div class="feature-content">
              <span class="feature-title">Alternative Suggestions</span>
              <span class="feature-desc">Get safer supplement recommendations</span>
            </div>
          </div>
          <div class="feature-item">
            <v-icon color="success" size="20" class="mr-3">mdi-check-circle</v-icon>
            <div class="feature-content">
              <span class="feature-title">Priority Support</span>
              <span class="feature-desc">Get help when you need it most</span>
            </div>
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="error-section mb-4">
          <v-alert type="error" variant="tonal" class="mb-3">
            {{ error }}
          </v-alert>
        </div>

        <!-- CTA Buttons -->
        <div class="cta-section">
          <v-btn 
            color="primary" 
            size="x-large" 
            block 
            class="font-weight-bold mb-3"
            @click="startTrial"
            prepend-icon="mdi-crown"
            :loading="loading"
            :disabled="loading"
          >
            Upgrade to Pro
          </v-btn>
          <div class="pro-modal-footer mt-6 text-caption text-grey">
            Cancel anytime
          </div>
          <v-btn 
            text 
            block 
            @click="onClose"
            class="text-gray-600"
          >
            Maybe Later
          </v-btn>
        </div>

        <!-- Trust Indicators -->
        <div class="trust-indicators mt-6">
          <div class="trust-item">
            <v-icon color="success" size="16" class="mr-1">mdi-shield-check</v-icon>
            <span class="text-caption">Secure Payment</span>
          </div>
          <div class="trust-item">
            <v-icon color="info" size="16" class="mr-1">mdi-refresh</v-icon>
            <span class="text-caption">Easy Cancel</span>
          </div>
          <div class="trust-item">
            <v-icon color="warning" size="16" class="mr-1">mdi-headset</v-icon>
            <span class="text-caption">24/7 Support</span>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'

const props = defineProps({ open: Boolean, onClose: Function })
const open = ref(props.open)
const loading = ref(false)
const error = ref('')

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

watch(() => props.open, v => open.value = v)

async function startTrial() {
  loading.value = true
  error.value = ''
  
  try {
    // Get JWT token from localStorage
    const token = localStorage.getItem('jwt')
    if (!token) {
      error.value = 'Please sign in to upgrade to Pro'
      return
    }

    // Create Stripe checkout session
    const response = await axios.post(
      `${API_BASE_URL}/stripe/create-checkout-session`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    // Redirect to Stripe checkout
    window.location.href = response.data.url
  } catch (err) {
    console.error('Stripe checkout error:', err)
    error.value = err.response?.data?.error || 'Failed to start checkout. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pro-modal-card {
  border-radius: 24px;
  overflow: hidden;
}

.pro-modal-header {
  background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
  margin: -32px -32px 32px -32px;
  padding: 32px;
  border-bottom: 1px solid #e2e8f0;
}

.pro-icon-large {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  padding: 20px;
  color: white;
}

.pricing-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
}

.price-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.price-amount {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
}

.price-period {
  font-size: 1.2rem;
  font-weight: 500;
  opacity: 0.9;
}

.features-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  text-align: left;
}

.feature-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-title {
  font-weight: 600;
  color: #1e293b;
  font-size: 1rem;
}

.feature-desc {
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.4;
}

.cta-section .v-btn {
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.025em;
  transition: all 0.2s ease;
}

.cta-section .v-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.trust-indicators {
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.trust-item .text-caption {
  font-weight: 500;
}

@media (max-width: 600px) {
  .pro-modal-card {
    border-radius: 14px !important;
    padding: 8px 2px !important;
    max-width: 100vw !important;
  }
  .pro-modal-header {
    margin: -16px -8px 16px -8px !important;
    padding: 16px !important;
  }
  .pro-icon-large {
    padding: 10px !important;
    font-size: 2rem !important;
  }
  .pricing-section {
    border-radius: 10px !important;
    padding: 12px !important;
    font-size: 1.1rem !important;
  }
  .price-amount {
    font-size: 2rem !important;
  }
  .features-section {
    gap: 8px !important;
  }
  .feature-title {
    font-size: 1rem !important;
  }
  .feature-desc {
    font-size: 0.95rem !important;
  }
  .cta-section {
    margin-top: 10px !important;
  }
  .v-btn {
    width: 100% !important;
    font-size: 1rem !important;
    margin: 8px 0 !important;
  }
  .trust-indicators {
    margin-top: 10px !important;
    gap: 4px !important;
  }
  .trust-item {
    font-size: 0.95rem !important;
    padding: 4px 8px !important;
  }
}
</style> 