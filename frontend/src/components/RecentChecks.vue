<template>
  <v-card class="recent-checks-card" elevation="0">
    <v-card-title class="recent-header">
      <v-icon color="primary" size="24" class="mr-2">mdi-history</v-icon>
      <span class="text-h6 font-weight-semibold">Recent Checks</span>
    </v-card-title>
    <v-card-text class="pa-0">
      <div v-if="recent.length === 0" class="no-recent">
        <v-icon color="grey" size="32" class="mb-2">mdi-clock-outline</v-icon>
        <p class="text-body-2 text-grey">No recent checks found</p>
      </div>
      <div v-else class="recent-list">
        <div 
          v-for="(item, idx) in recent" 
          :key="idx" 
          class="recent-item"
          :class="{ 'has-interactions': item.has_interactions }"
        >
          <div class="item-content">
            <div class="stack-names">
              <v-chip 
                v-for="supplement in item.stack" 
                :key="supplement"
                size="small" 
                variant="tonal"
                class="mr-1 mb-1"
              >
                {{ supplement }}
              </v-chip>
            </div>
            <div class="item-meta">
              <span class="text-caption text-grey">{{ formatDate(item.checked_at) }}</span>
              <v-chip 
                v-if="item.has_interactions" 
                size="x-small" 
                color="warning" 
                variant="tonal"
                class="ml-2"
              >
                Interactions Found
              </v-chip>
            </div>
          </div>
          <div class="item-actions">
            <v-btn 
              size="small" 
              variant="outlined"
              color="primary"
              @click="$emit('rerun', item.stack, item.id)"
              prepend-icon="mdi-refresh"
            >
              Re-run
            </v-btn>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
<script setup>
defineProps({ recent: Array })

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
  
  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }
}
</script>

<style scoped>
.recent-checks-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.recent-header {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e2e8f0;
  padding: 16px 20px;
}

.no-recent {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  text-align: center;
}

.recent-list {
  max-height: 400px;
  overflow-y: auto;
}

.recent-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s ease;
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-item:hover {
  background: #f8fafc;
}

.recent-item.has-interactions {
  border-left: 3px solid #f59e0b;
}

.item-content {
  flex: 1;
  margin-right: 16px;
}

.stack-names {
  margin-bottom: 8px;
}

.item-meta {
  display: flex;
  align-items: center;
}

.item-actions {
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .recent-checks-card {
    border-radius: 10px !important;
    padding: 8px 0 !important;
    margin-bottom: 12px !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  .recent-header {
    padding: 10px 8px !important;
    font-size: 1.1rem !important;
  }
  .no-recent {
    padding: 18px 8px !important;
    font-size: 1rem !important;
  }
  .recent-list {
    max-height: 240px !important;
    padding: 0 2px !important;
  }
  .recent-item {
    padding: 10px 8px !important;
    border-radius: 8px !important;
    font-size: 0.98rem !important;
  }
  .item-content {
    margin-right: 0 !important;
    width: 100% !important;
  }
  .item-actions {
    width: 100% !important;
  }
  .item-actions .v-btn {
    width: 100% !important;
    font-size: 1rem !important;
    margin: 6px 0 !important;
  }
  .stack-names {
    margin-bottom: 6px !important;
  }
  .text-h6 {
    font-size: 1rem !important;
  }
  .text-caption {
    font-size: 0.95rem !important;
  }
}
</style> 