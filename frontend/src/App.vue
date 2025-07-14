<template>
  <v-container class="py-8" max-width="600">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-6">Supplement Interaction Checker</h1>
      </v-col>
    </v-row>
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
          @update:search="val => onSearch(idx, val)"
        />
      </v-col>
      <v-col cols="2" class="d-flex align-center">
        <v-btn v-if="supplementInputs.length > 2" icon color="error" @click="removeInput(idx)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <v-row class="mb-4">
      <v-col cols="6">
        <v-btn color="success" @click="addInput" block :disabled="!allInputsFilled">Add Supplement</v-btn>
      </v-col>
      <v-col cols="6">
        <v-btn color="primary" @click="checkInteractions" block :disabled="supplementInputs.filter(i => i.value).length < 2">Check</v-btn>
      </v-col>
    </v-row>
    <v-row v-if="negativeResults.length">
      <v-col cols="12">
        <v-card v-for="(res, idx) in negativeResults" :key="idx" class="mb-6" outlined elevation="2">
          <v-card-title class="d-flex align-center pb-2">
            <v-icon color="error" size="18" class="mr-2">mdi-alert-circle</v-icon>
            <span class="font-weight-medium">{{ res.supplements.join(' + ') }}:</span>
            <span class="ml-2 text-caption text-error">{{ res.effect }}</span>
          </v-card-title>
          <v-card-text v-if="res.evidence && res.evidence.length">
            <v-list density="comfortable" class="pa-0">
              <template v-for="(ev, eidx) in res.evidence" :key="eidx">
                <v-list-item class="pa-4 mb-4 rounded-lg" style="background: #f8fafc;">
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
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'

let idCounter = 0
const supplementInputs = ref([
  { id: idCounter++, value: '', suggestions: [], search: '', loading: false },
  { id: idCounter++, value: '', suggestions: [], search: '', loading: false }
])
const results = ref([])

const negativeResults = computed(() => results.value.filter(r => r.effect === 'Interaction found'))
const allInputsFilled = computed(() => supplementInputs.value.every(i => i.value && i.value.trim() !== ''))

function addInput() {
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
    const resp = await axios.get(`http://localhost:3000/api/autosuggest?q=${encodeURIComponent(val)}`);
    input.suggestions = (resp.data.results || []).map(r => r.preferred_name)
    console.log('Suggestions for', val, ':', input.suggestions)
  } catch {
    input.suggestions = []
  }
  input.loading = false
}

async function checkInteractions() {
  const stack = supplementInputs.value.map(i => i.value.trim()).filter(Boolean)
  const res = await axios.post('http://localhost:3000/api/check', { stack })
  results.value = res.data.interactions
}
</script>
