import { ref, watch, onMounted, onUnmounted } from 'vue'

export function useSessionTimeout({ logout, showAuthModal, user, timeoutMinutes = 30 }) {
  let sessionTimeoutId = null

  function resetSessionTimeout() {
    if (sessionTimeoutId) clearTimeout(sessionTimeoutId)
    sessionTimeoutId = setTimeout(() => {
      logout()
      if (showAuthModal) showAuthModal.value = true
      alert('You have been logged out due to inactivity.')
    }, timeoutMinutes * 60 * 1000)
  }

  function setupSessionTimeoutListeners() {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart']
    events.forEach(event => {
      window.addEventListener(event, resetSessionTimeout)
    })
  }

  function cleanupSessionTimeoutListeners() {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart']
    events.forEach(event => {
      window.removeEventListener(event, resetSessionTimeout)
    })
    if (sessionTimeoutId) clearTimeout(sessionTimeoutId)
  }

  onMounted(() => {
    setupSessionTimeoutListeners()
    resetSessionTimeout()
  })

  onUnmounted(() => {
    cleanupSessionTimeoutListeners()
  })

  watch(user, (val) => {
    if (val) {
      resetSessionTimeout()
    } else {
      if (sessionTimeoutId) clearTimeout(sessionTimeoutId)
    }
  })

  return { resetSessionTimeout, cleanupSessionTimeoutListeners }
} 