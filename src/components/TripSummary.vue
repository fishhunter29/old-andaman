<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCart } from '@/stores/useCart'
import type { CartItem } from '@/stores/useCart'

const cart = useCart()
const { items, totals } = storeToRefs(cart)

const isOpen = ref(true) // start expanded on desktop; you can set to false if you want collapsed

// Helper: total for a group of items
function sumItems(list: CartItem[]) {
  return list.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
}

// ---- TYPE & ISLAND GROUPING ----------------------------------------------

type KnownType = 'activity' | 'cab' | 'ferry' | 'scooter' | 'bicycle' | 'hotel' | 'other'

const typeLabels: Record<KnownType, string> = {
  activity: 'Activities',
  cab: 'Cabs / Local Transfers',
  ferry: 'Ferries',
  scooter: 'Scooter Rentals',
  bicycle: 'Bicycle Rentals',
  hotel: 'Hotels / Stays',
  other: 'Other Items'
}

const sectionsByType = computed(() => {
  const map: Record<KnownType, CartItem[]> = {
    activity: [],
    cab: [],
    ferry: [],
    scooter: [],
    bicycle: [],
    hotel: [],
    other: []
  }

  for (const item of items.value) {
    // Prefer explicit meta.type
    let t = (item.meta?.type as KnownType | undefined)

    // Fallback: infer from id prefix if meta.type is missing
    if (!t) {
      if (item.id.startsWith('act:')) t = 'activity'
      else if (item.id.startsWith('cab:')) t = 'cab'
      else if (item.id.startsWith('ferry:')) t = 'ferry'
      else if (item.id.startsWith('scooter:')) t = 'scooter'
      else if (item.id.startsWith('bicycle:')) t = 'bicycle'
      else if (item.id.startsWith('hotel:')) t = 'hotel'
      else t = 'other'
    }

    map[t].push(item)
  }

  return Object.entries(map)
    .filter(([, list]) => list.length > 0)
    .map(([key, list]) => ({
      type: key as KnownType,
      label: typeLabels[key as KnownType],
      items: list,
      total: sumItems(list)
    }))
})

const islandLabels: Record<string, string> = {
  PB: 'Port Blair',
  HL: 'Havelock (Swaraj Dweep)',
  NL: 'Neil (Shaheed Dweep)',
  DG: 'Diglipur',
  LI: 'Long Island',
  RG: 'Rangat',
  MB: 'Mayabunder',
  LA: 'Little Andaman',
  BT: 'Baratang (under Port Blair)',
  RX: 'Remote / Expeditions'
}

const byIsland = computed(() => {
  const map: Record<
    string,
    { islandId: string; label: string; items: CartItem[]; total: number }
  > = {}

  for (const item of items.value) {
    const islandId = item.meta?.islandId as string | undefined
    if (!islandId) continue
    if (!map[islandId]) {
      map[islandId] = {
        islandId,
        label: islandLabels[islandId] || islandId,
        items: [],
        total: 0
      }
    }
    map[islandId].items.push(item)
    map[islandId].total += item.unitPrice * item.quantity
  }

  return Object.values(map).sort((a, b) => a.label.localeCompare(b.label))
})

// ---- DAY-BY-DAY / WHEN HOTELS EXIST --------------------------------------

const byDay = computed(() => {
  const map: Record<
    string,
    { key: string; label: string; items: CartItem[]; total: number }
  > = {}

  for (const item of items.value) {
    const meta = item.meta || {}
    const day = meta.dayLabel ?? meta.dateLabel ?? meta.day
    if (!day) continue

    const key = String(day)
    const label =
      typeof day === 'string'
        ? day
        : `Day ${day}`

    if (!map[key]) {
      map[key] = { key, label, items: [], total: 0 }
    }
    map[key].items.push(item)
    map[key].total += item.unitPrice * item.quantity
  }

  return Object.values(map).sort((a, b) => a.label.localeCompare(b.label))
})

const hasHotel = computed(() =>
  items.value.some(i => i.meta?.type === 'hotel')
)

// ---- SMART SUGGESTIONS ---------------------------------------------------

const suggestions = computed(() => {
  const s: string[] = []

  const hasIsland = (id: string) =>
    items.value.some(i => i.meta?.islandId === id)

  const hasType = (type: KnownType) =>
    items.value.some(i => (i.meta?.type as KnownType) === type)

  const anyWaterActivity = items.value.some(
    i =>
      (i.meta?.type === 'activity') &&
      ['water', 'dive', 'adventure'].includes(String(i.meta?.category || ''))
  )

  if (hasIsland('HL') && !hasType('scooter')) {
    s.push('You are visiting Havelock – consider adding a scooter rental for 1–2 days.')
  }
  if (hasIsland('NL') && !hasType('bicycle')) {
    s.push('Neil is compact and flat – bicycles work very well for sunrise/sunset runs.')
  }
  if (anyWaterActivity && !hasType('ferry')) {
    s.push('You have water activities – make sure inter-island ferries are added and timed correctly.')
  }
  if (!hasHotel.value) {
    s.push('Hotels are not added yet – add stays to see day-by-day pricing and a realistic total.')
  }

  return s.slice(0, 3)
})

// ---- REMOVE HANDLER ------------------------------------------------------

function remove(id: string) {
  cart.remove(id)
}
</script>

<template>
  <div class="trip-summary-root">
    <!-- Floating / Collapsed bar -->
    <div class="trip-summary-bar" @click="isOpen = !isOpen">
      <div class="ts-left">
        <div class="ts-title">Trip summary</div>
        <div class="ts-subtitle">
          <span>{{ items.length }} items</span>
          <span class="dot">•</span>
          <span>{{ totals.currency }} {{ Math.round(totals.grandTotal).toLocaleString('en-IN') }}</span>
        </div>
      </div>
      <div class="ts-right">
        <div class="ts-tags">
          <span
            v-for="section in sectionsByType"
            :key="section.type"
            class="ts-chip"
          >
            {{ section.label }}:
            {{ totals.currency }}
            {{ Math.round(section.total).toLocaleString('en-IN') }}
          </span>
        </div>
        <button class="ts-toggle-btn" type="button">
          {{ isOpen ? 'Hide details ▲' : 'View breakdown ▼' }}
        </button>
      </div>
    </div>

    <!-- Slide-down detailed panel -->
    <transition name="slide-fade">
      <div v-if="isOpen" class="trip-summary-panel">
        <div class="panel-grid">
          <!-- Left: detailed line-items grouped by type -->
          <div class="panel-main">
            <section
              v-for="section in sectionsByType"
              :key="section.type"
              class="ts-section"
            >
              <header class="ts-section-header">
                <div class="ts-section-title">{{ section.label }}</div>
                <div class="ts-section-total">
                  {{ totals.currency }}
                  {{ Math.round(section.total).toLocaleString('en-IN') }}
                </div>
              </header>

              <ul class="ts-list">
                <li
                  v-for="item in section.items"
                  :key="item.id"
                  class="ts-row"
                >
                  <div class="ts-row-main">
                    <div class="ts-row-label">{{ item.label }}</div>
                    <div class="ts-row-meta">
                      <span v-if="item.meta?.islandId">
                        {{ islandLabels[item.meta.islandId] || item.meta.islandId }}
                      </span>
                      <span v-if="item.meta?.dayLabel || item.meta?.dateLabel">
                        •
                        {{ item.meta.dayLabel || item.meta.dateLabel }}
                      </span>
                    </div>
                  </div>
                  <div class="ts-row-right">
                    <span class="ts-row-price">
                      {{ item.quantity }} ×
                      {{ totals.currency }}
                      {{ Math.round(item.unitPrice).toLocaleString('en-IN') }}
                    </span>
                    <span class="ts-row-line">
                      {{ totals.currency }}
                      {{
                        Math.round(item.unitPrice * item.quantity).toLocaleString('en-IN')
                      }}
                    </span>
                    <button
                      class="ts-remove"
                      type="button"
                      @click.stop="remove(item.id)"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              </ul>
            </section>
          </div>

          <!-- Right: sticky mini-panels -->
          <aside class="panel-side">
            <!-- Sticky day-by-day, especially when hotels exist -->
            <div class="sticky-card" v-if="byDay.length">
              <div class="card-title">
                Day-by-day spend
                <span v-if="hasHotel" class="badge">Hotels ready</span>
              </div>
              <ul class="mini-list">
                <li v-for="d in byDay" :key="d.key" class="mini-row">
                  <span>{{ d.label }}</span>
                  <span>
                    {{ totals.currency }}
                    {{ Math.round(d.total).toLocaleString('en-IN') }}
                  </span>
                </li>
              </ul>
            </div>

            <!-- Island-wise grouping -->
            <div class="sticky-card" v-if="byIsland.length">
              <div class="card-title">By island</div>
              <ul class="mini-list">
                <li v-for="i in byIsland" :key="i.islandId" class="mini-row">
                  <span>{{ i.label }}</span>
                  <span>
                    {{ totals.currency }}
                    {{ Math.round(i.total).toLocaleString('en-IN') }}
                  </span>
                </li>
              </ul>
            </div>

            <!-- Smart suggestions -->
            <div class="sticky-card" v-if="suggestions.length">
              <div class="card-title">Smart suggestions</div>
              <ul class="suggest-list">
                <li v-for="(s, idx) in suggestions" :key="idx">
                  {{ s }}
                </li>
              </ul>
            </div>
          </aside>
        </div>

        <!-- Grand total footer inside panel -->
        <footer class="panel-footer">
          <div class="pf-left">
            <div class="pf-label">Grand total</div>
            <div class="pf-value">
              {{ totals.currency }} {{ Math.round(totals.grandTotal).toLocaleString('en-IN') }}
            </div>
          </div>
          <div class="pf-right">
            <div class="pf-line">
              Subtotal:
              {{ totals.currency }} {{ Math.round(totals.subTotal).toLocaleString('en-IN') }}
            </div>
            <div class="pf-line">
              Tax:
              {{ totals.currency }} {{ Math.round(totals.tax).toLocaleString('en-IN') }}
            </div>
            <div class="pf-line">
              Service fee:
              {{ totals.currency }} {{ Math.round(totals.serviceFee).toLocaleString('en-IN') }}
            </div>
          </div>
        </footer>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.trip-summary-root {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Floating collapsed bar */
.trip-summary-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 10px 35px rgba(15, 23, 42, 0.14);
  cursor: pointer;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.ts-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ts-title {
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #0f172a;
}

.ts-subtitle {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  font-size: 9px;
}

.ts-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.ts-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
}

.ts-chip {
  font-size: 11px;
  padding: 3px 6px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #0f172a;
}

.ts-toggle-btn {
  border: none;
  outline: none;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  background: #0f172a;
  color: #f9fafb;
  cursor: pointer;
}

/* Slide-down panel */
.trip-summary-panel {
  margin-top: 4px;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22);
  border: 1px solid rgba(148, 163, 184, 0.25);
  padding: 14px 16px 10px;
}

.panel-grid {
  display: grid;
  grid-template-columns: minmax(0, 2.1fr) minmax(0, 1.2fr);
  gap: 18px;
}

.panel-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ts-section {
  border-bottom: 1px dashed #e2e8f0;
  padding-bottom: 8px;
}

.ts-section:last-child {
  border-bottom: none;
}

.ts-section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
}

.ts-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.ts-section-total {
  font-size: 12px;
  font-weight: 500;
  color: #0f172a;
}

.ts-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ts-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 4px 0;
  gap: 8px;
}

.ts-row-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ts-row-label {
  font-size: 12px;
  font-weight: 500;
  color: #0f172a;
}

.ts-row-meta {
  font-size: 11px;
  color: #64748b;
}

.ts-row-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: 130px;
}

.ts-row-price {
  font-size: 11px;
  color: #64748b;
}

.ts-row-line {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}

.ts-remove {
  border: none;
  background: transparent;
  font-size: 11px;
  color: #ef4444;
  cursor: pointer;
}

/* Side sticky cards */
.panel-side {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sticky-card {
  position: sticky;
  top: 8px;
  padding: 10px 10px 8px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.card-title {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
}

.mini-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.mini-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #0f172a;
  padding: 2px 0;
}

.suggest-list {
  list-style: disc;
  padding-left: 18px;
  margin: 0;
}

.suggest-list li {
  font-size: 11px;
  color: #334155;
  margin-bottom: 4px;
}

/* Footer */
.panel-footer {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pf-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pf-label {
  font-size: 11px;
  color: #64748b;
}

.pf-value {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.pf-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 11px;
  color: #64748b;
}

/* Animation */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.22s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Responsive: stack on narrow screens */
@media (max-width: 900px) {
  .panel-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .panel-side {
    flex-direction: row;
    overflow-x: auto;
  }
  .sticky-card {
    position: static;
    min-width: 200px;
  }
}
</style>
