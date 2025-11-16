<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCart } from '@/stores/useCart'

interface Activity {
  id: string; name: string; category: string;
  basePriceINR?: number | null; operatedIn?: string[]; unit?: string;
}

const list = ref<Activity[]>([])
const q = ref('')

onMounted(async () => {
  list.value = await fetch('/data/activities.json').then(r=>r.json())
})

const filtered = computed(() => {
  return list.value.filter(a =>
    !q.value || a.name.toLowerCase().includes(q.value.toLowerCase())
  ).slice(0, 20)
})

const cart = useCart()
function add(a: Activity) {
  cart.addOrUpdate({
    id: `act:${a.id}`,
    label: `Activity: ${a.name}`,
    quantity: 1,
    unitPrice: Math.round(a.basePriceINR || 0)
  })
}
</script>

<template>
  <h2>Activities</h2>
  <input v-model="q" placeholder="Search activity…" />
  <div v-for="a in filtered" :key="a.id" style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px dashed #eee;">
    <div>
      <strong>{{ a.name }}</strong> <small>({{ a.category }})</small>
    </div>
    <div>
      <strong>₹ {{ Math.round(a.basePriceINR || 0) }}</strong>
      <button @click="add(a)" style="margin-left:8px;">Add</button>
    </div>
  </div>
</template>
