<template>
  <v-container class="py-8 pt-app-bar" max-width="600">
    <v-card class="mb-6" outlined>
      <v-card-title class="font-weight-bold">Profile</v-card-title>
      <v-card-text>
        <div v-if="user">
          <div><strong>Email:</strong> {{ user.email }}</div>
          <div class="mt-3">
            <strong>Subscription Status:</strong> 
            <v-chip 
              :color="subscriptionStatus.is_pro ? 'success' : 'grey'" 
              :text="subscriptionStatus.is_pro ? 'Pro' : 'Free'"
              class="ml-2"
            />
          </div>
          
          <!-- Pro User Actions -->
          <div v-if="subscriptionStatus.is_pro" class="mt-4">
            <v-alert type="success" variant="tonal" class="mb-4">
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-crown</v-icon>
                <span>You have an active Pro subscription!</span>
              </div>
            </v-alert>
            
            <v-btn 
              color="error" 
              variant="outlined"
              @click="cancelSubscription"
              :loading="canceling"
              prepend-icon="mdi-cancel"
            >
              Cancel Subscription
            </v-btn>
          </div>
          
          <!-- Free User Actions -->
          <div v-else class="mt-4">
            <v-btn 
              color="primary" 
              @click="upgradeToPro"
              prepend-icon="mdi-crown"
            >
              Upgrade to Pro
            </v-btn>
          </div>
        </div>
        <div v-else>
          <div>Please sign in to view your profile.</div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Subscription Management Dialog -->
    <v-dialog v-model="cancelDialog" max-width="400">
      <v-card>
        <v-card-title>Cancel Subscription</v-card-title>
        <v-card-text>
          <p>Are you sure you want to cancel your Pro subscription?</p>
          <p class="text-caption text-medium-emphasis">
            Your subscription will remain active until the end of the current billing period.
          </p>
        </v-card-text>
        <v-card-actions class="cancel-actions">
          <v-btn text @click="cancelDialog = false">Keep</v-btn>
          <v-btn 
            color="error" 
            @click="confirmCancel"
            :loading="canceling"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Rest of the component remains the same -->
    <v-card v-if="user" outlined class="mb-6">
      <v-card-title class="font-weight-bold">Your Saved Stacks</v-card-title>
      <v-card-text>
        <div v-if="stacks.length === 0" class="text-grey">No stacks saved yet.</div>
        <v-expansion-panels v-else multiple>
          <v-expansion-panel v-for="stack in stacks" :key="stack.id">
            <v-expansion-panel-title>
              <span class="font-weight-bold">{{ stack.name || 'Untitled Stack' }}</span>
              <span class="ml-2 text-caption">({{ formatDate(stack.created_at) }})</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div><strong>Supplements:</strong> {{ stack.stack_data && stack.stack_data.length ? stack.stack_data.join(', ') : JSON.stringify(stack.stack_data) }}</div>
              <v-btn color="primary" class="mt-2 mr-2" @click="rerunStack(stack)">Re-run</v-btn>
              <v-btn color="error" class="mt-2 mr-2" @click="deleteStack(stack.id)">Delete</v-btn>
              <v-btn 
                color="secondary" 
                class="mt-2 mr-2" 
                @click="exportReport(stack)"
                :disabled="!history.some(h => h.stack_id === stack.id && h.result)"
                :title="!history.some(h => h.stack_id === stack.id && h.result) ? 'Analyze this stack before exporting.' : ''"
              >
                Export as PDF
              </v-btn>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
    </v-card>
    <v-card v-if="user" outlined class="mb-6">
      <v-card-title class="font-weight-bold">Stack Usage Timeline</v-card-title>
      <v-card-text>
        <div v-if="history.length === 0" class="text-grey">No stack usage history yet.</div>
        <v-timeline v-else>
          <v-timeline-item v-for="h in history" :key="h.id" :dot-color="'primary'" :icon="'mdi-clock-outline'">
            <div><strong>{{ h.name || 'Untitled Stack' }}</strong> ({{ formatDate(h.checked_at) }})</div>
            <div class="text-caption">Supplements: {{ h.stack_data && h.stack_data.length ? h.stack_data.join(', ') : JSON.stringify(h.stack_data) }}</div>
            <div v-if="h.result"><strong>Result:</strong> <span class="text-caption">{{ summarizeResult(h.result) }}</span></div>
          </v-timeline-item>
        </v-timeline>
      </v-card-text>
    </v-card>
    <v-card v-if="user && subscriptionStatus.is_pro" outlined>
      <v-card-title class="font-weight-bold">Pro Features</v-card-title>
      <v-card-text>
        <ul class="pro-features-list mb-4">
          <li class="pro-feature-item">Advanced Interaction Analysis</li>
          <li class="pro-feature-item">Stack History & Library</li>
          <li class="pro-feature-item">Personal Health Profile Customization</li>
          <li class="pro-feature-item">PDF / Shareable Reports</li>
          <li class="pro-feature-item">Unlimited Searches</li>
          <li class="pro-feature-item">Unlimited Supplement Comparisons</li>
        </ul>
      </v-card-text>
    </v-card>
    <v-card v-if="user && subscriptionStatus.is_pro" outlined>
      <v-card-title class="font-weight-bold">Coming Soon!</v-card-title>
      <v-card-text>
        <ul class="pro-features-list mb-4">
          <li class="pro-feature-item">Stack Optimizer</li>
          <li class="pro-feature-item">Personal Health Profile Customization</li>
          <li class="pro-feature-item">AI Chat / Assistant</li>
          <li class="pro-feature-item">Priority Feature Voting / Feedback</li>
        </ul>
      </v-card-text>
    </v-card>
    <v-btn class="mt-6" color="secondary" to="/">Back to Home</v-btn>
  </v-container>
  <v-snackbar v-model="reportSnackbar" color="error" timeout="3000">{{ reportSnackbarMsg }}</v-snackbar>
  <v-snackbar v-model="cancelSnackbar" :color="cancelSnackbarColor" timeout="5000">{{ cancelSnackbarMsg }}</v-snackbar>
</template>

<script setup>
import { computed, ref, onMounted, onActivated, inject, watch } from 'vue'
import { useRerunStackStore } from '../stores/rerunStack'
import { useRouter } from 'vue-router'
import axios from 'axios'

const rerunStackStore = useRerunStackStore()
const router = useRouter()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const BACKEND_BASE_URL = 'https://supplement-checker-backend-app-1911eb207802.herokuapp.com';

// Get user from App.vue
const user = inject('user', ref(null))
const isPro = inject('isPro', ref(false))
const refreshSubscriptionStatus = inject('refreshSubscriptionStatus', () => {})
const setGlobalLoading = inject('setGlobalLoading', () => {})

// Local state - sync with global isPro state
const subscriptionStatus = computed(() => ({
  is_pro: isPro.value,
  status: isPro.value ? 'active' : 'inactive',
  plan_type: isPro.value ? 'pro' : 'free'
}))
const canceling = ref(false)
const cancelDialog = ref(false)
const stacks = ref([])
const history = ref([])
const reportDialog = ref(false)
const reportUrl = ref('')
const reportSnackbar = ref(false)
const reportSnackbarMsg = ref('')
const cancelSnackbar = ref(false)
const cancelSnackbarMsg = ref('')
const cancelSnackbarColor = ref('success')
// Add a ref for the hidden download link
const pdfDownloadLink = ref(null)

// Fetch subscription status and update global state
async function fetchSubscriptionStatus() {
  setGlobalLoading(true)
  try {
    await refreshSubscriptionStatus()
  } finally {
    setGlobalLoading(false)
  }
}

// Upgrade to Pro
function upgradeToPro() {
  // This will be handled by the ProModal in App.vue
  router.push('/')
  // You could emit an event to show the Pro modal
}

// Cancel subscription
function cancelSubscription() {
  cancelDialog.value = true
}

async function confirmCancel() {
  canceling.value = true
  setGlobalLoading(true)
  try {
    const token = localStorage.getItem('jwt')
    await axios.post(`${API_BASE_URL}/stripe/cancel-subscription`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // Wait a moment for the webhook to process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Refresh subscription status from the server
    await refreshSubscriptionStatus()
    
    // Double-check the status
    const response = await axios.get(`${API_BASE_URL}/stripe/subscription-status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    cancelDialog.value = false
    
    // Show success message
    cancelSnackbarMsg.value = 'Subscription cancelled successfully. You will have access until the end of your current billing period.'
    cancelSnackbarColor.value = 'success'
    cancelSnackbar.value = true
    
  } catch (err) {
    console.error('Failed to cancel subscription:', err)
    cancelSnackbarMsg.value = 'Failed to cancel subscription. Please try again.'
    cancelSnackbarColor.value = 'error'
    cancelSnackbar.value = true
  } finally {
    canceling.value = false
    setGlobalLoading(false)
  }
}

// Rest of the existing functions
async function fetchStacks() {
  setGlobalLoading(true)
  try {
    const jwt = localStorage.getItem('jwt')
    const resp = await axios.get(`${API_BASE_URL}/stacks`, { headers: { Authorization: `Bearer ${jwt}` } })
    stacks.value = resp.data.stacks || []
  } finally {
    setGlobalLoading(false)
  }
}

async function fetchHistory() {
  setGlobalLoading(true)
  try {
    const jwt = localStorage.getItem('jwt')
    const resp = await axios.get(`${API_BASE_URL}/stacks/history`, { headers: { Authorization: `Bearer ${jwt}` } })
    history.value = resp.data.history || []
  } finally {
    setGlobalLoading(false)
  }
}

function formatDate(date) {
  return new Date(date).toLocaleString()
}

function summarizeResult(result) {
  if (!result) return ''
  if (typeof result === 'string') return result.slice(0, 80) + (result.length > 80 ? '...' : '')
  if (Array.isArray(result.interactions)) return `${result.interactions.length} interactions`;
  return JSON.stringify(result).slice(0, 80) + '...'
}

async function deleteStack(id) {
  if (!confirm('Delete this stack?')) return
  setGlobalLoading(true)
  try {
    const jwt = localStorage.getItem('jwt')
    await axios.delete(`${API_BASE_URL}/stacks/${id}`, { headers: { Authorization: `Bearer ${jwt}` } })
    await fetchStacks()
    await fetchHistory()
  } finally {
    setGlobalLoading(false)
  }
}

async function rerunStack(stack) {
  rerunStackStore.setRerunStack(stack.stack_data, stack.id)
  await router.push('/')
  // Wait a moment for the analysis to complete, then refresh history
  setTimeout(() => {
    fetchHistory()
  }, 1500)
}

async function exportReport(stack) {
  const hist = history.value.find(h => h.stack_id === stack.id && h.result)
  if (!hist) {
    reportSnackbarMsg.value = 'No analysis result found for this stack.'
    reportSnackbar.value = true
    return
  }
  setGlobalLoading(true)
  try {
    const jwt = localStorage.getItem('jwt')
    const resp = await axios.post(`${API_BASE_URL}/reports`, {
      stack_id: stack.id,
      result: hist.result
    }, { headers: { Authorization: `Bearer ${jwt}` } })
    // Use the full backend URL for the PDF download
    let url = resp.data.pdf_url
    if (!url.startsWith('http')) {
      url = BACKEND_BASE_URL + url
    }
    // Create a hidden <a> and click it
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '') // Let backend filename take precedence
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch {
    reportSnackbarMsg.value = 'Failed to generate PDF.'
    reportSnackbar.value = true
  } finally {
    setGlobalLoading(false)
  }
}

onMounted(() => {
  if (user.value) {
    fetchSubscriptionStatus()
    fetchStacks()
    fetchHistory()
  }
})

// Watch for user login after mount (e.g., after refresh)
watch(user, (newUser) => {
  if (newUser) {
    fetchSubscriptionStatus()
    fetchStacks()
    fetchHistory()
  }
})

onActivated(() => {
  if (user.value) {
    fetchHistory()
  }
})
</script>

<style scoped>
.profile-card, .v-card, .v-expansion-panel, .v-expansion-panel-title, .v-expansion-panel-text {
  background: #fff !important;
  color: #213547 !important;
  border-radius: 16px;
  box-shadow: 0 2px 12px 0 rgba(31, 38, 135, 0.08);
}
.v-icon, .icon {
  color: #155b5f !important;
}
.v-btn, .v-btn--primary {
  background-color: #155b5f !important;
  color: #fff !important;
}
.pro-features-list {
  list-style: none;
  padding: 0;
}
.pro-feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 1.08rem;
}
.text-success { color: #4caf50; }
.text-error { color: #e53935; }

.cancel-actions {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px 24px 24px;
}
.cancel-actions .v-btn {
  flex: 1 1 0;
  min-width: 0;
  max-width: 100%;
}

@media (max-width: 600px) {
  .v-container {
    padding-left: 4px !important;
    padding-right: 4px !important;
  }
  .v-card {
    border-radius: 12px !important;
    padding: 8px 0 !important;
    margin-bottom: 14px !important;
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
  .pro-feature-item {
    font-size: 1rem;
  }
  .v-expansion-panel-title {
    font-size: 1rem !important;
    padding: 8px 8px !important;
  }
  .v-expansion-panel-text {
    font-size: 0.95rem !important;
    padding: 8px 8px !important;
  }
  .v-timeline {
    padding-left: 0 !important;
  }
  .v-timeline-item {
    font-size: 0.95rem !important;
    padding-left: 0 !important;
  }
  .cancel-actions {
    flex-direction: column;
    gap: 10px;
    padding: 12px 8px 16px 8px;
  }
}
</style> 