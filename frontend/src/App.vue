<template>
  <div class="modern-bg min-h-screen d-flex flex-column align-center justify-center">
    <v-container class="py-10" max-width="600">
      <v-overlay :model-value="processing" class="d-flex align-center justify-center" persistent>
        <v-progress-circular indeterminate color="primary" size="64" />
      </v-overlay>
      <v-dialog v-model="proDialog" max-width="400">
        <v-card>
          <v-card-title class="font-weight-bold">Upgrade to Pro</v-card-title>
          <v-card-text>
            You can check up to 3 supplements at a time for free.<br>
            <strong>Sign up for Pro</strong> to check more supplements in a single stack and unlock advanced features!
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" href="#" block>Sign Up for Pro</v-btn>
            <v-btn text @click="proDialog = false" block>Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-row>
        <v-col cols="12" class="text-center mb-4">
          <v-avatar size="64" class="mb-2 elevation-3">
            <v-img src="/favicon.ico" alt="Supplement Checker Logo" />
          </v-avatar>
          <h1 class="text-h3 font-weight-bold mb-2" style="letter-spacing: -1px;">Supplement Interaction Checker</h1>
          <p class="mb-4 text-body-1 text-grey-darken-2">
            Instantly check if your supplement stack is safe. Enter your supplements below to detect any negative interactions. <strong>Protect your health and optimize your stack!</strong>
          </p>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-card class="glass-card pa-6" elevation="10">
            <v-row v-for="(input, idx) in supplementInputs" :key="input.id" class="mb-2" align="center">
              <v-col cols="10">
                <v-autocomplete
                  v-model="input.value"
                  :items="input.suggestions"
                  :loading="input.loading"
                  :search="input.search"
                  label="Enter supplement name"
                  hide-no-data
                  hide-details
                  clearable
                  density="comfortable"
                  variant="outlined"
                  rounded
                  @update:search="val => onSearch(idx, val)"
                />
              </v-col>
              <v-col cols="2" class="d-flex align-center">
                <v-btn v-if="supplementInputs.length > 2" icon color="error" variant="tonal" @click="removeInput(idx)">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-col>
            </v-row>
            <v-row class="mb-4 mt-2">
              <v-col cols="6">
                <v-btn color="success" @click="addInput" block :disabled="!allInputsFilled || maxSupplementsReached" size="large" rounded elevation="2">Add Supplement</v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn color="primary" @click="checkInteractions" block :disabled="supplementInputs.filter(i => i.value).length < 2" size="large" rounded elevation="2">Check</v-btn>
              </v-col>
            </v-row>
            <v-row v-if="maxSupplementsReached && showProBanner">
              <v-col cols="12">
                <v-alert type="info" variant="tonal" border="start" class="mb-4" prominent dismissible @click:close="showProBanner = false">
                  <div class="d-flex align-center justify-space-between">
                    <span>You can check up to 3 supplements at a time for free. <strong>Upgrade to Pro</strong> to check more!</span>
                    <v-btn color="primary" size="small" class="ml-4" href="#">Sign Up for Pro</v-btn>
                  </div>
                </v-alert>
              </v-col>
            </v-row>
            <v-row v-if="negativeResults.length">
              <v-col cols="12">
                <v-card v-for="(res, idx) in negativeResults" :key="idx" class="mb-6 modern-result-card" outlined elevation="3">
                  <v-card-title class="d-flex align-center pb-2">
                    <v-icon color="error" size="22" class="mr-2">mdi-alert-circle</v-icon>
                    <span class="font-weight-medium">{{ res.supplements.join(' + ') }}:</span>
                    <span class="ml-2 text-caption text-error">{{ res.effect }}</span>
                  </v-card-title>
                  
                  <!-- Side Effects Section -->
                  <v-card-text v-if="res.evidence && res.evidence.length" class="pb-2">
                    <div class="side-effects-section mb-4">
                      <div class="d-flex align-center mb-3">
                        <v-icon color="warning" size="24" class="mr-2">mdi-exclamation-triangle</v-icon>
                        <span class="font-weight-bold text-warning text-h6">⚠️ What This Means For You:</span>
                      </div>
                      <div class="side-effects-list">
                        <template v-if="res.evidence.some(ev => ev.sideEffects && ev.sideEffects.length)">
                          <template v-for="(ev, eidx) in res.evidence" :key="`side-${eidx}`">
                            <div v-if="ev.sideEffects && ev.sideEffects.length" class="side-effect-item mb-3">
                              <div v-for="(effect, seidx) in ev.sideEffects" :key="`effect-${seidx}`" class="side-effect-text">
                                {{ effect }}
                              </div>
                            </div>
                          </template>
                        </template>
                        <template v-else>
                          <div class="side-effect-item mb-3">
                            <span class="side-effect-text">
                              No clear side effects could be determined from the research. Please consult a healthcare professional before combining these supplements.
                            </span>
                          </div>
                        </template>
                      </div>
                      <div class="consultation-note mt-3 pa-2" style="background: rgba(255,255,255,0.7); border-radius: 8px;">
                        <v-icon size="16" color="info" class="mr-1">mdi-information</v-icon>
                        <span class="text-caption text-info">Always consult your healthcare provider before combining supplements.</span>
                      </div>
                    </div>
                  </v-card-text>
                  
                  <!-- Research Evidence Section -->
                  <v-card-text v-if="res.evidence && res.evidence.length">
                    <div class="d-flex align-center mb-3">
                      <v-icon color="info" size="20" class="mr-2">mdi-book-open-variant</v-icon>
                      <span class="font-weight-bold text-info">Research Evidence:</span>
                    </div>
                    <v-list density="compact" class="pa-0">
                      <template v-for="(ev, eidx) in res.evidence" :key="eidx">
                        <v-list-item class="pa-3 mb-3 rounded-lg" style="background: #f8fafc;">
                          <v-list-item-content>
                            <div v-if="ev.title" class="font-weight-medium text-body-2 mb-2">
                              <span class="font-italic">{{ ev.type }}:</span>
                              <a v-if="ev.link" :href="ev.link" target="_blank" rel="noopener" class="ml-1 underline text-blue-700">{{ ev.title }}</a>
                              <span v-else class="ml-1">{{ ev.title }}</span>
                            </div>
                            <div v-if="ev.summary" class="text-body-2 text-grey-darken-1 mb-1">
                              {{ ev.summary }}
                            </div>
                          </v-list-item-content>
                        </v-list-item>
                        <v-divider v-if="eidx < res.evidence.length - 1" class="my-2" />
                      </template>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            <v-row v-else-if="results.length">
              <v-col cols="12" class="text-center">
                <v-alert type="success" variant="tonal" border="start" class="my-4">No negative interactions found!</v-alert>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
      <!-- Pro CTA -->
      <v-row class="mt-10">
        <v-col cols="12" class="text-center">
          <v-alert type="info" variant="outlined" border="start" class="mb-4 modern-pro-cta">
            <strong>Want advanced features?</strong> <br>
            <span>Sign up for <span class="text-primary font-weight-bold">SafeStack Pro</span> to unlock:</span>
            <div class="pro-features-list mt-2 mb-2">
              <div class="pro-feature-item" v-for="(feature, i) in proFeatures" :key="i">
                <span class="checkmark">✔️</span>
                <span class="feature-text">{{ feature }}</span>
              </div>
            </div>
            <v-btn color="primary" class="mt-2" href="#" large rounded elevation="2">Sign Up for Pro</v-btn>
          </v-alert>
        </v-col>
      </v-row>
      <!-- FAQ/Info Section -->
      <v-row class="mt-8">
        <v-col cols="12">
          <h2 class="text-h6 font-weight-bold mb-2">Frequently Asked Questions</h2>
          <v-expansion-panels class="modern-faq">
            <v-expansion-panel title="What is a supplement interaction checker?">
              <v-expansion-panel-text>
                This tool helps you identify negative interactions between supplements you take, using the latest scientific research.
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="How accurate is this tool?">
              <v-expansion-panel-text>
                We use reputable databases and research to provide the most up-to-date information, but always consult your healthcare provider.
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="What do I get with Pro?">
              <v-expansion-panel-text>
                Pro users get advanced analysis, personalized recommendations, and access to premium research and features.
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

let idCounter = 0
const supplementInputs = ref([
  { id: idCounter++, value: '', suggestions: [], search: '', loading: false },
  { id: idCounter++, value: '', suggestions: [], search: '', loading: false }
])
const results = ref([])
const processing = ref(false)
const proDialog = ref(false)
const showProBanner = ref(true)

const negativeResults = computed(() => results.value.filter(r => r.effect === 'Interaction found'))
const allInputsFilled = computed(() => supplementInputs.value.every(i => i.value && i.value.trim() !== ''))
const maxSupplementsReached = computed(() => supplementInputs.value.length >= 3)

const proFeatures = [
  'Dosage-based interaction analysis',
  'Personalized supplement recommendations',
  'Health profile integration',
  'Full research paper access',
  'And much more!'
]

function addInput() {
  if (supplementInputs.value.length >= 3) {
    proDialog.value = true
    return
  }
  supplementInputs.value.push({ id: idCounter++, value: '', suggestions: [], search: '', loading: false })
}
function removeInput(idx) {
  supplementInputs.value.splice(idx, 1)
}

async function onSearch(idx, val) {
  const input = supplementInputs.value[idx]
  input.search = val
  input.value = val // Always keep value in sync with what the user types
  if (!val || val.length < 2) {
    input.suggestions = []
    input.loading = false
    return
  }
  input.loading = true
  try {
    const resp = await axios.get(`${API_BASE_URL}/autosuggest?q=${encodeURIComponent(val)}`);
    input.suggestions = (resp.data.results || []).map(r => r.preferred_name)
    console.log('Suggestions for', val, ':', input.suggestions)
  } catch {
    input.suggestions = []
  }
  input.loading = false
}

async function checkInteractions() {
  processing.value = true
  try {
    const stack = supplementInputs.value.map(i => i.value.trim()).filter(Boolean)
    const res = await axios.post(`${API_BASE_URL}/check`, { stack })
    console.log('Backend response:', res.data)
    results.value = res.data.interactions
  } finally {
    processing.value = false
  }
}
</script>

<style scoped>
.modern-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%);
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
</style>
