import { createApp } from 'vue'
import App from './App.vue'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import router from './router'
import { createPinia } from 'pinia'
import VueGtag from 'vue-gtag-next'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'suppscanr',
    themes: {
      suppscanr: {
        dark: false,
        colors: {
          primary: '#155b5f',
          secondary: '#5c645c',
          surface: '#b4ccbc',
          background: '#f4f8f6',
          accent: '#b4ccbc',
          error: '#e57373',
          warning: '#ffb74d',
          info: '#155b5f',
          success: '#6fcf97',
          'on-primary': '#fff',
          'on-secondary': '#fff',
          'on-surface': '#213547',
          'on-background': '#213547',
          'on-error': '#fff',
          'on-warning': '#213547',
        },
      },
    },
  },
})

const app = createApp(App)
app.use(vuetify)
app.use(createPinia())
app.use(router)
app.use(VueGtag, {
  property: {
    id: 'G-K8MKNCQMGV' // TODO: Replace with your GA4 Measurement ID
  }
}, router)
app.mount('#app')
