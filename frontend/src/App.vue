<template>
  <div class="p-6 max-w-xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Supplement Interaction Checker</h1>
    <input v-model="query" placeholder="Enter supplement names" class="w-full p-2 border rounded mb-4" />
    <button @click="checkInteractions" class="bg-blue-500 text-white px-4 py-2 rounded">Check</button>
    
    <div v-if="results.length" class="mt-4">
      <div v-for="res in results" :key="res.id" class="border p-2 mb-2 rounded bg-gray-100">
        <p><strong>{{ res.supplements.join(" + ") }}:</strong> {{ res.effect }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const query = ref('')
const results = ref([])

async function checkInteractions() {
  const res = await axios.post('http://localhost:3000/api/check', { stack: query.value.split(',') })
  results.value = res.data.interactions
}
</script>
