import { defineStore } from 'pinia'

type Currency = 'INR' | 'USD'
export interface CartItem {
  id: string
  label: string
  quantity: number
  unitPrice: number
  currency?: Currency
  meta?: Record<string, any>
}
interface Totals {
  subTotal: number
  tax: number
  serviceFee: number
  grandTotal: number
  currency: Currency
}

export const useCart = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    taxPercent: 0,
    serviceFee: 0,
    currency: 'INR' as Currency
  }),
  getters: {
    totals(state): Totals {
      const subTotal = state.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
      const tax = (subTotal * state.taxPercent) / 100
      const serviceFee = typeof state.serviceFee === 'number' ? state.serviceFee : 0
      const grandTotal = subTotal + tax + serviceFee
      return { subTotal, tax, serviceFee, grandTotal, currency: state.currency }
    }
  },
  actions: {
    setMeta(currency: Currency, taxPercent = 0, serviceFee = 0) {
      this.currency = currency
      this.taxPercent = taxPercent
      this.serviceFee = serviceFee
    },
    addOrUpdate(item: CartItem) {
      const idx = this.items.findIndex(x => x.id === item.id)
      if (idx >= 0) this.items[idx] = item
      else this.items.push(item)
    },
    remove(id: string) {
      this.items = this.items.filter(i => i.id !== id)
    },
    clear() {
      this.items = []
    }
  }
})
