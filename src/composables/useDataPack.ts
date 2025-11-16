import { ref } from 'vue'

const cache = ref<any | null>(null)

export function useDataPack() {
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const load = async () => {
    if (cache.value) return cache.value
    isLoading.value = true
    try {
      const [locations, activities, ferries, cabs, scooters, meta] = await Promise.all([
        fetch('/data/locations.json').then(r=>r.json()),
        fetch('/data/activities.json').then(r=>r.json()),
        fetch('/data/ferries.json').then(r=>r.json()),
        fetch('/data/cabs.json').then(r=>r.json()),
        fetch('/data/scooters.json').then(r=>r.json()),
        fetch('/data/meta.json').then(r=>r.json()).catch(()=>({ currency: 'INR' }))
      ])
      cache.value = { locations, activities, ferries, cabs, scooters, meta }
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
