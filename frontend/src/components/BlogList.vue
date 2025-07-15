<template>
  <v-card class="mb-3" outlined>
    <v-card-title>Learn: Articles & FAQ</v-card-title>
    <v-card-text>
      <div v-if="loading">Loading...</div>
      <div v-else>
        <v-list>
          <v-list-item v-for="(article, idx) in articles" :key="idx">
            <v-list-item-content>
              <div class="font-weight-bold">{{ article.title }}</div>
              <div class="text-caption mb-1">{{ article.summary }}</div>
              <div class="text-caption text-grey">Tags: {{ article.tags.join(', ') }}</div>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </div>
    </v-card-text>
  </v-card>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const articles = ref([])
const loading = ref(true)
onMounted(async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/blog`)
    articles.value = res.data.articles
  } finally {
    loading.value = false
  }
})
</script> 