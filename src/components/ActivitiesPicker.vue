<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCart } from '@/stores/useCart'

interface Adventure {
  id: string
  name: string
  category: string
  basePriceINR: number | null
  operatedIn?: string[]
  unit?: string
}

const list = ref<Adventure[]>([])
const q = ref('')

onMounted(async () => {
  // use the new file
  list.value = await fetch('/data/adventures.json').then(r => r.json())
})

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  return list.value
    .filter(a => !term || a.name.toLowerCase().includes(term))
    .slice(0, 20)
})

const cart = useCart()

function add(a: Adventure) {
  const price = Math.round(a.basePriceINR ?? 0)

  cart.addOrUpdate({
    id: `act:${a.id}`,
    label: `Activity: ${a.name}`,
    quantity: 1,
    unitPrice: price,
    meta: {
      category: a.category,
      unit: a.unit ?? 'per_person'
    }
  })
}
</script>

<template>
  <h2>Activities / Adventures</h2>

  <input
    v-model="q"
    placeholder="Search activity…"
    style="width:100%;padding:6px 8px;margin-bottom:8px;"
  />

  <div
    v-for="a in filtered"
    :key="a.id"
    style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px dashed #eee;"
  >
    <div>
      <strong>{{ a.name }}</strong>
      <small> ({{ a.category }})</small>
    </div>
    <div>
      <strong>₹ {{ Math.round(a.basePriceINR ?? 0) }}</strong>
      <button @click="add(a)" style="margin-left:8px;">
        Add
      </button>
    </div>
  </div>
</template>
