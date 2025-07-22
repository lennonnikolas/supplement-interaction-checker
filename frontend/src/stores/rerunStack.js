import { defineStore } from 'pinia'

export const useRerunStackStore = defineStore('rerunStack', {
  state: () => ({
    stack: null,
    stackId: null,
  }),
  actions: {
    setRerunStack(stack, stackId) {
      this.stack = stack
      this.stackId = stackId
    },
    clear() {
      this.stack = null
      this.stackId = null
    }
  }
}) 