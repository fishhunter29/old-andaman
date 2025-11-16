<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCart } from '@/stores/useCart'
const { totals } = storeToRefs(useCart())
</script>

<template>
  <div style="display:flex;gap:16px;align-items:center;justify-content:space-between;padding:12px 16px;border:1px solid #ddd;border-radius:10px;background:#fafafa;">
    <div><strong>Sub:</strong> {{ totals.currency }} {{ Math.round(totals.subTotal) }}</div>
    <div><strong>Tax:</strong> {{ totals.currency }} {{ Math.round(totals.tax) }}</div>
    <div><strong>Fee:</strong> {{ totals.currency }} {{ Math.round(totals.serviceFee) }}</div>
    <div style="font-size:18px;"><strong>Total:</strong> {{ totals.currency }} {{ Math.round(totals.grandTotal) }}</div>
  </div>
</template>
