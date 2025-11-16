<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCart } from '@/stores/useCart'

type AdventureCategory =
  | 'trek'
  | 'adrenaline'
  | 'adventure'
  | 'water'
  | 'dive'
  | 'nature'
  | 'sport'
  | 'family'
  | 'cultural'
  | 'leisure'
  | 'ground'
  | 'boat'
  | 'wildlife'
  | 'cruise'

type PricingUnit =
  | 'per_person'
  | 'per_group'
  | 'per_boat'
  | 'per_kayak'
  | 'per_vehicle'
  | 'per_kart'

interface Adventure {
  id: string
  name: string
  slug: string
  category: AdventureCategory
  description: string
  durationMin: number | null
  ageMin: number | null
  operatedIn: string[]        // 'PB', 'HL', 'NL', 'DG', 'LI', 'RG', 'LA', 'MY', 'BT', 'RX'
  unit: PricingUnit | string
  basePriceINR: number | null
  bookingType: string
  apiSource: string
  gearIncluded: string[]
  safetyNotes: string
  season: string
  difficulty: string
}

const list = ref<Adventure[]>([])
const q = ref('')
const islandFilter = ref<string>('')
const categoryFilter = ref<string>('')

const ISLANDS = [
  { id: '',   label: 'All islands' },
  { id: 'PB', label: 'Port Blair (South Andaman)' },
  { id: 'HL', label: 'Havelock (Swaraj Dweep)' },
  { id: 'NL', label: 'Neil (Shaheed Dweep)' },
  { id: 'DG', label: 'Diglipur (North Andaman)' },
  { id: 'LI', label: 'Long Island (Middle Andaman)' },
  { id: 'RG', label: 'Rangat (Middle Andaman)' },
  { id: 'MB', label: 'Mayabunder (Middle Andaman)' },
  { id: 'LA', label: 'Little Andaman (Hut Bay)' },
  { id: 'BT', label: 'Baratang (under Port Blair)' },
  { id: 'RX', label: 'Remote / Expeditions' }
]

const CATEGORY_LABELS: Record<string, string> = {
  trek: 'Treks / Hikes',
  adrenaline: 'Adrenaline',
  adventure: 'Adventure',
  water: 'Water Activities',
  dive: 'Diving',
  nature: 'Nature / Trails',
  sport: 'Sports',
  family: 'Family',
  cultural: 'Cultural',
  leisure: 'Leisure',
  ground: 'Ground Activities',
  boat: 'Boat Trips',
  wildlife: 'Wildlife',
  cruise: 'Cruises'
}

const cart = useCart()

onMounted(async () => {
  // IMPORTANT: this now uses adventures.json
  list.value = await fetch('/data/adventures.json').then(r => r.json())
})

const filtered = computed(() => {
  const qText = q.value.trim().toLowerCase()
  const island = islandFilter.value
  const cat = categoryFilter.value as AdventureCategory | ''

  return list.value
    .filter(a => {
      if (qText && !a.name.toLowerCase().includes(qText) && !a.description.toLowerCase().includes(qText)) {
        return false
      }
      if (island && !(a.operatedIn || []).includes(island)) {
        return false
      }
      if (cat && a.category !== cat) {
        return false
      }
      return true
    })
    .slice(0, 30)
})

function formatUnit(unit: string | undefined) {
  if (!unit) return ''
  switch (unit) {
    case 'per_person': return 'per person'
    case 'per_group': return 'per group'
    case 'per_boat': return 'per boat'
    case 'per_kayak': return 'per kayak'
    case 'per_vehicle': return 'per vehicle'
    case 'per_kart': return 'per kart'
    default: return unit.replace(/_/g, ' ')
  }
}

function add(a: Adventure) {
  const unitPrice = Math.round(a.basePriceINR || 0)

  // Choose an island for meta: prefer user-selected filter if valid, otherwise first operatedIn
  let islandId: string | undefined
  if (islandFilter.value && a.operatedIn?.includes(islandFilter.value)) {
    islandId = islandFilter.value
  } else if (a.operatedIn && a.operatedIn.length > 0) {
    islandId = a.operatedIn[0]
  }

  cart.addOrUpdate({
    id: `act:${a.id}`,
    label: `Activity: ${a.name}`,
    quantity: 1,
    unitPrice,
    meta: {
      type: 'activity',
      islandId,
      category: a.category,
      unit: a.unit,
      durationMin: a.durationMin,
      operatedIn: a.operatedIn
    }
  })
}
</script>

<template>
  <section>
    <h2 style="margin-bottom:8px;">Activities & Adventures</h2>

    <!-- Filters row -->
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
      <input
        v-model="q"
        placeholder="Search activity (e.g., scuba, kayak, trek)…"
        style="flex:1;min-width:180px;padding:6px 8px;border-radius:8px;border:1px solid #d1d5db;"
      />

      <select
        v-model="islandFilter"
        style="padding:6px 8px;border-radius:8px;border:1px solid #d1d5db;min-width:180px;"
      >
        <option v-for="opt in ISLANDS" :key="opt.id" :value="opt.id">
          {{ opt.label }}
        </option>
      </select>

      <select
        v-model="categoryFilter"
        style="padding:6px 8px;border-radius:8px;border:1px solid #d1d5db;min-width:160px;"
      >
        <option value="">All categories</option>
        <option
          v-for="(label, key) in CATEGORY_LABELS"
          :key="key"
          :value="key"
        >
          {{ label }}
        </option>
      </select>
    </div>

    <!-- List -->
    <div
      v-for="a in filtered"
      :key="a.id"
      style="display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px dashed #e5e7eb;gap:8px;"
    >
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:13px;">
          {{ a.name }}
        </div>
        <div style="font-size:11px;color:#64748b;margin:2px 0 4px;">
          {{ CATEGORY_LABELS[a.category] || a.category }}
          <span v-if="a.durationMin">• ~{{ a.durationMin }} min</span>
          <span v-if="a.season">• Best: {{ a.season }}</span>
        </div>
        <div style="font-size:11px;color:#6b7280;max-width:480px;">
          {{ a.description }}
        </div>
        <div v-if="a.operatedIn?.length" style="font-size:11px;color:#94a3b8;margin-top:3px;">
          Operates in: {{ a.operatedIn.join(', ') }}
        </div>
      </div>

      <div style="text-align:right;min-width:130px;">
        <div style="font-weight:600;font-size:13px;">
          ₹ {{ Math.round(a.basePriceINR || 0).toLocaleString('en-IN') }}
        </div>
        <div style="font-size:11px;color:#6b7280;margin-bottom:4px;">
          {{ formatUnit(a.unit) }}
        </div>
        <button
          @click="add(a)"
          style="padding:4px 10px;border-radius:999px;border:none;background:#0f172a;color:white;font-size:11px;cursor:pointer;"
        >
          Add to trip
        </button>
      </div>
    </div>
  </section>
</template>
