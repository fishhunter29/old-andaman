import { ref } from 'vue'

type MetaConfig = {
  currency: string
  taxPercent?: number
  serviceFee?: number
}

type DataPack = {
  locations: any[]
  adventures: any[]
  locationAdventures: any[]
  ferries: any[]
  cabs: any[]
  scooters: any[]
  bicycles: any[]
  meta: MetaConfig
}

const cache = ref<DataPack | null>(null)

export function useDataPack() {
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const load = async (): Promise<DataPack> => {
    if (cache.value) return cache.value

    isLoading.value = true
    try {
      const [
        locations,
        adventures,
        locationAdventures,
        ferries,
        cabs,
        scooters,
        bicyclesRaw,
        metaRaw
      ] = await Promise.all([
        fetch('/data/locations.json').then(r => r.json()),
        fetch('/data/adventures.json').then(r => r.json()),
        fetch('/data/location_adventures.json').then(r => r.json()),
        fetch('/data/ferries.json').then(r => r.json()),
        fetch('/data/cabs.json').then(r => r.json()),
        fetch('/data/scooters.json').then(r => r.json()),
        // bicycle.json might be missing in some older branches, so fail-safe to []
        fetch('/data/bicycle.json').then(r => r.json()).catch(() => []),
        // meta.json: default to INR + 0% tax/service if anything goes wrong
        fetch('/data/meta.json')
          .then(r => r.json())
          .catch(() => ({ currency: 'INR', taxPercent: 0, serviceFee: 0 }))
      ])

      const meta: MetaConfig = {
        currency: metaRaw.currency ?? 'INR',
        taxPercent: metaRaw.taxPercent ?? 0,
        serviceFee: metaRaw.serviceFee ?? 0
      }

      const bicycles = Array.isArray(bicyclesRaw) ? bicyclesRaw : []

      cache.value = {
        locations,
        adventures,
        locationAdventures,
        ferries,
        cabs,
        scooters,
        bicycles,
        meta
      }

      return cache.value
    } catch (e: any) {
      error.value = e
      throw e
    } finally {
      isLoading.value = false
    }
  }

  return { load, isLoading, error }
}
