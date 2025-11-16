<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDataPack } from '../composables/useDataPack'
import { useCart } from '../stores/useCart'

const { load, isLoading, error } = useDataPack()
const data = ref<any | null>(null)

const selectedIslandId = ref<string>('')
const selectedLocationId = ref<string>('')      // optional, mainly for meta
const peopleCount = ref<number>(2)

const cart = useCart()

onMounted(async () => {
  try {
    data.value = await load()
  } catch (e) {
    console.error(e)
  }
})

/**
 * Build island dropdown from locations.json.
 * Uses id prefix as code: PB, HL, NL, DG, LI, RG, LA, MB, MY, BT, RX.
 */
const islands = computed(() => {
  if (!data.value?.locations) return []
  const map = new Map<string, string>()
  for (const loc of data.value.locations) {
    const id = String(loc.id)
    if (id.length < 2) continue
    const code = id.slice(0, 2)
    if (!map.has(code)) {
      map.set(code, loc.island ?? code)
    }
  }
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

watch(
  islands,
  list => {
    if (!selectedIslandId.value && list.length) {
      selectedIslandId.value = list[0].id
    }
  },
  { immediate: true }
)

const locationsForIsland = computed(() => {
  if (!data.value?.locations || !selectedIslandId.value) return []
  return data.value.locations.filter((loc: any) =>
    String(loc.id).startsWith(selectedIslandId.value)
  )
})

watch(
  locationsForIsland,
  list => {
    if (!selectedLocationId.value && list.length) {
      selectedLocationId.value = list[0].id
    }
  },
  { immediate: true }
)

const selectedIslandLabel = computed(() => {
  const entry = islands.value.find(i => i.id === selectedIslandId.value)
  return entry ? entry.name : selectedIslandId.value
})

/**
 * For now we keep it simple:
 * show all adventures that operate in the selected island
 * (using the Adventure.operatedIn array).
 * Later we can refine with location_adventures.json if needed.
 */
const adventuresForIsland = computed(() => {
  if (!data.value?.adventures || !selectedIslandId.value) return []
  return data.value.adventures.filter((adv: any) =>
    Array.isArray(adv.operatedIn) &&
    adv.operatedIn.includes(selectedIslandId.value)
  )
})

function addAdventure(adv: any) {
  if (!adv || !adv.basePriceINR) return

  const qty = peopleCount.value > 0 ? peopleCount.value : 1

  cart.addOrUpdate({
    id: `activity:${adv.id}`,
    label: `${adv.name} – ${selectedIslandLabel.value}`,
    quantity: qty,
    unitPrice: adv.basePriceINR,
    section: 'activities',
    currency: cart.currency,
    meta: {
      islandId: selectedIslandId.value,
      islandName: selectedIslandLabel.value,
      locationId: selectedLocationId.value || null,
      durationMin: adv.durationMin ?? null,
      raw: adv
    }
  })
}
</script>

<template>
  <section class="activities-picker">
    <h2>Activities & Adventures</h2>

    <div v-if="isLoading">Loading activities…</div>
    <div v-else-if="error">Error loading data.</div>
    <div v-else-if="!data">No data loaded.</div>
    <div v-else>
      <!-- Island & location selectors -->
      <div class="selectors">
        <label>
          Island
          <select v-model="selectedIslandId">
            <option
              v-for="island in islands"
              :key="island.id"
              :value="island.id"
            >
              {{ island.name }}
            </option>
          </select>
        </label>

        <label>
          Location (context only)
          <select v-model="selectedLocationId">
            <option
              v-for="loc in locationsForIsland"
              :key="loc.id"
              :value="loc.id"
            >
              {{ loc.location }}
            </option>
          </select>
        </label>

        <label>
          People
          <input
            type="number"
            min="1"
            v-model.number="peopleCount"
            style="width: 70px"
          />
        </label>
      </div>

      <!-- Adventure list -->
      <table class="activities-table">
        <thead>
          <tr>
            <th style="text-align:left;">Adventure</th>
            <th>Duration</th>
            <th>From (₹)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="adv in adventuresForIsland"
            :key="adv.id"
          >
            <td>
              <div class="adv-name">{{ adv.name }}</div>
              <div class="adv-desc">{{ adv.description }}</div>
            </td>
            <td style="text-align:center;">
              <span v-if="adv.durationMin">
                ~{{ Math.round(adv.durationMin / 60) }} hr
              </span>
              <span v-else>—</span>
            </td>
            <td style="text-align:center;">
              <span v-if="adv.basePriceINR">
                ₹{{ adv.basePriceINR.toLocaleString('en-IN') }}
              </span>
              <span v-else>On request</span>
            </td>
            <td style="text-align:right;">
              <button
                :disabled="!adv.basePriceINR"
                @click="addAdventure(adv)"
              >
                Add
              </button>
            </td>
          </tr>

          <tr v-if="adventuresForIsland.length === 0">
            <td colspan="4" style="text-align:center; padding:1rem;">
              No adventures mapped for this island yet.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.activities-picker {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.selectors {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.selectors label {
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
}

.activities-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.activities-table th,
.activities-table td {
  border-top: 1px solid #eee;
  padding: 0.5rem;
}

.adv-name {
  font-weight: 600;
}

.adv-desc {
  font-size: 0.8rem;
  opacity: 0.8;
}

button {
  padding: 0.3rem 0.75rem;
  border-radius: 4px;
  border: 1px solid #ccc;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
