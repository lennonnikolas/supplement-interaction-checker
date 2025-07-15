<template>
  <v-card class="mb-3" outlined>
    <v-card-title>Recent Checks</v-card-title>
    <v-card-text>
      <div v-if="recent.length === 0">No recent checks.</div>
      <v-list v-else>
        <v-list-item v-for="(item, idx) in recent" :key="idx">
          <v-list-item-content>
            <div>{{ item.stack.join(', ') }}</div>
            <div class="text-caption text-grey">{{ new Date(item.date).toLocaleString() }}</div>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn size="small" @click="$emit('rerun', item.stack)">Re-run</v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>
<script setup>
defineProps({ recent: Array })
</script> 