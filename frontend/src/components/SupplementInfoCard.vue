<template>
  <div class="supplement-info-card">
    <div class="card-header">
      <v-icon color="primary" size="20" class="mr-2">mdi-pill</v-icon>
      <h3 class="supplement-name">{{ info.name }}</h3>
    </div>
    <div class="card-content">
      <div v-if="info.typical_use" class="info-item">
        <div class="info-label">
          <v-icon color="info" size="16" class="mr-1">mdi-information</v-icon>
          Typical Use
        </div>
        <p class="info-value">{{ info.typical_use }}</p>
      </div>
      <div v-if="info.typical_dosage" class="info-item">
        <div class="info-label">
          <v-icon color="warning" size="16" class="mr-1">mdi-scale</v-icon>
          Typical Dosage
        </div>
        <p class="info-value">{{ info.typical_dosage }}</p>
      </div>
      <div v-if="!info.typical_use && !info.typical_dosage" class="no-info">
        <v-icon color="grey" size="16" class="mr-1">mdi-help-circle</v-icon>
        <span class="text-grey">No additional information available</span>
      </div>
    </div>
    <div v-if="isPro" class="related-products-section mt-4">
      <v-divider class="mb-2" />
      <div class="font-weight-bold mb-1">Related Products (Pro)</div>
      <div v-if="relatedLoading" class="text-caption">Loading...</div>
      <div v-else-if="relatedError" class="text-error">{{ relatedError }}</div>
      <div v-else-if="relatedProducts.length">
        <v-chip class="ma-1" v-for="(prod, n) in relatedProducts" :key="n">{{ prod }}</v-chip>
      </div>
      <div v-else class="text-caption">No related products found.</div>
    </div>
  </div>
</template>
<script setup>
import { inject, ref, onMounted } from 'vue'
const { info } = defineProps({ info: Object })
const isPro = inject('isPro', false)
const relatedProducts = ref([])
const relatedLoading = ref(false)
const relatedError = ref('')
onMounted(async () => {
  if (isPro && info?.name) {
    relatedLoading.value = true
    relatedError.value = ''
    try {
      const res = await fetch(`/api/related-products/${encodeURIComponent(info.name)}`)
      const data = await res.json()
      relatedProducts.value = data.related || []
    } catch (e) {
      relatedError.value = 'Failed to load related products.'
    } finally {
      relatedLoading.value = false
    }
  }
})
</script>

<style scoped>
.supplement-info-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.supplement-info-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.supplement-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #334155;
  margin: 0;
  padding-left: 20px;
}

.no-info {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #94a3b8;
  font-style: italic;
}

.related-products-section {
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

@media (max-width: 600px) {
  .supplement-info-card {
    padding: 10px 4px !important;
    margin-bottom: 8px !important;
    border-radius: 10px !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  .card-header {
    margin-bottom: 8px !important;
    padding-bottom: 4px !important;
  }
  .supplement-name {
    font-size: 1rem !important;
  }
  .info-value {
    font-size: 0.9rem !important;
    padding-left: 12px !important;
  }
  .info-label {
    font-size: 0.85rem !important;
  }
  .no-info {
    font-size: 0.85rem !important;
  }
}
</style> 