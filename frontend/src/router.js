import { createRouter, createWebHistory } from 'vue-router'
import Home from './components/Home.vue'
import Profile from './components/Profile.vue'
import Blog from './components/Blog.vue'
import FAQ from './components/FAQ.vue'
import PasswordResetForm from './components/PasswordResetForm.vue'
import PaymentSuccess from './views/PaymentSuccess.vue'
import PaymentCancel from './views/PaymentCancel.vue'
import OAuthSuccess from './components/OAuthSuccess.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/profile', component: Profile },
  { path: '/blog', component: Blog },
  { path: '/faq', component: FAQ },
  { path: '/reset-password', component: PasswordResetForm },
  { path: '/payment-success', component: PaymentSuccess },
  { path: '/payment-cancel', component: PaymentCancel },
  { path: '/oauth-success', component: OAuthSuccess },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router 