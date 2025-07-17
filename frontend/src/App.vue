<template>
  <v-app>
    <v-overlay persistent :model-value="loading" class="d-flex align-center justify-center" z-index="10000">
      <v-progress-circular indeterminate size="64" color="primary" />
    </v-overlay>
    <div class="modern-bg min-h-screen pt-app-bar">
      <v-app-bar app color="#fff" elevation="2" class="app-bar-white" style="background-color: #fff !important; color: #155b5f !important;">
        <v-img :src="logo" alt="SuppScanr Logo" contain max-width="96" max-height="96" class="mr-3" style="border-radius:8px;" />
        <v-img :src="wordmark" alt="SuppScanr Wordmark" contain max-width="220" max-height="48" class="suppscanr-wordmark" style="margin-left: 0; cursor: pointer;" @click="goHome" />
        <v-spacer></v-spacer>
        <div class="d-none d-md-flex align-center">
          <v-btn text class="font-weight-medium mr-2" style="color: #155b5f;" @click="goToBlog">
            Blog
          </v-btn>
          <v-btn text class="font-weight-medium mr-4" style="color: #155b5f;" @click="goToFAQ">
            FAQs
          </v-btn>
        </div>
        <v-menu v-model="mobileMenu" :close-on-content-click="false" v-if="isMobile" class="d-md-none">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" style="background: transparent !important; box-shadow: none !important;">
              <v-icon style="color: #155b5f !important;">mdi-menu</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="goToBlog(); mobileMenu = false">
              <v-list-item-title>
                <v-icon left size="16" style="color: #155b5f;">mdi-file-document</v-icon>
                Blog
              </v-list-item-title>
            </v-list-item>
            <v-list-item @click="goToFAQ(); mobileMenu = false">
              <v-list-item-title>
                <v-icon left size="16" style="color: #155b5f;">mdi-help-circle</v-icon>
                FAQs
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn color="secondary" class="font-weight-bold" style="color: #fff; background: #155b5f;" @click="openAuth" v-if="!user">
          Sign In
        </v-btn>
        <v-menu v-model="userMenu" :close-on-content-click="true" v-if="user" class="profile-menu">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" class="profile-menu-btn profile-menu-btn-override">
              <v-icon style="color: #155b5f; font-size: 2.3rem;">mdi-account</v-icon>
            </v-btn>
          </template>
          <v-list class="profile-menu-content">
            <v-list-item @click="goToProfile">
              <v-list-item-title>
                <v-icon left size="16" class="profile-menu-icon" style="color: #155b5f;">mdi-account</v-icon>
                Profile
              </v-list-item-title>
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item @click="handleLogout">
              <v-list-item-title>
                <v-icon left size="16" class="profile-menu-icon" style="color: #155b5f;">mdi-logout</v-icon>
                Sign Out
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-app-bar>
      <AuthModal :open="showAuthModal" @close="showAuthModal = false" @auth-success="handleAuthSuccess" />
      <router-view v-slot="{ Component }">
        <component :is="Component" @show-pro-modal="showProModal = true" />
      </router-view>
      <v-btn v-if="!isPro && isMobile" color="primary" class="font-weight-bold sticky-upgrade-btn" block large @click="showProModal = true">Upgrade to Pro</v-btn>
      <ProModal v-if="!isPro" :open="showProModal" :onClose="() => showProModal = false" />
      <v-alert v-if="logoutError" type="error" class="ma-4" dismissible @input="logoutError = ''">
        {{ logoutError }}
      </v-alert>
    </div>
  </v-app>
</template>

<script setup>
import { ref, onMounted, watch, provide, computed, onUnmounted } from 'vue'
import StackChecker from './components/StackChecker.vue'
import SupplementInfoCard from './components/SupplementInfoCard.vue'
import AlternativeCard from './components/AlternativeCard.vue'
import RecentChecks from './components/RecentChecks.vue'
import EmailSignup from './components/EmailSignup.vue'

import ProModal from './components/ProModal.vue'
import AuthModal from './components/AuthModal.vue'
import axios from 'axios'
import { useSessionTimeout } from './composables/useSessionTimeout'
import { useRouter } from 'vue-router'

// Import images for top banner
import logo from '@/assets/SuppScanrLogo-Transparent.png'
import wordmark from '@/assets/SuppScanrLogo-wordmark-transparent.png'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const supplementInfoList = ref([])
const alternativesList = ref([])
const recentChecks = ref([])
const showProModal = ref(false)
const rerunStack = ref(null)
const loading = ref(false)
const showAuthModal = ref(false)
const user = ref(null)
const mobileMenu = ref(false)
const userMenu = ref(false)
const router = useRouter()
const logoutError = ref('')
const isPro = ref(false)
const isMobile = ref(window.innerWidth <= 600)

function updateIsMobile() {
  isMobile.value = window.innerWidth <= 600
}

// Provide user and isPro state to child components
provide('user', user)
provide('isPro', isPro)

// Provide global loading setter
const setGlobalLoading = (val) => { loading.value = val }
provide('setGlobalLoading', setGlobalLoading)

// Provide function to refresh subscription status
const refreshSubscriptionStatus = async () => {
  try {
    const token = localStorage.getItem('jwt')
    if (!token) return
    
    const res = await axios.get(`${API_BASE_URL}/stripe/subscription-status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    isPro.value = res.data.is_pro
  } catch (err) {
    console.error('Failed to refresh subscription status:', err)
    isPro.value = false
  }
}

provide('refreshSubscriptionStatus', refreshSubscriptionStatus)

// Use session timeout composable
useSessionTimeout({ logout, showAuthModal, user })

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
  // Check subscription status after login
  checkSubscriptionStatus(token)
}

function goToProfile() {
  router.push('/profile')
}

function goHome() {
  router.push('/')
}

function goToBlog() {
  router.push('/blog')
}

function goToFAQ() {
  router.push('/faq')
}

async function handleLogout() {
  logoutError.value = ''
  try {
    const token = localStorage.getItem('jwt')
    if (token) {
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
    }
  } catch (e) {
    logoutError.value = 'Logout failed. Please try again.'
  }
  logout()
  userMenu.value = false
}

// Handle /oauth-success?token=... redirect
onMounted(() => {
  window.addEventListener('resize', updateIsMobile)
  updateIsMobile()
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

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})

// Watch for route changes to refresh subscription status on home page
watch(() => router.currentRoute.value.path, (newPath) => {
  if (newPath === '/' && user.value) {
    // Refresh subscription status when navigating to home
    refreshSubscriptionStatus()
  }
})

watch(user, (val) => {
  if (val) {
    // resetSessionTimeout() // This is now handled by useSessionTimeout
  } else {
    // if (sessionTimeoutId) clearTimeout(sessionTimeoutId) // This is now handled by useSessionTimeout
  }
})

async function fetchUser(token) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.user) {
      user.value = data.user
      // Check subscription status
      checkSubscriptionStatus(token)
    }
  } catch {}
}

async function checkSubscriptionStatus(token) {
  try {
    const res = await axios.get(`${API_BASE_URL}/stripe/subscription-status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    isPro.value = res.data.is_pro
  } catch (err) {
    console.error('Failed to check subscription status:', err)
    isPro.value = false
  }
}
</script>

<style scoped>
.modern-bg {
  background: #f4f8f6 !important;
  min-height: 100vh;
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
  background-color: #155b5f !important;
  color: #fff !important;
}
.v-toolbar-title {
  color: #fff !important;
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
.v-btn, .v-btn--primary, .sticky-upgrade-btn {
  background-color: #155b5f !important;
  color: #fff !important;
}
.v-btn:hover, .v-btn--primary:hover, .sticky-upgrade-btn:hover {
  background-color: #5c645c !important;
  color: #fff !important;
}
.v-card, .professional-card, .cta-card, .recent-checks-card, .success-card {
  background: #b4ccbc !important;
  color: #213547 !important;
  border-radius: 18px;
  box-shadow: 0 2px 12px 0 rgba(31, 38, 135, 0.08);
}
.v-alert {
  background: #b4ccbc !important;
  color: #213547 !important;
}
body, .v-application {
  color: #213547 !important;
  background: #f4f8f6 !important;
}
.suppscanr-title {
  cursor: pointer;
  color: #fff !important;
  font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 800;
  font-size: 2.1rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  line-height: 1.1;
  margin-top: 2px;
  margin-bottom: 0;
  display: flex;
  align-items: center;
}
.suppscanr-wordmark {
  display: flex;
  align-items: center;
  margin-top: 4px;
}
.v-menu__content {
  background: #fff !important;
  color: #213547 !important;
  box-shadow: 0 2px 12px 0 rgba(31, 38, 135, 0.08);
}
.v-list-item, .v-list-item-title {
  background: #fff !important;
  color: #213547 !important;
}
.v-icon, .icon {
  color: #155b5f !important;
}
.profile-menu .v-list-item, .profile-menu .v-list-item-title, .profile-menu .v-menu__content {
  background: #fff !important;
  color: #213547 !important;
}
.profile-icon {
  color: #155b5f !important;
}
.profile-menu .v-menu__content, .profile-menu-content, .profile-menu .v-list-item, .profile-menu .v-list-item-title {
  background: #fff !important;
  color: #213547 !important;
  font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif !important;
  font-weight: 800 !important;
  letter-spacing: 0.12em !important;
}
.profile-menu-icon {
  color: #155b5f !important;
  font-size: 2.1rem !important;
  font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif !important;
  font-weight: 800 !important;
  letter-spacing: 0.12em !important;
}
.profile-header-icon {
  color: #fff !important;
  font-size: 2.1rem !important;
  font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif !important;
  font-weight: 800 !important;
  letter-spacing: 0.12em !important;
}
.profile-menu-btn-override {
  background: #fff !important;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(31,38,135,0.08);
  padding: 6px;
}
@media (max-width: 600px) {
  .modern-bg {
    padding: 0 2px !important;
    min-height: 100vh !important;
  }
  .pt-app-bar {
    padding-top: 56px !important;
  }
  .sticky-upgrade-btn {
    position: fixed !important;
    bottom: 12px !important;
    left: 8px !important;
    right: 8px !important;
    width: calc(100vw - 16px) !important;
    z-index: 10001 !important;
    font-size: 1rem !important;
    border-radius: 10px !important;
    padding: 14px 0 !important;
  }
  .v-alert {
    font-size: 0.98rem !important;
    margin: 8px 2px !important;
  }
}
</style>
