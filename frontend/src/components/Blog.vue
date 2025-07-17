<template>
  <div class="blog-page">
    <v-container class="pt-app-bar" max-width="800">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">Supplement Safety Blog</h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          Expert insights on supplement safety, interactions, and best practices for your health and fitness journey.
        </p>
      </div>

      <!-- Articles Grid -->
      <div v-if="loading" class="text-center py-12">
        <v-progress-circular indeterminate size="64" color="primary" />
        <p class="mt-4 text-gray-600">Loading articles...</p>
      </div>

      <div v-else-if="blogArticles.length === 0" class="text-center py-12">
        <v-icon size="64" color="gray" class="mb-4">mdi-file-document-outline</v-icon>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No Articles Available</h3>
        <p class="text-gray-600">Check back soon for new supplement safety content.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <v-card 
          v-for="(article, idx) in blogArticles" 
          :key="idx" 
          class="blog-card h-full"
          elevation="2"
          @click="viewArticle(article)"
        >
          <v-card-title class="text-xl font-semibold text-gray-900 pb-2">
            {{ article.title }}
          </v-card-title>
          
          <v-card-text class="flex-grow">
            <p class="text-gray-600 mb-4 line-clamp-3">{{ article.summary }}</p>
            
            <div class="flex flex-wrap gap-2">
              <v-chip 
                v-for="tag in article.tags" 
                :key="tag"
                size="small" 
                color="primary" 
                variant="tonal"
                class="text-xs"
              >
                {{ tag }}
              </v-chip>
            </div>
          </v-card-text>
          
          <v-card-actions class="pt-0">
            <v-btn 
              color="primary" 
              variant="text" 
              class="font-weight-medium"
              @click.stop="viewArticle(article)"
            >
              Read More
              <v-icon right size="16">mdi-arrow-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </div>

      <!-- Newsletter Signup -->
      <div class="mt-16">
        <v-card class="newsletter-card text-center" elevation="3">
          <v-card-text class="py-8">
            <v-icon size="48" color="primary" class="mb-4">mdi-email-outline</v-icon>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">Stay Updated</h3>
            <p class="text-gray-600 mb-6 max-w-md mx-auto">
              Get the latest supplement safety tips and research delivered to your inbox.
            </p>
            <EmailSignup />
          </v-card-text>
        </v-card>
      </div>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import EmailSignup from './EmailSignup.vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const articles = ref([])
const loading = ref(true)

// Filter out FAQ items (those with 'faq' tag)
const blogArticles = computed(() => {
  return articles.value.filter(article => !article.tags.includes('faq'))
})

onMounted(async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/blog`)
    articles.value = res.data.articles
  } catch (error) {
    console.error('Failed to load blog articles:', error)
  } finally {
    loading.value = false
  }
})

function viewArticle(article) {
  // For now, just log the article. In the future, this could navigate to a detailed view
  // TODO: Implement article detail view
  alert(`Article: ${article.title}\n\nThis feature is coming soon!`)
}
</script>

<style scoped>
.blog-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
}

.blog-card {
  transition: all 0.3s ease;
  cursor: pointer;
  border-radius: 16px;
  overflow: hidden;
}

.blog-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.newsletter-card {
  border-radius: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.flex-grow {
  flex-grow: 1;
}
</style> 