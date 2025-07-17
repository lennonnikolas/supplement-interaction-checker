<template>
  <v-card class="mb-3 blog-article-card" outlined>
    <v-card-title>Articles & FAQ</v-card-title>
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
<style scoped>
.v-card, .blog-card, .blog-article-card, ::v-deep(.blog-article-card), ::v-deep(.blog-article-card *) {
  background: #fff !important;
  color: #213547 !important;
}
.v-card-title, .v-card-text, .v-list-item-title {
  color: #213547 !important;
}
.v-icon, .icon {
  color: #155b5f !important;
}
@media (max-width: 600px) {
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
  .font-weight-bold {
    font-size: 1rem !important;
  }
  .text-caption {
    font-size: 0.95rem !important;
  }
}
</style> 