<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCart } from '@/stores/useCart'

interface ScooterRow {
  islandId: string
  island: string
  model: string
  plan: 'HALF_DAY' | 'DAY' | string
  durationHours: number
  baseRateINR: number
  securityDepositINR: number
  isAvailable: boolean
  lateFeePerHourINR: number
  peakSeasonMarkupPct: number
}

const rows = ref<ScooterRow[]>([])
const islandFilter = ref('')
const planFilter = ref<'ALL' | 'HALF_DAY' | 'DAY'>('ALL')
const days = ref(1) // how many days user wants the scooter

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
  rows.value = await fetch('/data/scooters.json').then(r => r.json())
})

const filtered = computed(() => {
  return rows.value
    .filter(r => {
      if (!r.isAvailable) return false
      if (islandFilter.value && r.islandId !== islandFilter.value) return false
      if (planFilter.value !== 'ALL' && r.plan !== planFilter.value) return false
      return true
    })
    .slice(0, 50)
})

function add(row: ScooterRow) {
  // quantity = number of rental days
  const qty = Math.max(1, days.value || 1)
  const unitPrice = Math.round(row.baseRateINR)

  cart.addOrUpdate({
    id: `scooter:${row.islandId}:${row.model}:${row.plan}`,
    label: `Scooter – ${row.model} (${row.plan === 'DAY' ? 'Full day' : 'Half day'}) – ${row.island}`,
    quantity: qty,
    unitPrice,
    meta: {
      type: 'scooter',
      islandId: row.islandId,
      island: row.island,
      model: row.model,
      plan: row.plan,
      durationHours: row.durationHours,
      securityDepositINR: row.securityDepositINR,
      lateFeePerHourINR: row.lateFeePerHourINR,
      peakSeasonMarkupPct: row.peakSeasonMarkupPct,
      rentalDays: qty
    }
  })
}
</script>

<template>
  <section>
    <h2 style="margin-bottom:8px;">Scooter Rental</h2>

    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
      <select
        v-model="islandFilter"
        style="padding:6px 8px;border-radius:8px;border:1px solid #d1d5db;min-width:180px;"
      >
        <option v-for="opt in ISLANDS" :key="opt.id" :value="opt.id">
          {{ opt.label || 'All islands' }}
        </option>
      </select>

      <select
        v-model="planFilter"
        style="padding:6px 8px;border-radius:8px;border:1px solid #d1d5db;min-width:140px;"
      >
        <option value="ALL">All plans</option>
        <option value="HALF_DAY">Half-day</option>
        <option value="DAY">Full day</option>
      </select>

      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:12px;color:#6b7280;">Days:</span>
        <input
          v-model.number="days"
          type="number"
          min="1"
          style="width:70px;padding:6px 8px;border-radius:8px;border:1px solid #d1d5db;"
        />
      </div>
    </div>

    <div
      v-for="r in filtered"
      :key="`${r.islandId}-${r.model}-${r.plan}`"
      style="display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid #e5e7eb;gap:8px;"
    >
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;">
          {{ r.model }} • {{ r.island }}
        </div>
        <div style="font-size:11px;color:#6b7280;margin-top:2px;">
          Plan: {{ r.plan === 'DAY' ? 'Full day (24h)' : 'Half day (6h)' }}
        </div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px;">
          Security deposit: ₹ {{ r.securityDepositINR.toLocaleString('en-IN') }}
          • Late fee: ₹ {{ r.lateFeePerHourINR }}/hour
        </div>
      </div>

      <div style="text-align:right;min-width:130px;">
        <div style="font-weight:600;font-size:13px;">
          ₹ {{ Math.round(r.baseRateINR).toLocaleString('en-IN') }} / day
        </div>
        <div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">
          Est. {{ days || 1 }} day(s) total:
          ₹ {{ (Math.round(r.baseRateINR) * (days || 1)).toLocaleString('en-IN') }}
        </div>
        <button
          @click="add(r)"
          style="padding:4px 10px;border-radius:999px;border:none;background:#047857;color:#fff;font-size:11px;cursor:pointer;"
        >
          Add scooter
        </button>
      </div>
    </div>
  </section>
</template>
