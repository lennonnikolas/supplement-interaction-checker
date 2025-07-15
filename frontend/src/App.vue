<template>
  <v-app>
    <div class="modern-bg min-h-screen">
      <v-app-bar color="white" flat app class="elevation-1 mb-6">
        <v-toolbar-title class="font-weight-bold">SuppStacker</v-toolbar-title>
        <v-spacer />
        <v-btn color="primary" class="font-weight-bold" @click="showProModal = true">Upgrade to Pro</v-btn>
      </v-app-bar>
      <v-container class="py-8 pt-app-bar" max-width="700">
        <v-row>
          <v-col cols="12">
            <h1 class="text-h4 font-weight-bold mb-6 text-center">Supplement Interaction Checker</h1>
            <p class="mb-6 text-center text-body-1">
              Check up to 5 supplements for possible interactions. Get high-level risk alerts, basic supplement info, and safer alternatives.
            </p>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <StackChecker @update:stack="onStackChecked" :rerun-stack="rerunStack" />
          </v-col>
        </v-row>
        <v-row v-if="supplementInfoList.length">
          <v-col cols="12">
            <h2 class="text-h6 font-weight-bold mb-2">Supplement Info</h2>
            <div>
              <SupplementInfoCard v-for="info in supplementInfoList" :key="info.name" :info="info" />
            </div>
          </v-col>
        </v-row>
        <v-row v-if="alternativesList.length">
          <v-col cols="12">
            <h2 class="text-h6 font-weight-bold mb-2">Safer Alternatives</h2>
            <div>
              <AlternativeCard v-for="alt in alternativesList" :key="alt.name" v-bind="alt" />
            </div>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <RecentChecks :recent="recentChecks" @rerun="onRerunStack" />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <EmailSignup />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <BlogList />
          </v-col>
        </v-row>
      </v-container>
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
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const supplementInfoList = ref([])
const alternativesList = ref([])
const recentChecks = ref([])
const showProModal = ref(false)
const rerunStack = ref(null)

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

onMounted(() => {
  fetchRecentChecks()
})
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
