<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCart } from '@/stores/useCart'

interface CabRow {
  id: string
  islandId: string
  fromZone: string
  toZone: string
  tripType: string
  vehicleClass: string
  serviceClass: string
  dayFareINR?: number
  nightFareINR?: number
  includedWaitMin?: number
}

const rows = ref<CabRow[]>([])
const fromFilter = ref('')
const toFilter = ref('')

onMounted(async () => {
  rows.value = await fetch('/data/cabs.json').then(r=>r.json())
})

const filtered = computed(() => {
  return rows.value.filter(r =>
    (!fromFilter.value || r.fromZone.toLowerCase().includes(fromFilter.value.toLowerCase())) &&
    (!toFilter.value || r.toZone.toLowerCase().includes(toFilter.value.toLowerCase()))
  ).slice(0, 20)
})

const cart = useCart()
function add(row: CabRow) {
  const price = row.dayFareINR ?? row.nightFareINR ?? 0
  cart.addOrUpdate({
    id: `cab:${row.id}`,
    label: `Cab ${row.fromZone} → ${row.toZone} (${row.vehicleClass})`,
    quantity: 1,
    unitPrice: Math.round(price)
  })
}
</script>

<template>
  <h2>Cabs (Point-to-Point)</h2>
  <div style="display:flex;gap:8px;margin-bottom:8px;">
    <input v-model="fromFilter" placeholder="Filter from zone" />
    <input v-model="toFilter" placeholder="Filter to zone" />
  </div>
  <div v-for="r in filtered" :key="r.id" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee;">
    <div>
      <div><strong>{{ r.fromZone }}</strong> → <strong>{{ r.toZone }}</strong> • {{ r.vehicleClass }}</div>
      <small>Trip: {{ r.tripType }} | Included wait: {{ r.includedWaitMin || 0 }} min</small>
    </div>
    <div>
      <strong>₹ {{ Math.round(r.dayFareINR ?? r.nightFareINR ?? 0) }}</strong>
      <button @click="add(r)" style="margin-left:8px;">Add</button>
    </div>
  </div>
</template>
