<template>
  <div class="faq-page">
    <v-container class="pt-app-bar" max-width="800">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          Find answers to common questions about supplement safety, interactions, and how to use our tool effectively.
        </p>
      </div>

      <!-- FAQ Content -->
      <div v-if="loading" class="text-center py-12">
        <v-progress-circular indeterminate size="64" color="primary" />
        <p class="mt-4 text-gray-600">Loading FAQs...</p>
      </div>

      <div v-else-if="faqItems.length === 0" class="text-center py-12">
        <v-icon size="64" color="gray" class="mb-4">mdi-help-circle-outline</v-icon>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No FAQs Available</h3>
        <p class="text-gray-600">Check back soon for frequently asked questions.</p>
      </div>

      <div v-else class="max-w-4xl mx-auto">
        <!-- FAQ Accordion -->
        <v-expansion-panels multiple class="faq-accordion">
          <v-expansion-panel 
            v-for="(faq, idx) in faqItems" 
            :key="idx" 
            class="faq-panel mb-4"
          >
            <v-expansion-panel-title class="faq-question">
              <div class="d-flex align-center">
                <v-icon color="primary" size="20" class="mr-3">mdi-help-circle</v-icon>
                <span class="text-lg font-semibold text-gray-900">{{ faq.title }}</span>
              </div>
            </v-expansion-panel-title>
            
            <v-expansion-panel-text class="faq-answer">
              <div class="text-gray-700 leading-relaxed">
                <p class="mb-3">{{ faq.summary }}</p>
                
                <!-- Tags -->
                <div class="flex flex-wrap gap-2 mt-4">
                  <v-chip 
                    v-for="tag in faq.tags.filter(tag => tag !== 'faq')" 
                    :key="tag"
                    size="small" 
                    color="secondary" 
                    variant="tonal"
                    class="text-xs"
                  >
                    {{ tag }}
                  </v-chip>
                </div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Additional Help Section -->
        <div class="mt-16">
          <v-card class="help-card text-center" elevation="3">
            <v-card-text class="py-8">
              <v-icon size="48" color="primary" class="mb-4">mdi-message-question</v-icon>
              <h3 class="text-2xl font-bold text-gray-900 mb-2">Still Have Questions?</h3>
              <p class="text-gray-600 mb-6 max-w-md mx-auto">
                Can't find what you're looking for? Check out our blog for more detailed articles or contact our support team.
              </p>
              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <v-btn 
                  color="primary" 
                  size="large"
                  class="font-weight-medium"
                  @click="goToBlog"
                >
                  <v-icon left size="20">mdi-file-document</v-icon>
                  Read Our Blog
                </v-btn>
                <v-btn 
                  color="secondary" 
                  size="large"
                  variant="outlined"
                  class="font-weight-medium"
                  @click="contactSupport"
                >
                  <v-icon left size="20">mdi-email</v-icon>
                  Contact Support
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const articles = ref([])
const loading = ref(true)

// Filter for FAQ items (those with 'faq' tag)
const faqItems = computed(() => {
  return articles.value.filter(article => article.tags.includes('faq'))
})

onMounted(async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/blog`)
    articles.value = res.data.articles
  } catch (error) {
    console.error('Failed to load FAQ items:', error)
  } finally {
    loading.value = false
  }
})

function goToBlog() {
  router.push('/blog')
}

function contactSupport() {
  // For now, just show an alert. In the future, this could open a contact form or email
  alert('Contact support at support@safestacker.com\n\nThis feature is coming soon!')
}
</script>

<style scoped>
.faq-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
}

.faq-accordion {
  background: transparent;
}

.faq-panel {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  background: white;
}

.faq-question {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid #e5e7eb;
}

.faq-answer {
  background: white;
  padding: 24px;
}

.help-card {
  border-radius: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.leading-relaxed {
  line-height: 1.7;
}

@media (max-width: 600px) {
  .faq-page {
    padding: 0 4px;
  }
  .v-container {
    padding-left: 4px !important;
    padding-right: 4px !important;
  }
  .mb-12 {
    margin-bottom: 24px !important;
  }
  .text-4xl {
    font-size: 1.5rem !important;
  }
  .text-xl {
    font-size: 1.1rem !important;
  }
  .faq-panel {
    border-radius: 10px;
    margin-bottom: 10px !important;
  }
  .faq-answer {
    padding: 12px !important;
    font-size: 0.98rem;
  }
  .help-card {
    border-radius: 12px;
    padding: 8px 4px !important;
  }
  .v-btn {
    width: 100% !important;
    font-size: 1rem !important;
    margin: 6px 0 !important;
  }
}
</style> 