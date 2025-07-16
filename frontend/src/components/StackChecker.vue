<template>
  <div style="position: relative;">
    <v-card class="glass-card pa-4 pa-md-6 mb-6" elevation="10">
      <v-row v-for="(input, idx) in supplementInputs" :key="input.id" class="mb-2" align="center">
        <v-col cols="2" xs="2" sm="1" md="1" class="d-flex align-center justify-center px-0" v-if="supplementInputs.length > 2">
          <v-btn icon color="error" variant="tonal" @click="removeInput(idx)" class="close-btn-circle">
            <v-icon size="28">mdi-close</v-icon>
          </v-btn>
        </v-col>
        <v-col :cols="supplementInputs.length > 2 ? 10 : 12" xs="10" sm="11" md="11" class="pr-0">
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
            class="mb-2 mobile-autocomplete"
            @update:search="val => onSearch(idx, val)"
          />
        </v-col>
      </v-row>
      <v-row class="mb-4 mt-2">
        <v-col cols="12" md="6" class="mb-2 mb-md-0">
          <v-btn color="success" @click="addInput" block :disabled="!allInputsFilled || maxSupplementsReached" size="large" rounded elevation="2">Add Supplement</v-btn>
        </v-col>
        <v-col cols="12" md="6">
          <v-btn color="primary" @click="checkInteractions" block :disabled="supplementInputs.filter(i => i.value).length < 2" size="large" rounded elevation="2">Check</v-btn>
        </v-col>
      </v-row>
      <v-row v-if="negativeResults.length">
        <v-col cols="12">
          <v-card v-for="(res, idx) in negativeResults" :key="idx" class="mb-4 mobile-result-card" outlined elevation="2">
            <v-card-title class="d-flex align-center pb-2 mobile-result-title">
              <v-icon :color="riskColor(res.risk)" size="32" class="mr-3">mdi-alert-circle</v-icon>
              <span class="font-weight-bold mobile-risk-label">{{ res.supplements.join(' + ') }}:</span>
              <span class="ml-2 text-caption font-weight-bold mobile-risk-label" :class="'text-' + riskColor(res.risk)">{{ res.risk }}</span>
            </v-card-title>
          </v-card>
        </v-col>
      </v-row>
      <v-row v-if="results.length && negativeResults.length === 0">
        <v-col cols="12" class="text-center">
          <v-alert type="success" variant="tonal" border="start" class="my-4">No negative interactions found!</v-alert>
        </v-col>
      </v-row>
      <v-row class="mt-4">
        <v-col cols="12" class="text-center">
          <v-alert type="info" variant="outlined" border="start" class="mb-2">
            <div class="mb-2">Want to save your stack or check more than 3 supplements?</div>
            <v-btn color="primary" large href="#">Sign Up for Pro</v-btn>
          </v-alert>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>
<script setup>
import { ref, computed, defineEmits, watch } from 'vue'
import axios from 'axios'

const props = defineProps({ rerunStack: Array })
const emit = defineEmits(['update:stack', 'loading'])

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

let idCounter = 0
const supplementInputs = ref([
  { id: idCounter++, value: '', suggestions: [], search: '', loading: false },
  { id: idCounter++, value: '', suggestions: [], search: '', loading: false }
])
const results = ref([])
const maxSupplementsReached = computed(() => supplementInputs.value.length >= 3)
const allInputsFilled = computed(() => supplementInputs.value.every(i => i.value && i.value.trim() !== ''))

const globalLoading = ref(false)

function addInput() {
  if (supplementInputs.value.length >= 3) return
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
  globalLoading.value = true
  try {
    const resp = await axios.get(`${API_BASE_URL}/autosuggest?q=${encodeURIComponent(val)}`)
    input.suggestions = (resp.data.results || []).map(r => r.preferred_name)
  } catch {
    input.suggestions = []
  }
  input.loading = false
  globalLoading.value = false
}

async function checkInteractions() {
  globalLoading.value = true
  const stack = supplementInputs.value.map(i => i.value.trim()).filter(Boolean)
  const res = await axios.post(`${API_BASE_URL}/check`, { stack })
  results.value = res.data.interactions
  emit('update:stack', stack, results.value)
  globalLoading.value = false
}

const negativeResults = computed(() => results.value.filter(r => r.risk !== 'No Known Interaction'))

function riskColor(risk) {
  if (risk === 'No Known Interaction') return 'success'
  if (risk === 'Mild Interaction') return 'warning'
  if (risk === 'Possible Risk') return 'error'
  if (risk === 'Interaction Found') return 'error'
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

watch(globalLoading, (val) => {
  emit('loading', val)
})
</script>
<style scoped>
.close-btn-circle {
  width: 44px !important;
  height: 44px !important;
  min-width: 44px !important;
  min-height: 44px !important;
  border-radius: 50% !important;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px 0 rgba(31,38,135,0.08);
  margin-right: 0.25rem;
}
.global-spinner-overlay {
  display: flex !important;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.7) !important;
  z-index: 100 !important;
}
@media (max-width: 600px) {
  .glass-card {
    padding: 1rem !important;
    border-radius: 16px !important;
  }
  .v-btn {
    font-size: 1.1rem !important;
    min-height: 48px !important;
  }
  .mobile-autocomplete {
    font-size: 1.15rem !important;
    padding: 10px 8px !important;
  }
  .close-btn-circle {
    width: 40px !important;
    height: 40px !important;
    min-width: 40px !important;
    min-height: 40px !important;
    margin-right: 0.15rem;
  }
  .mobile-result-card {
    width: 100% !important;
    box-sizing: border-box !important;
    padding: 1.1rem 0.7rem !important;
    border-radius: 16px !important;
    margin-bottom: 1.2rem !important;
    overflow-wrap: break-word !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
  .mobile-result-title {
    flex-wrap: wrap;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  .mobile-risk-label {
    font-size: 1.15rem !important;
    letter-spacing: 0.01em;
    word-break: break-word;
    overflow-wrap: break-word;
  }
}
</style> 