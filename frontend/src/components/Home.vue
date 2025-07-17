<template>
  <v-container class="pt-app-bar" fluid>
    <div class="saas-home">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-visual">
          <img src="/src/assets/SuppScanrLogo-Transparent.png" alt="SuppScanr Logo" class="hero-mockup" style="max-width: 180px; max-height: 180px; margin: 0 auto; display: block;" />
        </div>
        <div class="hero-content">
          <h1 class="hero-title">
            Instantly Check Your Supplement Stack
          </h1>
          <p class="hero-subtitle">
            Get evidence-based insights on supplement interactions, powered by medical research and AI. Stop guessing, start knowing.
          </p>
          <v-btn v-if="!isPro" color="primary" size="x-large" class="hero-cta-btn" @click="$emit('show-pro-modal')" prepend-icon="mdi-crown">
            Start Free Trial
          </v-btn>
          <div class="hero-trust">
            <span>No credit card required</span>
            <span>•</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features">
        <div class="features-grid">
          <div class="feature-card">
            <v-icon color="primary" size="32">mdi-magnify</v-icon>
            <h3>Instant Interaction Checks</h3>
            <p>Analyze your stack in seconds with the latest research and AI.</p>
          </div>
          <div class="feature-card">
            <v-icon color="primary" size="32">mdi-content-save</v-icon>
            <h3>Save & Manage Stacks</h3>
            <p>Store your favorite supplement combinations for quick access.</p>
          </div>
          <div class="feature-card">
            <v-icon color="primary" size="32">mdi-microscope</v-icon>
            <h3>Detailed Evidence</h3>
            <p>See the science and reasoning behind every interaction result.</p>
          </div>
          <div class="feature-card">
            <v-icon color="primary" size="32">mdi-headset</v-icon>
            <h3>Priority Support</h3>
            <p>Get help from our team whenever you need it.</p>
          </div>
        </div>
      </section>

      <!-- Main Tool Section -->
      <section id="tool-section" class="tool-section">
        <div class="tool-card">
          <StackChecker @update:stack="onStackChecked" :rerun-stack="rerunStack" :stack-id="rerunStackId" @loading="loading = $event" @show-pro-modal="$emit('show-pro-modal')" />
        </div>
        <div v-if="supplementInfoList.length || alternativesList.length" class="results-card">
          <div v-if="supplementInfoList.length" class="results-group">
            <h3 class="results-title">Supplement Information</h3>
            <div class="results-grid">
              <SupplementInfoCard v-for="info in supplementInfoList" :key="info.name" :info="info" />
            </div>
          </div>
          <div v-if="alternativesList.length" class="results-group">
            <h3 class="results-title">Safer Alternatives</h3>
            <div class="results-grid">
              <AlternativeCard v-for="alt in alternativesList" :key="alt.name" v-bind="alt" />
            </div>
          </div>
        </div>
      </section>

      <!-- Pro Funnel Section - Only show for non-Pro users -->
      <section v-if="!isPro" class="pro-funnel">
        <div class="pro-funnel-card">
          <div class="pro-funnel-header">
            <v-icon color="primary" size="32" class="mb-2">mdi-crown</v-icon>
            <h2>Upgrade to Pro</h2>
            <p>Unlock unlimited checks, save your stacks, and get detailed research evidence.</p>
          </div>
          <div class="pro-funnel-features">
            <div class="pro-feature"><v-icon color="success" size="18" class="mr-2">mdi-check</v-icon> Unlimited supplement checks</div>
            <div class="pro-feature"><v-icon color="success" size="18" class="mr-2">mdi-check</v-icon> Save & manage stacks</div>
            <div class="pro-feature"><v-icon color="success" size="18" class="mr-2">mdi-check</v-icon> Detailed interaction evidence</div>
            <div class="pro-feature"><v-icon color="success" size="18" class="mr-2">mdi-check</v-icon> Priority support</div>
          </div>
          <div class="pro-funnel-pricing">
            <span class="pro-price">$9.99</span><span class="pro-period">/month</span>
            <span class="pro-badge">7-day free trial</span>
          </div>
          <v-btn v-if="!isPro" color="primary" size="x-large" class="pro-funnel-cta" @click="$emit('show-pro-modal')" prepend-icon="mdi-crown">
            Start Free Trial
          </v-btn>
          <div class="pro-funnel-trust">No credit card required • Cancel anytime</div>
        </div>
      </section>

      <!-- Pro Success Section - Show for Pro users -->
      <section v-if="isPro" class="pro-success">
        <div class="pro-success-card">
          <div class="pro-success-header">
            <v-icon color="success" size="32" class="mb-2">mdi-crown</v-icon>
            <h2>Welcome to Pro!</h2>
            <p>You have access to all premium features. Enjoy unlimited supplement checks and advanced insights.</p>
          </div>
          <div class="pro-success-features">
            <div class="pro-feature"><v-icon color="success" size="18" class="mr-2">mdi-check</v-icon> Unlimited supplement checks</div>
            <div class="pro-feature"><v-icon color="success" size="18" class="mr-2">mdi-check</v-icon> Save & manage stacks</div>
            <div class="pro-feature"><v-icon color="success" size="18" class="mr-2">mdi-check</v-icon> Detailed interaction evidence</div>
            <div class="pro-feature"><v-icon color="success" size="18" class="mr-2">mdi-check</v-icon> Priority support</div>
          </div>
          <v-btn color="secondary" size="large" class="pro-success-cta" @click="$router.push('/profile')" prepend-icon="mdi-account">
            Manage Subscription
          </v-btn>
        </div>
      </section>

      <!-- Pro Modal -->
      <ProModal v-if="!isPro" :open="showProModal" :onClose="() => showProModal = false" />
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, inject, computed } from 'vue'
import StackChecker from './StackChecker.vue'
import SupplementInfoCard from './SupplementInfoCard.vue'
import AlternativeCard from './AlternativeCard.vue'
import ProModal from './ProModal.vue'

// Get user and isPro state from App.vue
const user = inject('user', ref(null))
const isPro = inject('isPro', ref(false))

const supplementInfoList = ref([])
const alternativesList = ref([])
const rerunStack = ref(null)
const rerunStackId = ref(null)
const loading = ref(false)
const showProModal = ref(false)

const isMobile = computed(() => window.innerWidth <= 600)

function onStackChecked(stack, risks, supplementDetails) {
  supplementInfoList.value = supplementDetails || []
  // You can add logic for alternatives here if needed
}

function scrollToTool() {
  document.getElementById('tool-section').scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<style scoped>
.saas-home {
  background: #f8fafc;
  min-height: 100vh;
  font-family: 'Inter', system-ui, sans-serif;
}
.hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  padding: 12px 0 20px 0;
  background: linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%);
  position: relative;
}
@media (max-width: 600px) {
  .hero {
    flex-direction: column;
    padding: 8px 0 8px 0;
  }
  .hero-visual {
    order: 1;
    width: 100%;
    display: flex;
    justify-content: center;
    margin-bottom: 8px;
  }
  .hero-content {
    order: 2;
    max-width: 100%;
    margin-right: 0;
    padding: 0 8px;
    text-align: center;
  }
  .hero-title {
    font-size: 2rem;
    margin-bottom: 8px;
  }
  .hero-subtitle {
    font-size: 1rem;
    margin-bottom: 12px;
  }
  .hero-cta-btn {
    width: 100%;
    padding: 12px 0;
    font-size: 1rem;
    margin-bottom: 8px;
  }
  .hero-visual {
    max-width: 100%;
    min-width: 0;
    margin-top: 18px;
    padding: 0 8px;
  }
  .hero-mockup {
    border-radius: 16px;
  }
  .features {
    padding: 24px 0 16px 0;
  }
  .features-grid {
    grid-template-columns: 1fr;
    gap: 18px;
    padding: 0 8px;
  }
  .feature-card {
    padding: 20px 10px;
    border-radius: 12px;
  }
  .tool-section {
    padding: 24px 0 16px 0;
  }
  .tool-card,
  .results-card {
    padding: 18px 6px;
    border-radius: 12px;
    max-width: 100%;
    margin-bottom: 18px;
  }
  .results-title {
    font-size: 1.1rem;
    margin-bottom: 10px;
  }
  .results-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .pro-funnel,
  .pro-success {
    padding: 32px 0 24px 0;
  }
  .pro-funnel-card,
  .pro-success-card {
    padding: 18px 8px;
    border-radius: 14px;
    max-width: 100%;
  }
  .pro-funnel-header h2,
  .pro-success-header h2 {
    font-size: 1.3rem;
  }
  .pro-funnel-header p,
  .pro-success-header p {
    font-size: 1rem;
    margin-bottom: 12px;
  }
  .pro-funnel-cta,
  .pro-success-cta {
    width: 100%;
    padding: 12px 0;
    font-size: 1rem;
  }
  .pro-funnel-trust {
    font-size: 0.95rem;
  }
}
.hero-content {
  max-width: 540px;
  margin-right: 48px;
  z-index: 2;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  background: rgba(99, 102, 241, 0.08);
  color: #3730a3;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 20px;
  padding: 6px 16px;
  margin-bottom: 24px;
}
.hero-title {
  font-size: 2.8rem;
  font-weight: 800;
  margin-bottom: 18px;
  color: #1e293b;
  line-height: 1.1;
}
.hero-subtitle {
  font-size: 1.25rem;
  color: #475569;
  margin-bottom: 32px;
  line-height: 1.6;
}
.hero-cta-btn {
  font-size: 1.2rem;
  font-weight: 700;
  border-radius: 12px;
  padding: 16px 36px;
  margin-bottom: 18px;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
}
.hero-trust {
  color: #64748b;
  font-size: 1rem;
  margin-top: 8px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.hero-visual {
  min-width: 320px;
  max-width: 420px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-mockup {
  width: 100%;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.10);
  border: 1px solid #e0e7ff;
}
.features {
  padding: 48px 0 32px 0;
  background: #fff;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 32px;
  max-width: 1000px;
  margin: 0 auto;
}
.feature-card {
  background: #f8fafc;
  border-radius: 18px;
  box-shadow: 0 2px 12px 0 rgba(31, 38, 135, 0.06);
  padding: 32px 24px;
  text-align: center;
  transition: box-shadow 0.2s, transform 0.2s;
}
.feature-card:hover {
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.10);
  transform: translateY(-4px);
}
.feature-card h3 {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 18px 0 10px 0;
  color: #3730a3;
}
.feature-card p {
  color: #64748b;
  font-size: 1rem;
}
.tool-section {
  padding: 56px 0 32px 0;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tool-card {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(31, 38, 135, 0.08);
  padding: 40px 32px;
  max-width: 700px;
  width: 100%;
  margin-bottom: 32px;
}
.results-card {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(31, 38, 135, 0.08);
  padding: 32px 24px;
  max-width: 700px;
  width: 100%;
  margin-bottom: 32px;
}
.results-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #3730a3;
  margin-bottom: 18px;
}
.results-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}
@media (min-width: 600px) {
  .results-grid {
    grid-template-columns: 1fr 1fr;
  }
}
.pro-funnel {
  background: linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%);
  padding: 80px 0 60px 0;
  display: flex;
  justify-content: center;
}
.pro-funnel-card {
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.10);
  padding: 48px 36px;
  max-width: 480px;
  width: 100%;
  text-align: center;
}
.pro-funnel-header h2 {
  font-size: 2rem;
  font-weight: 800;
  color: #3730a3;
  margin-bottom: 10px;
}
.pro-funnel-header p {
  color: #64748b;
  font-size: 1.1rem;
  margin-bottom: 24px;
}
.pro-funnel-features {
  margin-bottom: 24px;
}
.pro-feature {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  color: #475569;
  margin-bottom: 8px;
}
.pro-funnel-pricing {
  font-size: 2rem;
  font-weight: 800;
  color: #f59e0b;
  margin-bottom: 8px;
}
.pro-period {
  font-size: 1.1rem;
  color: #64748b;
  font-weight: 500;
  margin-left: 4px;
}
.pro-badge {
  display: inline-block;
  background: #fbbf24;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 12px;
  padding: 2px 12px;
  margin-left: 12px;
}
.pro-funnel-cta {
  font-size: 1.1rem;
  font-weight: 700;
  border-radius: 12px;
  padding: 16px 36px;
  margin: 18px 0 8px 0;
  box-shadow: 0 4px 16px rgba(251, 191, 36, 0.10);
}
.pro-funnel-trust {
  color: #64748b;
  font-size: 1rem;
  margin-top: 8px;
}

/* Pro Success Section */
.pro-success {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  padding: 80px 0 60px 0;
  display: flex;
  justify-content: center;
}
.pro-success-card {
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.10);
  padding: 48px 36px;
  max-width: 480px;
  width: 100%;
  text-align: center;
}
.pro-success-header h2 {
  font-size: 2rem;
  font-weight: 800;
  color: #10b981;
  margin-bottom: 10px;
}
.pro-success-header p {
  color: #64748b;
  font-size: 1.1rem;
  margin-bottom: 24px;
}
.pro-success-features {
  margin-bottom: 24px;
}
.pro-success-cta {
  font-weight: 600;
  border-radius: 12px;
  padding: 12px 24px;
}
</style> 