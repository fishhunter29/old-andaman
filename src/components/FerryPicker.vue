<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCart } from '@/stores/useCart'

interface OperatorFare {
  operator: string
  sampleFareINR?: number | null
}

interface FerryRoute {
  id: string
  from: string
  to: string
  originId: string
  destinationId: string
  typicalDurationMin?: number | null
  operators: OperatorFare[]
}

const routes = ref<FerryRoute[]>([])
const fromFilter = ref('')
const toFilter = ref('')
const pax = ref(2)

const cart = useCart()

onMounted(async () => {
  routes.value = await fetch('/data/ferries.json').then(r => r.json())
})

const filtered = computed(() => {
  return routes.value
    .filter(r =>
      (!fromFilter.value || r.from.toLowerCase().includes(fromFilter.value.toLowerCase())) &&
      (!toFilter.value || r.to.toLowerCase().includes(toFilter.value.toLowerCase()))
    )
    .slice(0, 30)
})

function add(route: FerryRoute, op: OperatorFare) {
  const unit = Math.round(op.sampleFareINR || 0)

  cart.addOrUpdate({
    id: `ferry:${route.id}:${op.operator}`,
    label: `Ferry ${route.from} → ${route.to} (${op.operator})`,
    quantity: pax.value,
    unitPrice: unit,
    meta: {
      type: 'ferry',
      originId: route.originId,
      destinationId: route.destinationId,
      operator: op.operator,
      typicalDurationMin: route.typicalDurationMin,
      pax: pax.value
    }
  })
}
</script>

<template>
  <section>
    <h2 style="margin-bottom:8px;">Ferries (Private + Govt)</h2>
    <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
      <input
        v-model="fromFilter"
        placeholder="From (e.g., Port Blair)"
        style="flex:1;min-width:160px;padding:6px 8px;border-radius:8px;border:1px solid #d1d5db;"
      />
      <input
        v-model="toFilter"
        placeholder="To (e.g., Havelock)"
        style="flex:1;min-width:160px;padding:6px 8px;border-radius:8px;border:1px solid #d1d5db;"
      />
      <input
        v-model.number="pax"
        type="number"
        min="1"
        style="width:80px;padding:6px 8px;border-radius:8px;border:1px solid #d1d5db;"
      />
    </div>

    <div
      v-for="r in filtered"
      :key="r.id"
      style="border-bottom:1px solid #eee;padding:8px 0;"
    >
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:13px;font-weight:600;">
          {{ r.from }} → {{ r.to }}
          <small v-if="r.typicalDurationMin" style="color:#6b7280;font-weight:400;">
            ({{ r.typicalDurationMin }} min)
          </small>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;">
        <button
          v-for="op in r.operators"
          :key="op.operator"
          @click="add(r, op)"
          :disabled="!op.sampleFareINR"
          style="padding:4px 10px;border-radius:999px;border:1px solid #cbd5f5;background:white;font-size:11px;cursor:pointer;opacity:var(--opac);"
          :style="{ opacity: op.sampleFareINR ? 1 : 0.5 }"
        >
          {{ op.operator }} — ₹ {{ op.sampleFareINR ? Math.round(op.sampleFareINR) : 'n/a' }}
        </button>
      </div>
    </div>
  </section>
</template>
