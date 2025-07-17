<template>
  <div class="alternative-card">
    <div class="card-header">
      <v-icon color="success" size="20" class="mr-2">mdi-shield-check</v-icon>
      <h3 class="alternative-title">Alternative for {{ name }}</h3>
    </div>
    <div class="card-content">
      <template v-if="alternative">
        <div class="alternative-item">
          <div class="alternative-label">
            <v-icon color="success" size="16" class="mr-1">mdi-check-circle</v-icon>
            Suggested Alternative
          </div>
          <p class="alternative-value">{{ alternative }}</p>
        </div>
        <div class="reason-item">
          <div class="reason-label">
            <v-icon color="info" size="16" class="mr-1">mdi-lightbulb</v-icon>
            Why This Alternative
          </div>
          <p class="reason-value">{{ reason }}</p>
        </div>
        <div class="upgrade-prompt">
          <v-icon color="primary" size="14" class="mr-1">mdi-star</v-icon>
          <span class="upgrade-text">{{ upgradePrompt }}</span>
        </div>
      </template>
      <template v-else>
        <div class="no-alternative">
          <v-icon color="grey" size="16" class="mr-1">mdi-help-circle</v-icon>
          <span class="text-grey">No alternative exists for this supplement</span>
        </div>
      </template>
    </div>
  </div>
</template>
<script setup>
defineProps({ name: String, alternative: String, reason: String, upgradePrompt: String })
</script>

<style scoped>
.alternative-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.alternative-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #bbf7d0;
}

.alternative-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #166534;
  margin: 0;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alternative-item,
.reason-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alternative-label,
.reason-label {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #059669;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.alternative-value,
.reason-value {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #166534;
  margin: 0;
  padding-left: 20px;
}

.upgrade-prompt {
  display: flex;
  align-items: center;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 8px;
}

.upgrade-text {
  font-size: 0.875rem;
  color: #1e40af;
  font-weight: 500;
}

.no-alternative {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #94a3b8;
  font-style: italic;
}

@media (max-width: 600px) {
  .alternative-card {
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
  .alternative-title {
    font-size: 1rem !important;
  }
  .alternative-value,
  .reason-value {
    font-size: 0.9rem !important;
    padding-left: 12px !important;
  }
  .alternative-label,
  .reason-label {
    font-size: 0.85rem !important;
  }
  .upgrade-text {
    font-size: 0.85rem !important;
  }
  .no-alternative {
    font-size: 0.85rem !important;
  }
}
</style> 