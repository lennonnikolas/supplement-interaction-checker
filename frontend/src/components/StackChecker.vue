<template>
  <div style="position: relative;">

    <!-- Main Card -->
    <v-card class="professional-card pa-6 pa-md-8 mb-6" elevation="0">
      <!-- Toggle Panel -->
      <v-btn-toggle v-model="entryMode" class="mb-4" mandatory>
        <v-btn value="manual">Manual Entry</v-btn>
        <v-btn value="paste">Paste List</v-btn>
      </v-btn-toggle>
      <!-- Paste List Panel -->
      <div v-if="entryMode === 'paste'" class="paste-list-panel mb-6">
        <v-textarea v-model="pastedText" label="Paste your stack here (comma, semicolon, or newline separated)" rows="4" />
        <div v-if="parsedSupplements.length" class="mt-2">
          <div class="font-weight-bold mb-1">Supplements to Analyze:</div>
          <v-chip v-for="(supp, i) in parsedSupplements" :key="i" class="ma-1">{{ supp }}</v-chip>
        </div>
        <v-btn 
          color="primary" 
          class="mt-4 professional-btn" 
          block 
          size="large" 
          prepend-icon="mdi-magnify" 
          :disabled="parsedSupplements.length < 2" 
          @click="checkInteractions"
        >
          Analyze Interactions
        </v-btn>
      </div>
      <!-- Manual Entry Panel -->
      <div v-if="entryMode === 'manual'" class="input-section mb-6">
        <h3 class="text-h6 font-weight-semibold mb-4 text-center">Enter Your Supplements</h3>
        <v-row v-for="(input, idx) in supplementInputs" :key="input.id" class="mb-3" align="center">
          <v-col v-if="supplementInputs.length > 2" cols="2" xs="2" sm="1" md="1" class="d-flex align-center justify-center px-0">
            <v-btn icon color="error" variant="text" @click="removeInput(idx)" class="remove-btn">
              <v-icon size="24">mdi-close</v-icon>
            </v-btn>
          </v-col>
          <v-col :cols="supplementInputs.length > 2 ? 10 : 12" xs="12" sm="12" md="11" class="pr-0" style="padding-left:0;padding-right:0;">
            <v-autocomplete
              v-model="input.value"
              :items="input.suggestions"
              :loading="input.loading"
              :search="input.search"
              label="Supplement name"
              hide-no-data
              hide-details
              clearable
              density="comfortable"
              variant="outlined"
              class="professional-input"
              @update:search="val => onSearch(idx, val)"
            />
          </v-col>
        </v-row>
        
        <v-row class="mt-4">
          <v-col cols="12" md="6" class="mb-3 mb-md-0">
            <v-btn 
              color="success" 
              @click="addInput" 
              block 
              :disabled="!allInputsFilled || maxSupplementsReached" 
              size="large" 
              class="professional-btn"
              prepend-icon="mdi-plus"
            >
              Add Supplement
            </v-btn>
          </v-col>
          <v-col cols="12" md="6">
            <v-btn 
              color="primary" 
              @click="checkInteractions" 
              block 
              :disabled="supplementInputs.filter(i => i.value).length < 2" 
              size="large" 
              class="professional-btn"
              prepend-icon="mdi-magnify"
            >
              Analyze Interactions
            </v-btn>
          </v-col>
        </v-row>
      </div>
      <!-- Results Section -->
      <div v-if="results.length > 0" class="results-section">
        <div v-if="negativeInteractions.length" class="mb-6">
          <div class="d-flex align-center mb-4">
            <v-icon color="warning" size="28" class="mr-3">mdi-alert-triangle</v-icon>
            <h3 class="text-h5 font-weight-semibold mb-0">Interaction Analysis Results</h3>
          </div>
          
          <div class="results-container">
            <v-expansion-panels multiple class="interaction-panels">
              <v-expansion-panel 
                v-for="(interaction, idx) in sortedInteractions" 
                :key="idx" 
                class="interaction-panel"
              >
                <v-expansion-panel-title class="interaction-header">
                  <div class="d-flex align-center justify-space-between w-100">
                    <div class="d-flex align-center">
                      <v-chip 
                        :color="severityColor(interaction.severity)" 
                        size="small" 
                        class="mr-3"
                        variant="tonal"
                      >
                        {{ interaction.severity }}
                      </v-chip>
                      <span class="text-h6 font-weight-semibold">{{ interaction.supplements.join(' + ') }}</span>
                    </div>
                    <v-icon :color="severityColor(interaction.severity)" size="24">mdi-alert-circle</v-icon>
                  </div>
                </v-expansion-panel-title>
                
                <v-expansion-panel-text class="interaction-content">
                  <div v-if="interaction.mechanism" class="info-section mb-4">
                    <div class="section-header">
                      <v-icon color="primary" size="20" class="mr-2">mdi-information</v-icon>
                      <span class="font-weight-semibold text-primary">How It Works</span>
                    </div>
                    <p class="mt-2 mb-0 text-body-1">{{ interaction.mechanism }}</p>
                  </div>
                  
                  <div v-if="interaction.side_effects" class="info-section">
                    <div class="section-header">
                      <v-icon color="error" size="20" class="mr-2">mdi-alert</v-icon>
                      <span class="font-weight-semibold text-error">Potential Side Effects</span>
                    </div>
                    <p class="mt-2 mb-0 text-body-1">{{ interaction.side_effects }}</p>
                  </div>
                  
                  <div v-if="interaction.source" class="source-info">
                    <v-divider class="my-3"></v-divider>
                    <div class="d-flex align-center">
                      <v-icon color="grey" size="16" class="mr-2">mdi-database</v-icon>
                      <span class="text-caption text-grey">Data source: {{ interaction.source }}</span>
                    </div>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
        </div>
        
        <div v-else class="success-section text-center">
          <v-card class="success-card" elevation="0">
            <v-card-text class="pa-6">
              <v-icon color="success" size="64" class="mb-4">mdi-shield-check</v-icon>
              <h3 class="text-h5 font-weight-semibold mb-2 text-success">No Interactions Detected</h3>
              <p class="text-body-1 text-medium-emphasis mb-0">
                Based on our analysis of medical research, these supplements appear to be safe to use together.
              </p>
            </v-card-text>
          </v-card>
        </div>
        <!-- Stack rating UI moved to Home.vue -->
        <!-- Save Stack Button for Pro Users: always show after analysis if pro -->
        <div v-if="isPro && lastAnalyzedStack.length" class="mt-2 text-center">
          <v-btn color="success" @click="saveStack" :disabled="saveStackLoading" prepend-icon="mdi-content-save">
            Save Stack
          </v-btn>
          <v-alert v-if="saveStackSuccess" type="success" class="mt-2">{{ saveStackSuccess }}</v-alert>
          <v-alert v-if="saveStackError" type="error" class="mt-2">{{ saveStackError }}</v-alert>
        </div>
      </div>
      <!-- CTA Section -->
      <div v-if="!isPro" class="cta-section mt-8">
        <v-card class="cta-card" elevation="0">
          <v-card-text class="pa-6 text-center">
            <v-icon color="primary" size="48" class="mb-4">mdi-star</v-icon>
            <h3 class="text-h5 font-weight-semibold mb-2">Get More Advanced Features</h3>
            <p class="text-body-1 text-medium-emphasis mb-4">
              Save your supplement stacks, access detailed reports, and check unlimited combinations
            </p>
            <v-btn color="primary" size="large" class="cta-btn" prepend-icon="mdi-arrow-right" @click="$emit('show-pro-modal')">
              Upgrade to Pro
            </v-btn>
          </v-card-text>
        </v-card>
      </div>
    </v-card>
  </div>
</template>
<script setup>
import { ref, computed, defineEmits, watch, inject } from 'vue'
import axios from 'axios'
// Remove: import { marked } from 'marked'

const props = defineProps({ rerunStack: Array, stackId: [String, Number] })
const emit = defineEmits(['update:stack', 'loading', 'show-pro-modal'])

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

let idCounter = 0
const supplementInputs = ref([
  { id: idCounter++, value: '', suggestions: [], search: '', loading: false },
  { id: idCounter++, value: '', suggestions: [], search: '', loading: false }
])
const results = ref([])
const supplementDetails = ref([])
const maxSupplementsReached = computed(() => supplementInputs.value.length >= 15)
const allInputsFilled = computed(() => supplementInputs.value.every(i => i.value && i.value.trim() !== ''))
const lastAnalyzedStack = ref([])

const setGlobalLoading = inject('setGlobalLoading', () => {})
const setAnalyzingSupplements = inject('setAnalyzingSupplements', () => {})
const isPro = inject('isPro', ref(false))
const entryMode = ref('manual')
const pastedText = ref('')
const parsedSupplements = computed(() => pastedText.value.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean))
// Stack rating state moved to Home.vue
const saveStackLoading = ref(false)
const saveStackSuccess = ref('')
const saveStackError = ref('')

function addInput() {
  if (supplementInputs.value.length >= 15) return
  supplementInputs.value.push({ id: idCounter++, value: '', suggestions: [], search: '', loading: false })
}
function removeInput(idx) {
  supplementInputs.value.splice(idx, 1)
}

async function onSearch(idx, val) {
  const input = supplementInputs.value[idx]
  input.search = val
  input.value = val
  if (!val || val.length < 2) {
    input.suggestions = []
    input.loading = false
    return
  }
  input.loading = true
  setGlobalLoading(true)
  try {
    const resp = await axios.get(`${API_BASE_URL}/autosuggest?q=${encodeURIComponent(val)}`)
    input.suggestions = (resp.data.results || []).map(r => r.preferred_name)
  } catch {
    input.suggestions = []
  }
  input.loading = false
  setGlobalLoading(false)
}

async function checkInteractions() {
  setGlobalLoading(true)
  setAnalyzingSupplements(true)
  let stack = []
  if (entryMode.value === 'manual') {
    stack = supplementInputs.value.map(i => i.value).filter(Boolean)
  } else if (entryMode.value === 'paste') {
    stack = parsedSupplements.value
  }
  lastAnalyzedStack.value = stack
  const jwt = localStorage.getItem('jwt')
  const postData = { stack }
  if (props.stackId) postData.stack_id = props.stackId
  const config = jwt ? { headers: { Authorization: `Bearer ${jwt}` } } : {}
  try {
    const res = await axios.post(`${API_BASE_URL}/check`, postData, config)
    results.value = res.data.interactions
    supplementDetails.value = res.data.supplements || []
    emit('update:stack', stack, results.value, supplementDetails.value)
  } finally {
    setGlobalLoading(false)
    setAnalyzingSupplements(false)
  }
}

// Stack rating logic moved to Home.vue

async function saveStack() {
  if (!lastAnalyzedStack.value.length) return
  const name = window.prompt('Enter a name for your stack:')
  if (!name || !name.trim()) return
  saveStackLoading.value = true
  saveStackSuccess.value = ''
  saveStackError.value = ''
  try {
    const jwt = localStorage.getItem('jwt')
    const config = jwt ? { headers: { Authorization: `Bearer ${jwt}` } } : {}
    const res = await axios.post(`${API_BASE_URL}/stacks`, {
      name: name.trim(),
      stack_data: lastAnalyzedStack.value
    }, config)
    saveStackSuccess.value = 'Stack saved!'
  } catch (err) {
    saveStackError.value = err.response?.data?.error || 'Failed to save stack.'
  } finally {
    saveStackLoading.value = false
  }
}

const negativeInteractions = computed(() => 
  results.value.filter(interaction => 
    interaction.severity && 
    interaction.severity !== 'None' && 
    interaction.severity !== 'Data not found. Please consult your healthcare provider.'
  )
)

const sortedInteractions = computed(() => {
  const severityOrder = { 'Severe': 3, 'Moderate': 2, 'Mild': 1 }
  return [...negativeInteractions.value].sort((a, b) => {
    const aOrder = severityOrder[a.severity] || 0
    const bOrder = severityOrder[b.severity] || 0
    return bOrder - aOrder // Most severe first
  })
})

function severityColor(severity) {
  if (severity === 'None' || severity === 'Data not found. Please consult your healthcare provider.') return 'success'
  if (severity === 'Mild') return 'warning'
  if (severity === 'Moderate') return 'orange'
  if (severity === 'Severe') return 'error'
  return 'info'
}

// Watch for rerunStack prop changes
watch(() => props.rerunStack, async (newStack) => {
  if (Array.isArray(newStack) && newStack.length > 0) {
    // Reset inputs
    supplementInputs.value = newStack.map(val => ({ id: idCounter++, value: val, suggestions: [], search: val, loading: false }))
    // If less than 2, add empty input
    while (supplementInputs.value.length < 2) {
      supplementInputs.value.push({ id: idCounter++, value: '', suggestions: [], search: '', loading: false })
    }
    // Run the checker
    await checkInteractions()
  }
}, { immediate: false })

watch(setGlobalLoading, (val) => {
  emit('loading', val)
})

defineExpose({
  getLastAnalyzedStack: () => lastAnalyzedStack.value,
  saveStack,
  saveStackLoading
})
</script>
<style scoped>
/* Professional Card Styling */
.professional-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Trust Indicators */
.trust-indicators {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.trust-item {
  background: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Input Styling */
.professional-input {
  border-radius: 8px;
}

.professional-input :deep(.v-field) {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

.professional-input :deep(.v-field:hover) {
  border-color: #3b82f6;
}

.professional-input :deep(.v-field--focused) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Button Styling */
.professional-btn {
  border-radius: 8px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.025em;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.professional-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.remove-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

/* Results Container */
.results-container {
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
}

.results-container::-webkit-scrollbar {
  width: 8px;
}

.results-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.results-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.results-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Interaction Panels */
.interaction-panels {
  background: transparent;
}

.interaction-panel {
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}

.interaction-panel:last-child {
  border-bottom: none;
}

.interaction-panel :deep(.v-expansion-panel-title) {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e2e8f0;
  padding: 16px 20px;
  min-height: 64px;
}

.interaction-panel :deep(.v-expansion-panel-title:hover) {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
}

.interaction-panel :deep(.v-expansion-panel-text) {
  padding: 20px;
  background: #ffffff;
}

.interaction-content {
  padding: 20px;
}

.info-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.source-info {
  background: #f1f5f9;
  border-radius: 6px;
  padding: 8px 12px;
}

/* Success Section */
.success-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #bbf7d0;
  border-radius: 12px;
}

/* CTA Section */
.cta-card {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.cta-btn {
  border-radius: 8px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.025em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.cta-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Utility Classes */
.max-width-600 {
  max-width: 600px;
}

/* Mobile Responsive */
@media (max-width: 600px) {
  .professional-card {
    padding: 12px 4px !important;
    border-radius: 12px !important;
    overflow-x: hidden !important;
  }
  .input-section {
    margin-bottom: 16px !important;
    padding: 0 2px !important;
    overflow-x: hidden !important;
  }
  .input-section .professional-input {
    width: 95vw !important;
    max-width: 340px !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    margin: 0 auto 0 auto !important;
    display: block !important;
  }
  .professional-input :deep(.v-field) {
    font-size: 1rem !important;
    padding: 8px 4px !important;
    width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }
  .v-col {
    padding-left: 0 !important;
    padding-right: 0 !important;
    min-width: 0 !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  .professional-btn {
    width: 100% !important;
    font-size: 1rem !important;
    margin: 8px 0 !important;
    padding: 12px 0 !important;
  }
  .remove-btn {
    width: 28px !important;
    height: 28px !important;
  }
  .results-container {
    max-height: 320px !important;
    padding: 4px !important;
    border-radius: 8px !important;
  }
  .interaction-panel :deep(.v-expansion-panel-title) {
    padding: 10px 8px !important;
    min-height: 44px !important;
    font-size: 1rem !important;
  }
  .interaction-panel :deep(.v-expansion-panel-text),
  .interaction-content {
    padding: 10px 8px !important;
    font-size: 0.98rem !important;
  }
  .info-section {
    padding: 10px 8px !important;
    border-radius: 6px !important;
  }
  .cta-section {
    margin-top: 18px !important;
  }
  .cta-card {
    padding: 12px 4px !important;
    border-radius: 10px !important;
  }
  .cta-btn {
    width: 100% !important;
    font-size: 1rem !important;
    padding: 12px 0 !important;
  }
}

/* Loading Overlay */
.global-spinner-overlay {
  display: flex !important;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9) !important;
  z-index: 100 !important;
  backdrop-filter: blur(4px);
}
</style> 