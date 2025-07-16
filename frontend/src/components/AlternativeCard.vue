<template>
  <v-card class="mb-3" outlined>
    <v-card-title>Alternative for {{ name }}</v-card-title>
    <v-card-text>
      <template v-if="alternative">
        <div><strong>Suggested:</strong> {{ alternative }}</div>
        <div><strong>Why:</strong> {{ reason }}</div>
        <div class="mt-2 text-caption text-info">{{ upgradePrompt }}</div>
      </template>
      <template v-else>
        <div>No alternative exists for this supplement.</div>
      </template>
    </v-card-text>
  </v-card>
</template>
<script setup>
defineProps({ name: String, alternative: String, reason: String, upgradePrompt: String })
</script> 