<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCart } from '@/stores/useCart'

interface BicycleRow {
  islandId: string
  island: string
  bikeType: string      // Hybrid / MTB / Cruiser…
  plan: 'HALF_DAY' | 'DAY' | 'MULTI_DAY' | string
  durationHours: number
  baseRateINR: number
  securityDepositINR: number
  isAvailable: boolean
  lateFeePerHourINR: number
  peakSeasonMarkupPct: number
}

const rows = ref<BicycleRow[]>([])
const islandFilter = ref('')
const planFilter = ref<'ALL' | 'HALF_DAY' | 'DAY' | 'MULTI_DAY'>('ALL')
const days = ref(1)

const cart = useCart()

const ISLANDS = [
  { id: '',   label: 'All islands' },
  { id: 'PB', label: 'Port Blair (South Andaman)' },
  { id: 'HL', label: 'Havelock (Swaraj Dweep)' },
  { id: 'NL', label: 'Neil (Shaheed Dweep)' }
]

onMounted(async () => {
  rows.value = await fetch('/data/bicycles.json').then(r => r.json())
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

function prettyPlan(plan: string) {
  if (plan === 'DAY') return 'Full day'
  if (plan === 'HALF_DAY') return 'Half day'
  if (plan === 'MULTI_DAY') return 'Multi-day'
  return plan
}

function add(row: BicycleRow) {
  const qty = Math.max(1, days.value || 1)
  const unitPrice = Math.round(row.baseRateINR)

  cart.addOrUpdate({
    id: `bicycle:${row.islandId}:${row.bikeType}:${row.plan}`,
    label: `Bicycle – ${row.bikeType} (${prettyPlan(row.plan)}) – ${row.island}`,
    quantity: qty,
    unitPrice,
    meta: {
      type: 'bicycle',
      islandId: row.islandId,
      island: row.island,
      bikeType: row.bikeType,
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
    <h2 style="margin-bottom:8px;">Bicycle Rental</h2>

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
        <option value="HALF_DAY">Half day</option>
        <option value="DAY">Full day</option>
        <option value="MULTI_DAY">Multi-day</option>
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
      :key="`${r.islandId}-${r.bikeType}-${r.plan}`"
      style="display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid #e5e7eb;gap:8px;"
    >
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;">
          {{ r.bikeType }} • {{ r.island }}
        </div>
        <div style="font-size:11px;color:#6b7280;margin-top:2px;">
          Plan: {{ prettyPlan(r.plan) }} (≈ {{ r.durationHours }}h)
        </div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px;">
          Security deposit: ₹ {{ r.securityDepositINR.toLocaleString('en-IN') }}
          • Late fee: ₹ {{ r.lateFeePerHourINR }}/hour
        </div>
      </div>

      <div style="text-align:right;min-width:140px;">
        <div style="font-weight:600;font-size:13px;">
          ₹ {{ Math.round(r.baseRateINR).toLocaleString('en-IN') }} / day
        </div>
        <div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">
          Est. {{ days || 1 }} day(s) total:
          ₹ {{ (Math.round(r.baseRateINR) * (days || 1)).toLocaleString('en-IN') }}
        </div>
        <button
          @click="add(r)"
          style="padding:4px 10px;border-radius:999px;border:none;background:#2563eb;color:#fff;font-size:11px;cursor:pointer;"
        >
          Add bicycle
        </button>
      </div>
    </div>
  </section>
</template>
