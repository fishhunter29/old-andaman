interface BicycleRow {
  islandId: string
  island: string
  bikeType: string      // Hybrid / MTB / Cruiser…
  plan: 'HALF_DAY' | 'DAY' | 'MULTI_DAY' | string
  durationHours: number
  baseRateINR: number
  securityDepositINR: number
  isAvailable: boolean
  lateFeePerHourINR: number
  peakSeasonMarkupPct: number
}
