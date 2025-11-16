<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCart } from '@/stores/useCart'

interface OperatorFare { operator: string; sampleFareINR?: number | null }
interface FerryRoute {
  id: string; from: string; to: string;
  originId: string; destinationId: string;
  typicalDurationMin?: number | null;
  operators: OperatorFare[];
}

const routes = ref<FerryRoute[]>([])
const fromFilter = ref('')
const toFilter = ref('')
const pax = ref(2)

onMounted(async () => {
  routes.value = await fetch('/data/ferries.json').then(r=>r.json())
})

const filtered = computed(() => {
  return routes.value.filter(r =>
    (!fromFilter.value || r.from.toLowerCase().includes(fromFilter.value.toLowerCase())) &&
    (!toFilter.value || r.to.toLowerCase().includes(toFilter.value.toLowerCase()))
  ).slice(0, 20)
})

const cart = useCart()
function add(route: FerryRoute, op: OperatorFare) {
  const unit = Math.round(op.sampleFareINR || 0)
  cart.addOrUpdate({
    id: `ferry:${route.id}:${op.operator}`,
    label: `Ferry ${route.from} → ${route.to} (${op.operator})`,
    quantity: pax.value,
    unitPrice: unit
  })
}
</script>

<template>
  <h2>Ferries</h2>
  <div style="display:flex;gap:8px;margin-bottom:8px;">
    <input v-model="fromFilter" placeholder="From (e.g., Port Blair)" />
    <input v-model="toFilter" placeholder="To (e.g., Havelock)" />
    <input v-model.number="pax" type="number" min="1" style="width:80px" />
  </div>
  <div v-for="r in filtered" :key="r.id" style="border-bottom:1px solid #eee;padding:8px 0;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div><strong>{{ r.from }}</strong> → <strong>{{ r.to }}</strong> <small v-if="r.typicalDurationMin">({{ r.typicalDurationMin }} min)</small></div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;">
      <button v-for="op in r.operators" :key="op.operator" @click="add(r, op)" :disabled="!op.sampleFareINR">
        {{ op.operator }} — ₹ {{ op.sampleFareINR ? Math.round(op.sampleFareINR) : 'n/a' }}
      </button>
    </div>
  </div>
</template>
