<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCart } from '@/stores/useCart'

interface CabRow {
  id: string
  islandId: string
  islandName?: string
  fromZone: string
  toZone: string
  tripType: string        // e.g. ONE_WAY / ROUND_TRIP
  vehicleClass: string    // e.g. HATCHBACK / SEDAN / SUV
  serviceClass: string    // e.g. STANDARD / PREMIUM
  dayFareINR?: number
  nightFareINR?: number
  includedWaitMin?: number
}

const rows = ref<CabRow[]>([])
const fromFilter = ref('')
const toFilter = ref('')
const islandFilter = ref('')

const cart = useCart()

const ISLANDS = [
  { id: '',   label: 'All islands' },
  { id: 'PB', label: 'Port Blair (South Andaman)' },
  { id: 'HL', label: 'Havelock (Swaraj Dweep)' },
  { id: 'NL', label: 'Neil (Shaheed Dweep)' },
  { id: 'RG', label: 'Rangat (Middle Andaman)' },
  { id: 'MB', label: 'Mayabunder (Middle Andaman)' },
  { id: 'DG', label: 'Diglipur (North Andaman)' },
  { id: 'LA', label: 'Little Andaman (Hut Bay)' }
]

onMounted(async () => {
  rows.value = await fetch('/data/cabs.json').then(r => r.json())
})

const filtered = computed(() => {
  return rows.value
    .filter(r => {
      if (islandFilter.value && r.islandId !== islandFilter.value) return false
      if (fromFilter.value && !r.fromZone.toLowerCase().includes(fromFilter.value.toLowerCase())) return false
      if (toFilter.value && !r.toZone.toLowerCase().includes(toFilter.value.toLowerCase())) return false
      return true
    })
    .slice(0, 30)
})

function add(row: CabRow) {
  const price = row.dayFareINR ?? row.nightFareINR ?? 0

  cart.addOrUpdate({
    id: `cab:${row.id}`,
    label: `Cab ${row.fromZone} → ${row.toZone} (${row.vehicleClass})`,
    quantity: 1,
    unitPrice: Math.round(price),
    meta: {
      type: 'cab',
      islandId: row.islandId,
      islandName: row.islandName,
      tripType: row.tripType,
      vehicleClass: row.vehicleClass,
      serviceClass: row.serviceClass,
      includedWaitMin: row.includedWaitMin
    }
  })
}
</script>

<template>
  <section>
    <h2 style="margin-bottom:8px;">Cabs – Point-to-Point Transfers</h2>

    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
      <select
        v-model="islandFilter"
        style="padding:6px 8px;border-radius:8px;border:1px solid #d1d5db;min-width:180px;"
      >
        <option v-for="opt in ISLANDS" :key="opt.id" :value="opt.id">
          {{ opt.label }}
        </option>
      </select>

      <input
        v-model="fromFilter"
        placeholder="From area / hotel / jetty…"
        style="flex:1;min-width:160px;padding:6px 8px;border-radius:8px;border:1px solid #d1d5db;"
      />
      <input
        v-model="toFilter"
        placeholder="To area / beach / jetty…"
        style="flex:1;min-width:160px;padding:6px 8px;border-radius:8px;border:1px solid #d1d5db;"
      />
    </div>

    <div
      v-for="r in filtered"
      :key="r.id"
      style="display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid #e5e7eb;gap:8px;"
    >
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;">
          {{ r.fromZone }} → {{ r.toZone }}
        </div>
        <div style="font-size:11px;color:#6b7280;margin-top:2px;">
          {{ r.vehicleClass }} • {{ r.serviceClass }} • {{ r.tripType }}
        </div>
        <div v-if="r.includedWaitMin" style="font-size:11px;color:#9ca3af;margin-top:2px;">
          Included wait: {{ r.includedWaitMin }} min
        </div>
      </div>

      <div style="text-align:right;min-width:130px;">
        <div style="font-weight:600;font-size:13px;">
          ₹ {{ Math.round(r.dayFareINR ?? r.nightFareINR ?? 0).toLocaleString('en-IN') }}
        </div>
        <div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">
          {{ r.dayFareINR ? 'Day fare' : (r.nightFareINR ? 'Night fare' : '') }}
        </div>
        <button
          @click="add(r)"
          style="padding:4px 10px;border-radius:999px;border:none;background:#0f172a;color:#fff;font-size:11px;cursor:pointer;"
        >
          Add cab
        </button>
      </div>
    </div>
  </section>
</template>
