<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useDataPack } from '@/composables/useDataPack'
import { useCart } from '@/stores/useCart'

// Components
import TripSummary from '@/components/TripSummary.vue'
import ActivitiesPicker from '@/components/ActivitiesPicker.vue'
import CabPicker from '@/components/CabPicker.vue'
import FerryPicker from '@/components/FerryPicker.vue'
import ScooterPicker from '@/components/ScooterPicker.vue'
import BicyclePicker from '@/components/BicyclePicker.vue'

const { load, isLoading, error } = useDataPack()
const cart = useCart()
const data = ref<any | null>(null)

// hero gate
const hasStarted = ref(false)

// wizard steps
const step = ref(0)
const steps = [
  { key: 'basics',   label: 'Trip basics' },
  { key: 'play',     label: 'Locations & activities' },
  { key: 'cabs',     label: 'Cabs & local transfers' },
  { key: 'ferries',  label: 'Ferries' },
  { key: 'wheels',   label: 'Scooters & bicycles' }
]

// simple basics state for now
const startDate = ref<string>('')
const adults    = ref<number>(2)
const children  = ref<number>(0)

onMounted(async () => {
  const loaded = await load()
  data.value = loaded

  const meta = loaded?.meta || {}
  cart.setMeta(
    (meta.currency as any) ?? 'INR',
    Number(meta.taxPercent ?? 0),
    Number(meta.serviceFee ?? 0)
  )
})

const currentStepLabel = computed(() => steps[step.value]?.label ?? '')
const paxLabel = computed(() => {
  const a = adults.value || 0
  const c = children.value || 0
  if (!a && !c) return 'No travellers set'
  if (!c) return `${a} adult(s)`
  return `${a} adult(s), ${c} child(ren)`
})

function startPlanner() {
  hasStarted.value = true
}

function goNext() {
  if (step.value < steps.length - 1) step.value++
}
function goPrev() {
  if (step.value > 0) step.value--
}
function goTo(idx: number) {
  if (idx >= 0 && idx < steps.length) step.value = idx
}
</script>

<template>
  <div class="app-root">
    <!-- HERO GATEWAY -->
    <section v-if="!hasStarted" class="hero-shell">
      <div class="hero-inner">
        <div class="hero-left">
          <div class="hero-pill">AI-assisted Andaman tour builder</div>
          <h1>Create your Andaman trip in 6 smart steps.</h1>
          <p class="hero-sub">
            Start from Port Blair, drag-and-drop locations, plug in ferries, cabs,
            scooters & bicycles – and get a clean, shareable cost breakdown.
          </p>

          <div class="hero-form">
            <div class="hero-row">
              <label>
                <span>Start date (optional)</span>
                <input type="date" v-model="startDate" />
              </label>
              <label>
                <span>Adults</span>
                <input type="number" min="1" v-model.number="adults" />
              </label>
              <label>
                <span>Children</span>
                <input type="number" min="0" v-model.number="children" />
              </label>
            </div>
            <div class="hero-row hero-row-bottom">
              <div class="hero-pax">
                Travellers: <strong>{{ paxLabel }}</strong>
              </div>
              <button type="button" class="hero-cta" @click="startPlanner">
                Start building your trip →
              </button>
            </div>
          </div>

          <div class="hero-footnote">
            No instant booking – this creates a structured plan + cost sheet
            you can share with travellers and local vendors.
          </div>
        </div>

        <div class="hero-right">
          <!-- simple placeholder “mock screenshot” -->
          <div class="hero-card">
            <div class="hero-card-header">
              <span>Preview</span>
              <span class="hero-chip">Trip summary</span>
            </div>
            <div class="hero-card-body">
              <p>Day 1 – Port Blair • Arrival • Cellular Jail • Light &amp; Sound Show</p>
              <p>Day 2 – Havelock • Radhanagar Beach • Kayaking</p>
              <p class="hero-card-total">Indicative total: ₹ 1,24,000</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- MAIN PLANNER -->
    <div v-else class="planner-shell">
      <!-- sticky header -->
      <header class="planner-header">
        <div class="ph-left">
          <div class="logo-dot"></div>
          <div class="ph-text">
            <div class="ph-title">Andaman Trip Planner</div>
            <div class="ph-sub">
              Step {{ step + 1 }} / {{ steps.length }} ·
              <span>{{ currentStepLabel }}</span>
            </div>
          </div>
        </div>
        <div class="ph-right">
          <div class="ph-basics">
            <span>Start: <strong>{{ startDate || 'not set' }}</strong></span>
            <span class="dot">•</span>
            <span>Pax: <strong>{{ paxLabel }}</strong></span>
          </div>
        </div>
      </header>

      <!-- stepper -->
      <nav class="stepper">
        <button
          v-for="(s, idx) in steps"
          :key="s.key"
          type="button"
          :class="['step-btn', { active: idx === step }]"
          @click="goTo(idx)"
        >
          <span class="step-index">{{ idx + 1 }}</span>
          <span class="step-label">{{ s.label }}</span>
        </button>
      </nav>

      <!-- two-column layout -->
      <main class="planner-main">
        <section class="planner-main-left">
          <!-- STEP 0 – basics (we already captured most on hero; here we just show/edit) -->
          <div v-if="step === 0" class="panel">
            <h2>Trip basics</h2>
            <p class="panel-sub">
              You can tweak dates & travellers here. This will feed into ferries,
              hotels and total costing later.
            </p>
            <div class="grid-3">
              <label class="field">
                <span>Start date</span>
                <input type="date" v-model="startDate" />
              </label>
              <label class="field">
                <span>Adults</span>
                <input type="number" min="1" v-model.number="adults" />
              </label>
              <label class="field">
                <span>Children</span>
                <input type="number" min="0" v-model.number="children" />
              </label>
            </div>
            <div class="panel-footer">
              <button disabled class="btn-ghost">Back</button>
              <button class="btn-primary" @click="goNext">Next: Locations & activities</button>
            </div>
          </div>

          <!-- STEP 1 – locations & activities (for now: Activities picker block; later we’ll add LocationPicker) -->
          <div v-else-if="step === 1" class="panel">
            <h2>Locations & activities</h2>
            <p class="panel-sub">
              Start dropping in activities first – we’ll wire a dedicated
              island-wise Location picker next, using your locations.json +
              location_adventures.json.
            </p>
            <ActivitiesPicker />
            <div class="panel-footer">
              <button class="btn-ghost" @click="goPrev">Back</button>
              <button class="btn-primary" @click="goNext">Next: Cabs & transfers</button>
            </div>
          </div>

          <!-- STEP 2 – cabs -->
          <div v-else-if="step === 2" class="panel">
            <h2>Cabs & local transfers</h2>
            <p class="panel-sub">
              Pick point-to-point or day cabs for Port Blair, Havelock, Neil,
              Rangat, Mayabunder & Diglipur. All items feed into the trip summary.
            </p>
            <CabPicker />
            <div class="panel-footer">
              <button class="btn-ghost" @click="goPrev">Back</button>
              <button class="btn-primary" @click="goNext">Next: Ferries</button>
            </div>
          </div>

          <!-- STEP 3 – ferries -->
          <div v-else-if="step === 3" class="panel">
            <h2>Ferries</h2>
            <p class="panel-sub">
              Add inter-island ferries with sample fares per operator. In the
              real integration, these will come from Nautika / Makruzz APIs.
            </p>
            <FerryPicker />
            <div class="panel-footer">
              <button class="btn-ghost" @click="goPrev">Back</button>
              <button class="btn-primary" @click="goNext">
                Next: Scooters & bicycles
              </button>
            </div>
          </div>

          <!-- STEP 4 – scooters & bicycles / review -->
          <div v-else-if="step === 4" class="panel">
            <h2>Scooters & bicycles</h2>
            <p class="panel-sub">
              Layer in scooter + bicycle rentals by island to complete the
              ground transport picture, especially for Havelock & Neil.
            </p>
            <ScooterPicker />
            <hr class="panel-divider" />
            <BicyclePicker />
            <div class="panel-footer">
              <button class="btn-ghost" @click="goPrev">Back</button>
              <button class="btn-primary" @click="goNext">
                Review – trip summary
              </button>
            </div>
          </div>

          <!-- STEP beyond: final review (optional, re-uses TripSummary fully expanded) -->
          <div v-else class="panel">
            <h2>Review & share</h2>
            <p class="panel-sub">
              Final check before you export or send to a traveller. All line
              items below are editable / removable.
            </p>
            <TripSummary />
            <div class="panel-footer">
              <button class="btn-ghost" @click="goPrev">Back</button>
              <button
                class="btn-primary"
                @click="() => alert('Here you will hook: send enquiry / export PDF / share link')"
              >
                Request to book / Export
              </button>
            </div>
          </div>
        </section>

        <!-- RIGHT: ultra-modern floating trip summary -->
        <aside class="planner-main-right">
          <TripSummary />
        </aside>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100vh;
  background: #f3f4f6;
  color: #0f172a;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* HERO */
.hero-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  background: radial-gradient(circle at top left, #e0f2fe, #f9fafb 45%, #eff6ff 90%);
}
.hero-inner {
  max-width: 1120px;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 32px;
}
.hero-left h1 {
  font-size: 32px;
  line-height: 1.2;
  margin: 12px 0;
}
.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #0369a1;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.4);
}
.hero-sub {
  font-size: 14px;
  color: #475569;
  max-width: 420px;
}
.hero-form {
  margin-top: 18px;
  padding: 14px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.14);
  border: 1px solid #e5e7eb;
}
.hero-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}
.hero-row-bottom {
  margin-top: 10px;
  align-items: center;
}
.hero-row label span {
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}
.hero-row input {
  width: 100%;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 13px;
}
.hero-pax {
  font-size: 12px;
  color: #475569;
}
.hero-cta {
  justify-self: flex-end;
  padding: 8px 16px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(90deg, #0ea5e9, #22c55e);
  color: white;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}
.hero-footnote {
  margin-top: 10px;
  font-size: 11px;
  color: #64748b;
}
.hero-right {
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-card {
  width: 100%;
  max-width: 360px;
  border-radius: 18px;
  background: #020617;
  color: #e5e7eb;
  padding: 14px;
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.6);
}
.hero-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 12px;
}
.hero-chip {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.3);
}
.hero-card-body p {
  font-size: 12px;
  margin: 4px 0;
}
.hero-card-total {
  margin-top: 8px;
  font-weight: 700;
}

/* PLANNER */
.planner-shell {
  min-height: 100vh;
}

/* header */
.planner-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
}
.ph-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, #0ea5e9, #22c55e);
}
.ph-title {
  font-size: 14px;
  font-weight: 700;
}
.ph-sub {
  font-size: 11px;
  color: #64748b;
}
.ph-right {
  font-size: 11px;
  color: #64748b;
  display: flex;
  gap: 8px;
}
.ph-basics {
  display: flex;
  align-items: center;
  gap: 6px;
}
.dot {
  font-size: 9px;
}

/* stepper */
.stepper {
  max-width: 1120px;
  margin: 8px auto 4px;
  padding: 0 16px 8px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
}
.step-btn {
  border-radius: 10px;
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  cursor: pointer;
}
.step-btn.active {
  background: #0ea5e9;
  border-color: #0ea5e9;
  color: #ffffff;
}
.step-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid currentColor;
  font-size: 10px;
}
.step-label {
  text-align: left;
}

/* main layout */
.planner-main {
  max-width: 1120px;
  margin: 0 auto;
  padding: 8px 16px 24px;
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 18px;
}
.planner-main-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.planner-main-right {
  position: relative;
}

/* panels */
.panel {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 14px 16px 12px;
  box-shadow: 0 10px 30px rgba(148, 163, 184, 0.2);
}
.panel h2 {
  font-size: 16px;
  margin: 0 0 4px;
}
.panel-sub {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 10px;
}
.grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}
.field span {
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}
.field input,
.field select {
  width: 100%;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 13px;
}
.panel-footer {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.btn-ghost {
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  font-size: 12px;
  cursor: pointer;
}
.btn-primary {
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid #0ea5e9;
  background: #0ea5e9;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.panel-divider {
  margin: 12px 0;
  border: none;
  border-top: 1px dashed #e5e7eb;
}

/* right summary */
.planner-main-right > * {
  position: sticky;
  top: 84px;
}

/* responsive */
@media (max-width: 900px) {
  .hero-inner {
    grid-template-columns: minmax(0, 1fr);
  }
  .planner-main {
    grid-template-columns: minmax(0, 1fr);
  }
  .planner-main-right > * {
    position: static;
  }
}
</style>
