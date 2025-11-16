import { ref } from 'vue'

const cache = ref<any | null>(null)

export function useDataPack() {
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const load = async () => {
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
        bicycles,
        meta
      ] = await Promise.all([
        fetch('/data/locations.json').then(r => r.json()),
        fetch('/data/adventures.json').then(r => r.json()),
        fetch('/data/location_adventures.json').then(r => r.json()).catch(() => []),
        fetch('/data/ferries.json').then(r => r.json()),
        fetch('/data/cabs.json').then(r => r.json()),
        fetch('/data/scooters.json').then(r => r.json()),
        fetch('/data/bicycle.json').then(r => r.json()).catch(() => []),
        fetch('/data/meta.json')
          .then(r => r.json())
          .catch(() => ({ currency: 'INR', taxPercent: 0, serviceFee: 0 }))
      ])

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
