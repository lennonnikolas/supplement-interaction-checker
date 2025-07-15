<template>
  <v-card class="mb-3" outlined>
    <v-card-title>Alternative for {{ name }}</v-card-title>
    <v-card-text>
      <div><strong>Suggested:</strong> {{ alternative }}</div>
      <div><strong>Why:</strong> {{ reason }}</div>
      <div class="mt-2 text-caption text-info">{{ upgradePrompt }}</div>
    </v-card-text>
  </v-card>
</template>
<script setup>
defineProps({ name: String, alternative: String, reason: String, upgradePrompt: String })
</script> 