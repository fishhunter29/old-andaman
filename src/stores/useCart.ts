import { defineStore } from 'pinia'

export type Currency = 'INR' | 'USD'

/**
 * Logical sections for the trip summary UI.
 * Keep these in sync with TotalsBar sections:
 * Activities / Cabs / Ferries / Scooters / Bicycles.
 */
export type CartSection =
  | 'activities'
  | 'cabs'
  | 'ferries'
  | 'scooters'
  | 'bicycles'
  | 'other'

export interface CartItem {
  /** Unique id inside the cart (you can encode type+island+direction etc.) */
  id: string
  /** What the user sees in the summary, e.g. "Discover Scuba – Havelock" */
  label: string
  /** How many units (people, days, vehicles, rides, etc.) */
  quantity: number
  /** Price per unit in the cart currency */
  unitPrice: number
  /** Which section this item belongs to in the UI */
  section?: CartSection
  /** Currency of this line (for now always same as store currency) */
  currency?: Currency
  /** Any extra info (islandId, islandName, from/to, date, vendor, etc.) */
  meta?: Record<string, any>
}

export interface Totals {
  subTotal: number
  tax: number
  serviceFee: number
  grandTotal: number
  currency: Currency
}

/** Helper shape for grouped totals per section */
export interface SectionTotals {
  section: CartSection
  items: CartItem[]
  subTotal: number
}

export const useCart = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    taxPercent: 0,
    serviceFee: 0,
    currency: 'INR' as Currency
  }),

  getters: {
    /** Overall trip totals */
    totals(state): Totals {
      const subTotal = state.items.reduce(
        (s, i) => s + i.unitPrice * i.quantity,
        0
      )
      const tax = (subTotal * state.taxPercent) / 100
      const serviceFee =
        typeof state.serviceFee === 'number' ? state.serviceFee : 0
      const grandTotal = subTotal + tax + serviceFee

      return {
        subTotal,
        tax,
        serviceFee,
        grandTotal,
        currency: state.currency
      }
    },

    /**
     * Breakup per section – perfect for a collapsible trip summary:
     * - Activities
     * - Cabs
     * - Ferries
     * - Scooters
     * - Bicycles
     */
    bySection(state): Record<CartSection, SectionTotals> {
      const base: Record<CartSection, SectionTotals> = {
        activities: { section: 'activities', items: [], subTotal: 0 },
        cabs: { section: 'cabs', items: [], subTotal: 0 },
        ferries: { section: 'ferries', items: [], subTotal: 0 },
        scooters: { section: 'scooters', items: [], subTotal: 0 },
        bicycles: { section: 'bicycles', items: [], subTotal: 0 },
        other: { section: 'other', items: [], subTotal: 0 }
      }

      for (const item of state.items) {
        const sec: CartSection = item.section ?? 'other'
        const bucket = base[sec]
        bucket.items.push(item)
        bucket.subTotal += item.unitPrice * item.quantity
      }

      return base
    }
  },

  actions: {
    /**
     * Called once after meta.json is loaded.
     * meta.json right now = { currency: "INR", taxPercent: 0, serviceFee: 0 }
     */
    setMeta(currency: Currency, taxPercent = 0, serviceFee = 0) {
      this.currency = currency
      this.taxPercent = taxPercent
      this.serviceFee = serviceFee
    },

    /**
     * Generic upsert – use a **stable id** per choice.
     * Example ids:
     * - "activity:ADV048"
     * - "cab:PB-HL:SEDAN"
     * - "ferry:PB-HL:Makruzz"
     * - "scooter:HL:DAY"
     * - "bicycle:NL:DAY"
     */
    addOrUpdate(item: CartItem) {
      const idx = this.items.findIndex(x => x.id === item.id)
      if (idx >= 0) {
        this.items[idx] = item
      } else {
        this.items.push(item)
      }
    },

    /** Replace *all* items of a particular section (e.g. all cabs for the trip). */
    setSectionItems(section: CartSection, items: CartItem[]) {
      // Keep everything except this section…
      this.items = this.items.filter(i => (i.section ?? 'other') !== section)
      // …and append new ones
      for (const item of items) {
        this.items.push({
          ...item,
          section // force section to match argument
        })
      }
    },

    /** Remove one line item by id */
    remove(id: string) {
      this.items = this.items.filter(i => i.id !== id)
    },

    /** Remove every item belonging to this section */
    clearSection(section: CartSection) {
      this.items = this.items.filter(i => (i.section ?? 'other') !== section)
    },

    /** Clear entire cart */
    clear() {
      this.items = []
    }
  }
})
