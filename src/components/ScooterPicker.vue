<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCart } from '@/stores/useCart'

interface ScooterRow {
  islandId: string
  island: string
  model: string
  plan: string              // 'HALF_DAY' | 'DAY' etc.
  durationHours: number
  baseRateINR: number
  securityDepositINR: number
  isAvailable: boolean
  lateFeePerHourINR: number
  peakSeasonMarkupPct: number
}

const rows = ref<ScooterRow[]>([])
const islandFilter = ref<string>('')
const planFilter = ref<string>('DAY')
const blocks = ref(1) // how many day/half-day blocks

onMounted(async () => {
  const data: ScooterRow[] = await fetch('/data/scooters.json').then(r => r.json())
  rows.value = data.filter(r => r.isAvailable !== false)

  // default island = first one
  if (!islandFilter.value && rows.value.length) {
    islandFilter.value = rows.value[0].islandId
  }
})

// unique island list for dropdown
const islands = computed(() => {
  const map = new Map<string, string>()
  rows.value.forEach(r => {
    if (!map.has(r.islandId)) map.set(r.islandId, r.island)
  })
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

const filtered = computed(() => {
  return rows.value.filter(r =>
    (!islandFilter.value || r.islandId === islandFilter.value) &&
    (!planFilter.value || r.plan === planFilter.value)
  )
})

const cart = useCart()

function add(row: ScooterRow) {
  const unit = Math.max(0, Math.round(row.baseRateINR))
  if (!unit || blocks.value <= 0) return

  const quantity = blocks.value

  cart.addOrUpdate({
    id: `scooter:${row.islandId}:${row.plan}`,
    label: `Scooter • ${row.island} • ${row.model} • ${row.plan.replace('_', ' ')}`,
    quantity,
    unitPrice: unit,
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
      blocks: quantity
    }
  })
}
</script>

<template>
  <h2>Scooter Rental</h2>

  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
    <select v-model="islandFilter">
      <option value="">All islands</option>
      <option v-for="i in islands" :key="i.id" :value="i.id">
        {{ i.name }}
      </option>
    </select>

    <select v-model="planFilter">
      <option value="">All plans</option>
      <option value="HALF_DAY">Half Day</option>
      <option value="DAY">Full Day</option>
    </select>

    <input
      v-model.number="blocks"
      type="number"
      min="1"
      style="width:90px"
      placeholder="Blocks"
    />
  </div>

  <div
    v-for="r in filtered"
    :key="`${r.islandId}-${r.plan}`"
    style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee;"
  >
    <div>
      <div><strong>{{ r.island }}</strong></div>
      <div>
        {{ r.model }} •
        <strong>{{ r.plan === 'DAY' ? 'Full Day' : r.plan === 'HALF_DAY' ? 'Half Day' : r.plan }}</strong>
      </div>
      <small>
        Duration: {{ r.durationHours }}h |
        Deposit: ₹ {{ r.securityDepositINR }} |
        Late fee: ₹ {{ r.lateFeePerHourINR }}/hr
      </small>
    </div>
    <div style="text-align:right;">
      <div><strong>₹ {{ Math.round(r.baseRateINR) }}</strong> / block</div>
      <button @click="add(r)" style="margin-top:4px;">Add</button>
    </div>
  </div>
</template>
