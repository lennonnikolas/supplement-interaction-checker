<template>
  <v-dialog v-model="open" max-width="420">
    <v-card>
      <v-card-title class="font-weight-bold text-center">Upgrade to Pro</v-card-title>
      <v-card-text>
        <ul class="pro-features-list mb-4">
          <li class="pro-feature-item"><v-icon color="success" class="mr-2">mdi-check-circle</v-icon>Check unlimited supplements at once</li>
          <li class="pro-feature-item"><v-icon color="success" class="mr-2">mdi-check-circle</v-icon>Save and manage your stacks</li>
          <li class="pro-feature-item"><v-icon color="success" class="mr-2">mdi-check-circle</v-icon>See detailed interaction evidence</li>
          <li class="pro-feature-item"><v-icon color="success" class="mr-2">mdi-check-circle</v-icon>Get full alternative suggestions</li>
          <li class="pro-feature-item"><v-icon color="success" class="mr-2">mdi-check-circle</v-icon>Priority support & more</li>
        </ul>
        <v-btn color="primary" large block class="mb-2" href="#">Sign Up for Pro</v-btn>
        <v-btn text block @click="onClose">Close</v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script setup>
import { ref, watch } from 'vue'
const props = defineProps({ open: Boolean, onClose: Function })
const open = ref(props.open)
watch(() => props.open, v => open.value = v)
</script>
<style scoped>
.pro-features-list {
  list-style: none;
  padding: 0;
}
.pro-feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 1.08rem;
}
</style> 