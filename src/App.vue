<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDataPack } from '@/composables/useDataPack'
import { useCart } from '@/stores/useCart'

import TripSummary from '@/components/TripSummary.vue'
import CabPicker from '@/components/CabPicker.vue'
import FerryPicker from '@/components/FerryPicker.vue'
import ActivitiesPicker from '@/components/ActivitiesPicker.vue'
import ScooterPicker from '@/components/ScooterPicker.vue'
import BicyclePicker from '@/components/BicyclePicker.vue'

const { load, isLoading, error } = useDataPack()
const cart = useCart()
const data = ref<any>(null)

// Step control: hero first, then main console
const showPlanner = ref(false)

// Hero form state (we can later push this into a dedicated "trip" store)
const tripName = ref('My Andaman Escape')
const startDate = ref('')
const tripNights = ref(5)
const travellers = ref(2)
const mood = ref<'family' | 'romantic' | 'adventure' | 'relaxed' | 'mixed'>('mixed')

onMounted(async () => {
  try {
    data.value = await load()
    const { currency = 'INR', taxPercent = 0, serviceFee = 0 } = data.value.meta || {}
    cart.setMeta(currency, taxPercent, serviceFee)
  } catch (e) {
    console.error(e)
  }
})

function startPlanning() {
  // Later we can save hero choices into meta / a separate store
  showPlanner.value = true
}
</script>

<template>
  <main class="shell">
    <!-- LEFT: Hero or Builder -->
    <section class="left">
      <!-- STEP 0 – HERO / GATEWAY -->
      <div v-if="!showPlanner" class="hero-card">
        <div class="hero-pill">AI-assisted Andaman trip builder</div>

        <h1 class="hero-title">
          Craft your Andaman plan<br />
          in minutes, not weeks.
        </h1>

        <p class="hero-sub">
          Tell us the basics below, then unlock a smart console with ferries, cabs,
          scooters, bicycles and activities – all in one transparent view.
        </p>

        <div class="hero-form">
          <label class="hf-field">
            <span>Trip name</span>
            <input v-model="tripName" type="text" placeholder="e.g. Family Andaman 2026" />
          </label>

          <div class="hf-row">
            <label class="hf-field">
              <span>Start date (optional)</span>
              <input v-model="startDate" type="date" />
            </label>

            <label class="hf-field">
              <span>Nights</span>
              <input v-model.number="tripNights" type="number" min="1" />
            </label>

            <label class="hf-field">
              <span>Travellers</span>
              <input v-model.number="travellers" type="number" min="1" />
            </label>
          </div>

          <div class="hf-row">
            <label class="hf-field">
              <span>Vibe</span>
              <select v-model="mood">
                <option value="family">Family & kids</option>
                <option value="romantic">Romantic / couple</option>
                <option value="adventure">Adventure heavy</option>
                <option value="relaxed">Slow & relaxed</option>
                <option value="mixed">A bit of everything</option>
              </select>
            </label>
          </div>

          <button
            class="hero-cta"
            type="button"
            @click="startPlanning"
            :disabled="isLoading"
          >
            <span v-if="isLoading">Preparing data…</span>
            <span v-else>Start planning</span>
          </button>

          <p class="hero-foot">
            No login, no payment – this is a sandbox console you can share with your developer or DMC.
          </p>

          <p v-if="error" class="hero-error">
            ⚠️ Error loading data pack – please refresh once your JSON bundle is uploaded correctly.
          </p>
        </div>
      </div>

      <!-- STEP 1 – MAIN BUILDER -->
      <div v-else class="builder">
        <header class="builder-header">
          <div>
            <h1 class="builder-title">
              {{ tripName || 'Your Andaman trip' }}
            </h1>
            <p class="builder-sub">
              {{ travellers }} traveller<span v-if="travellers !== 1">s</span>
              <span v-if="tripNights"> • ~{{ tripNights }} night trip</span>
              <span v-if="startDate"> • from {{ startDate }}</span>
              <span> • vibe: {{ mood }}</span>
            </p>
          </div>
        </header>

        <div v-if="isLoading" class="loading-block">
          Loading islands, ferries & activities…
        </div>

        <div v-else class="picker-stack">
          <!-- Order: Activities → Ferries → Cabs → Scooters → Bicycles -->
          <ActivitiesPicker />
          <FerryPicker />
          <CabPicker />
          <ScooterPicker />
          <BicyclePicker />
        </div>
      </div>
    </section>

    <!-- RIGHT: Always-on trip summary (floating modern panel) -->
    <section class="right">
      <TripSummary />
    </section>
  </main>
</template>

<style>
:root {
  color-scheme: light;
}

body {
  margin: 0;
  background: radial-gradient(circle at top left, #eff6ff 0, #f9fafb 50%, #ffffff 100%);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 2-column shell */
.shell {
  max-width: 1180px;
  margin: 24px auto;
  padding: 16px;
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1.1fr);
  gap: 18px;
}

.left,
.right {
  min-width: 0;
}

/* HERO CARD */
.hero-card {
  padding: 20px 22px 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 10px;
}

.hero-title {
  font-size: 26px;
  line-height: 1.2;
  margin: 0 0 6px;
  letter-spacing: 0.01em;
  color: #0f172a;
}

.hero-sub {
  margin: 0 0 14px;
  font-size: 13px;
  color: #475569;
}

.hero-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hf-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hf-field {
  flex: 1 1 0;
  min-width: 130px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
}

.hf-field input,
.hf-field select {
  padding: 7px 9px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  font-size: 12px;
  outline: none;
}

.hf-field input:focus,
.hf-field select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
}

.hero-cta {
  margin-top: 4px;
  align-self: flex-start;
  padding: 8px 18px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #f9fafb;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.4);
}

.hero-cta:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
}

.hero-foot {
  margin: 4px 0 0;
  font-size: 11px;
  color: #94a3b8;
}

.hero-error {
  margin-top: 6px;
  font-size: 11px;
  color: #b91c1c;
}

/* BUILDER */
.builder {
  padding: 12px 0;
}

.builder-header {
  margin-bottom: 8px;
}

.builder-title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
}

.builder-sub {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.loading-block {
  margin-top: 16px;
  padding: 12px;
  border-radius: 12px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
}

.picker-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.picker-stack section {
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 10px 12px;
  background: #ffffff;
}

/* Responsive */
@media (max-width: 960px) {
  .shell {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
