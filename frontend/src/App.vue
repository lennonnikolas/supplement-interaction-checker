<template>
  <v-app>
    <v-overlay persistent :model-value="loading" class="d-flex align-center justify-center" z-index="10000">
      <v-progress-circular indeterminate size="64" color="primary" />
    </v-overlay>
    <div class="modern-bg min-h-screen">
      <v-app-bar color="white" flat app class="elevation-1 mb-6">
        <v-toolbar-title class="font-weight-bold">IsMyStackSafe</v-toolbar-title>
        <v-spacer />
        <v-btn v-if="!user" color="primary" class="font-weight-bold" @click="openAuth">Sign In</v-btn>
        <v-menu v-else>
          <template #activator="{ props }">
            <v-btn v-bind="props" color="primary" class="font-weight-bold">Account</v-btn>
          </template>
          <v-list>
            <v-list-item>
              <v-list-item-title>{{ user.email }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="logout">
              <v-list-item-title>Log Out</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-app-bar>
      <AuthModal :open="showAuthModal" @close="showAuthModal = false" @auth-success="handleAuthSuccess" />
      <v-container class="py-8 pt-app-bar" max-width="700">
        <v-row class="mb-6">
          <v-col cols="12">
            <h1 class="text-h4 text-md-h3 font-weight-bold mb-4 text-center">Supplement Interaction Checker</h1>
            <p class="mb-6 text-center text-body-1">
              Check up to 3 supplements for possible interactions. Get high-level risk alerts, basic supplement info, and safer alternatives.
            </p>
          </v-col>
        </v-row>
        <v-row class="mb-6">
          <v-col cols="12">
            <StackChecker @update:stack="onStackChecked" :rerun-stack="rerunStack" @loading="loading = $event" />
          </v-col>
        </v-row>
        <v-row v-if="supplementInfoList.length" class="mb-6">
          <v-col cols="12">
            <h2 class="text-h6 text-md-h5 font-weight-bold mb-2">Supplement Info</h2>
            <div>
              <SupplementInfoCard v-for="info in supplementInfoList" :key="info.name" :info="info" />
            </div>
          </v-col>
        </v-row>
        <v-row v-if="alternativesList.length" class="mb-6">
          <v-col cols="12">
            <h2 class="text-h6 text-md-h5 font-weight-bold mb-2">Safer Alternatives</h2>
            <div>
              <AlternativeCard v-for="alt in alternativesList" :key="alt.name" v-bind="alt" />
            </div>
          </v-col>
        </v-row>
        <v-expansion-panels class="mb-6 d-md-none">
          <v-expansion-panel title="Recent Checks">
            <v-expansion-panel-text>
              <RecentChecks :recent="recentChecks" @rerun="onRerunStack" />
            </v-expansion-panel-text>
          </v-expansion-panel>
          <v-expansion-panel title="Articles & FAQ">
            <v-expansion-panel-text>
              <BlogList />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        <v-row class="mb-6 d-none d-md-flex">
          <v-col cols="12" md="6">
            <RecentChecks :recent="recentChecks" @rerun="onRerunStack" />
          </v-col>
          <v-col cols="12" md="6">
            <BlogList />
          </v-col>
        </v-row>
        <v-row class="mb-10">
          <v-col cols="12">
            <EmailSignup />
          </v-col>
        </v-row>
      </v-container>
      <v-btn color="primary" class="font-weight-bold sticky-upgrade-btn d-md-none" block large @click="showProModal = true">Upgrade to Pro</v-btn>
      <ProModal :open="showProModal" :onClose="() => showProModal = false" />
    </div>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import StackChecker from './components/StackChecker.vue'
import SupplementInfoCard from './components/SupplementInfoCard.vue'
import AlternativeCard from './components/AlternativeCard.vue'
import RecentChecks from './components/RecentChecks.vue'
import EmailSignup from './components/EmailSignup.vue'
import BlogList from './components/BlogList.vue'
import ProModal from './components/ProModal.vue'
import AuthModal from './components/AuthModal.vue'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const supplementInfoList = ref([])
const alternativesList = ref([])
const recentChecks = ref([])
const showProModal = ref(false)
const rerunStack = ref(null)
const loading = ref(false)
const showAuthModal = ref(false)
const user = ref(null)

async function fetchSupplementInfo(stack) {
  supplementInfoList.value = []
  for (const name of stack) {
    try {
      const res = await axios.get(`${API_BASE_URL}/supplement-info?name=${encodeURIComponent(name)}`)
      supplementInfoList.value.push(res.data)
    } catch {}
  }
}

async function fetchAlternatives(stack, risks) {
  alternativesList.value = []
  for (let i = 0; i < stack.length; i++) {
    if (risks[i] && risks[i].risk !== 'No Known Interaction') {
      try {
        const res = await axios.get(`${API_BASE_URL}/alternatives?name=${encodeURIComponent(stack[i])}`)
        alternativesList.value.push({ name: stack[i], ...res.data })
      } catch {}
    }
  }
}

async function fetchRecentChecks() {
  try {
    const res = await axios.get(`${API_BASE_URL}/recent`)
    recentChecks.value = res.data.recent || []
  } catch {
    recentChecks.value = []
  }
}

function onStackChecked(stack, risks) {
  fetchSupplementInfo(stack)
  fetchAlternatives(stack, risks)
  fetchRecentChecks()
}

function onRerunStack(stack) {
  rerunStack.value = stack
}

function openAuth() { showAuthModal.value = true }
function logout() {
  user.value = null
  localStorage.removeItem('jwt')
}
function handleAuthSuccess({ token, user: userInfo }) {
  user.value = userInfo
  localStorage.setItem('jwt', token)
  showAuthModal.value = false
}

// Handle /oauth-success?token=... redirect
onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  if (token) {
    localStorage.setItem('jwt', token)
    // Optionally fetch user info
    fetchUser(token)
    // Remove token from URL
    window.history.replaceState({}, document.title, window.location.pathname)
  } else {
    // Try to load user from localStorage
    const stored = localStorage.getItem('jwt')
    if (stored) fetchUser(stored)
  }
})
async function fetchUser(token) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.user) user.value = data.user
  } catch {}
}
</script>

<style scoped>
.modern-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
}
.glass-card {
  background: rgba(255, 255, 255, 0.75);
  border-radius: 24px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
}
.modern-result-card {
  border-radius: 18px;
  box-shadow: 0 2px 12px 0 rgba(31, 38, 135, 0.08);
}
.modern-pro-cta {
  border-radius: 18px;
  background: linear-gradient(90deg, #e0e7ff 0%, #f8fafc 100%);
  box-shadow: 0 2px 12px 0 rgba(31, 38, 135, 0.08);
}
.modern-faq {
  border-radius: 18px;
  background: rgba(255,255,255,0.7);
  box-shadow: 0 2px 12px 0 rgba(31, 38, 135, 0.06);
}
.pro-features-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  margin-left: 1.5rem;
}
.pro-feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.08rem;
}
.checkmark {
  font-size: 1.2rem;
  color: #4caf50;
  flex-shrink: 0;
}
.feature-text {
  flex: 1;
}
.side-effects-section {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border: 1px solid #ffc107;
  border-radius: 12px;
  padding: 16px;
}
.side-effects-list {
  margin-left: 8px;
}
.side-effect-item {
  margin-bottom: 8px;
}
.side-effect-text {
  font-size: 0.95rem;
  line-height: 1.4;
  color: #856404;
  margin-bottom: 4px;
}
.v-app-bar {
  border-radius: 0 0 18px 18px;
  box-shadow: 0 2px 12px 0 rgba(31, 38, 135, 0.08);
}
.pt-app-bar {
  padding-top: 72px !important;
}
.sticky-upgrade-btn {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  border-radius: 0;
  box-shadow: 0 -2px 12px 0 rgba(31, 38, 135, 0.08);
}
@media (max-width: 600px) {
  .glass-card {
    padding: 1rem !important;
    border-radius: 16px !important;
  }
  .modern-bg {
    padding: 0 !important;
  }
  .side-effects-section {
    padding: 10px !important;
    border-radius: 10px !important;
  }
  .modern-pro-cta, .modern-faq {
    border-radius: 10px !important;
  }
  .v-btn {
    font-size: 1.1rem !important;
    min-height: 48px !important;
  }
  .v-autocomplete {
    font-size: 1.1rem !important;
  }
  .pt-app-bar {
    padding-top: 60px !important;
  }
}
</style>
