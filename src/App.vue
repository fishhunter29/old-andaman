<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDataPack } from '@/composables/useDataPack'
import { useCart } from '@/stores/useCart'
import TotalsBar from '@/components/TotalsBar.vue'
import CabPicker from '@/components/CabPicker.vue'
import FerryPicker from '@/components/FerryPicker.vue'
import ActivitiesPicker from '@/components/ActivitiesPicker.vue'

const { load, isLoading } = useDataPack()
const cart = useCart()
const data = ref<any>(null)

onMounted(async () => {
  data.value = await load()
  const { currency = 'INR', taxPercent = 0, serviceFee = 0 } = data.value.meta || {}
  cart.setMeta(currency, taxPercent, serviceFee)
})
</script>

<template>
  <main style="max-width:960px;margin:24px auto;padding:16px;">
    <h1>Andaman Planner</h1>
    <TotalsBar />

    <section v-if="isLoading">Loading data…</section>
    <section v-else>
      <CabPicker />
      <FerryPicker />
      <ActivitiesPicker />
    </section>
  </main>
</template>

<style>
body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
section { margin: 16px 0; padding: 12px; border: 1px solid #eee; border-radius: 8px; }
h2 { margin: 0 0 8px; }
</style>
