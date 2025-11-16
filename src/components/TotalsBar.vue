<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCart, type CartItem } from '@/stores/useCart'

const cart = useCart()
const { totals, items } = storeToRefs(cart)

const showSummary = ref(false)

type SectionKey =
  | 'activities'
  | 'cabs'
  | 'ferries'
  | 'scooters'
  | 'bicycles'
  | 'other'

const sectionLabels: Record<SectionKey, string> = {
  activities: 'Activities & Experiences',
  cabs: 'Cabs (Point-to-Point Transfers)',
  ferries: 'Ferries (Inter-Island)',
  scooters: 'Scooter Rental',
  bicycles: 'Bicycle Rental',
  other: 'Other Items'
}

// Decide which bucket an item belongs to
function classifyItem(item: CartItem): SectionKey {
  const t = (item.meta?.type as string | undefined)?.toLowerCase()

  if (t === 'activity') return 'activities'
  if (t === 'cab') return 'cabs'
  if (t === 'ferry') return 'ferries'
  if (t === 'scooter') return 'scooters'
  if (t === 'bicycle') return 'bicycles'

  // Fallback by ID prefix for older components with no meta.type
  if (item.id.startsWith('act:')) return 'activities'
  if (item.id.startsWith('cab:')) return 'cabs'
  if (item.id.startsWith('ferry:')) return 'ferries'
  if (item.id.startsWith('scooter:')) return 'scooters'
  if (item.id.startsWith('bicycle:')) return 'bicycles'

  return 'other'
}

const grouped = computed(() => {
  const base: Record<SectionKey, CartItem[]> = {
    activities: [],
    cabs: [],
    ferries: [],
    scooters: [],
    bicycles: [],
    other: []
  }

  items.value.forEach((item) => {
    const key = classifyItem(item)
    base[key].push(item)
  })

  return base
})

// Helper for line total
function lineTotal(item: CartItem): number {
  return (item.unitPrice || 0) * (item.quantity || 0)
}
</script>

<template>
  <!-- Top totals bar -->
  <div
    style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;padding:12px 16px;border:1px solid #ddd;border-radius:10px;background:#fafafa;margin-bottom:8px;"
  >
    <div><strong>Sub:</strong> {{ totals.currency }} {{ Math.round(totals.subTotal) }}</div>
    <div><strong>Tax:</strong> {{ totals.currency }} {{ Math.round(totals.tax) }}</div>
    <div><strong>Fee:</strong> {{ totals.currency }} {{ Math.round(totals.serviceFee) }}</div>
    <div style="font-size:18px;">
      <strong>Total:</strong> {{ totals.currency }} {{ Math.round(totals.grandTotal) }}
    </div>

    <button
      type="button"
      @click="showSummary = !showSummary"
      style="margin-left:auto;padding:4px 10px;border-radius:6px;border:1px solid #ccc;background:white;cursor:pointer;"
    >
      {{ showSummary ? 'Hide Trip Summary' : 'Show Trip Summary' }}
    </button>
  </div>

  <!-- Collapsible trip summary -->
  <div
    v-if="showSummary"
    style="border:1px solid #e0e0e0;border-radius:10px;padding:12px 16px;background:#fff;"
  >
    <h3 style="margin-top:0;margin-bottom:8px;font-size:14px;">Trip Summary (Cost Breakdown)</h3>

    <div style="font-size:12px;color:#666;margin-bottom:8px;">
      Activities, cabs, ferries, scooters, and bicycles are shown in separate sections for clarity.
    </div>

    <div v-for="(list, key) in grouped" :key="key" v-if="list.length">
      <h4 style="margin:10px 0 4px;font-size:13px;text-transform:uppercase;">
        {{ sectionLabels[key as SectionKey] }}
      </h4>

      <ul style="list-style:none;padding:0;margin:0 0 6px;">
        <li
          v-for="item in list"
          :key="item.id"
          style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;border-bottom:1px dashed #eee;font-size:13px;"
        >
          <div style="max-width:65%;">
            <div>{{ item.label }}</div>
            <small style="color:#777;">
              Qty {{ item.quantity }} × {{ totals.currency }} {{ Math.round(item.unitPrice) }}
            </small>
          </div>
          <div style="text-align:right;min-width:80px;">
            {{ totals.currency }} {{ Math.round(lineTotal(item)) }}
          </div>
        </li>
      </ul>
    </div>

    <div
      v-if="!items.length"
      style="font-size:13px;color:#888;margin-top:4px;"
    >
      No items added yet. Start by choosing activities, transfers, or rentals.
    </div>
  </div>
</template>
