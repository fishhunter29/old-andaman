<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDataPack } from '@/composables/useDataPack'
import { useCart } from '@/stores/useCart'

// Right-side panel (Trip Summary)
import TripSummary from '@/components/TripSummary.vue'

// Left-side pickers
import CabPicker from '@/components/CabPicker.vue'
import FerryPicker from '@/components/FerryPicker.vue'
import ActivitiesPicker from '@/components/ActivitiesPicker.vue'
import ScooterPicker from '@/components/ScooterPicker.vue'
import BicyclePicker from '@/components/BicyclePicker.vue'

const { load, isLoading } = useDataPack()
const cart = useCart()
const data = ref<any>(null)

onMounted(async () => {
  data.value = await load()
  const { currency = 'INR', taxPercent = 0, serviceFee = 0 } = data.value.meta || {}
  cart.setMeta(currency, taxPercent, serviceFee)
})
</script>

<template>
  <div class="app-root">
    <header class="app-header">
      <div class="brand">Andaman Islands Trip Planner</div>
    </header>

    <div class="app-layout">
      <!-- LEFT PANEL: All pickers -->
      <div class="left-panel">
        <section v-if="isLoading" class="loading-section">Loading travel data…</section>

        <section v-else class="picker-stack">
          <CabPicker />
          <FerryPicker />
          <ActivitiesPicker />
          <ScooterPicker />
          <BicyclePicker />
        </section>
      </div>

      <!-- RIGHT PANEL: Trip summary -->
      <div class="right-panel">
        <TripSummary />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Root container */
.app-root {
  width: 100%;
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

/* Header */
.app-header {
  background: #0f172a;
  padding: 16px 24px;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.brand {
  letter-spacing: 0.5px;
}

/* Layout: Two panels */
.app-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.9fr) minmax(320px, 1.1fr);
  gap: 24px;
  padding: 24px;
}

/* Left panel with pickers */
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.picker-stack section {
  background: #ffffff;
  padding: 16px;
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
}

.loading-section {
  font-size: 16px;
  padding: 20px;
  text-align: center;
}

/* Right panel: trip summary */
.right-panel {
  position: relative;
}

/* Responsive: Collapse to single column */
@media (max-width: 900px) {
  .app-layout {
    grid-template-columns: 1fr;
  }
  .right-panel {
    position: static;
  }
}
</style>
