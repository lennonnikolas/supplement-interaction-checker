<template>
  <v-card class="mb-3" outlined>
    <v-card-title>{{ info.name }}</v-card-title>
    <v-card-text>
      <div v-if="info.description"><strong>Description:</strong> {{ info.description }}</div>
      <div v-if="info.synonyms && info.synonyms.length"><strong>Synonyms:</strong> {{ info.synonyms.join(', ') }}</div>
      <div v-if="!info.description && (!info.synonyms || !info.synonyms.length)" class="text-grey">
        No additional information available.
      </div>
    </v-card-text>
  </v-card>
</template>
<script setup>
defineProps({ info: Object })
</script> 