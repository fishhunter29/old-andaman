<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCart } from '@/stores/useCart'

interface CabRow {
  id: string
  islandId: string
  island?: string
  fromZone: string
  toZone: string
  tripType: string
  vehicleClass: string
  serviceClass: string
  dayFareINR?: number | null
  nightFareINR?: number | null
  includedWaitMin?: number | null
}

const rows = ref<CabRow[]>([])
const fromFilter = ref('')
const toFilter = ref('')

onMounted(async () => {
  rows.value = await fetch('/data/cabs.json').then(r => r.json())
})

const filtered = computed(() => {
  const from = fromFilter.value.toLowerCase()
  const to   = toFilter.value.toLowerCase()

  return rows.value
    .filter(r =>
      (!from || r.fromZone.toLowerCase().includes(from)) &&
      (!to   || r.toZone.toLowerCase().includes(to))
    )
    .slice(0, 20)
})

const cart = useCart()

function getPrice(row: CabRow): number {
  const p = row.dayFareINR ?? row.nightFareINR ?? 0
  return Math.max(0, Math.round(p))
}

function add(row: CabRow) {
  const price = getPrice(row)
  if (!price) return  // no free/undefined transfers, we can later show a warning if you want

  cart.addOrUpdate({
    id: `cab:${row.id}`,
    label: `Cab ${row.fromZone} → ${row.toZone} (${row.vehicleClass})`,
    quantity: 1,
    unitPrice: price,
    meta: {
      type: 'cab',
      islandId: row.islandId,
      island: row.island,
      tripType: row.tripType,
      vehicleClass: row.vehicleClass,
      serviceClass: row.serviceClass,
      includedWaitMin: row.includedWaitMin ?? 0
    }
  })
}
</script>

<template>
  <h2>Cabs (Point-to-Point)</h2>

  <div style="display:flex;gap:8px;margin-bottom:8px;">
    <input v-model="fromFilter" placeholder="Filter from zone" />
    <input v-model="toFilter" placeholder="Filter to zone" />
  </div>

  <div
    v-for="r in filtered"
    :key="r.id"
    style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee;"
  >
    <div>
      <div>
        <strong>{{ r.fromZone }}</strong> → <strong>{{ r.toZone }}</strong>
        • {{ r.vehicleClass }}
      </div>
      <small>
        Trip: {{ r.tripType }}
        | Included wait: {{ r.includedWaitMin || 0 }} min
      </small>
    </div>
    <div>
      <strong>₹ {{ getPrice(r) }}</strong>
      <button @click="add(r)" style="margin-left:8px;">Add</button>
    </div>
  </div>
</template>
