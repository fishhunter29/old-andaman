// src/types/index.ts

// --------------------------------------
// 1) Core enums / shared types
// --------------------------------------
export type IslandId =
  | 'PB' // Port Blair
  | 'HL' // Havelock / Swaraj Dweep
  | 'NL' // Neil / Shaheed Dweep
  | 'DG' // Diglipur
  | 'LI' // Long Island
  | 'RG' // Rangat
  | 'MB' // Mayabunder
  | 'LA' // Little Andaman
  | 'BT' // Baratang
  | 'MY' // Mayabunder wider region
  | 'RX'; // Remote / expeditions

export type AdventureCategory =
  | 'trek'
  | 'adrenaline'
  | 'adventure'
  | 'water'
  | 'dive'
  | 'nature'
  | 'sport'
  | 'family'
  | 'cultural'
  | 'leisure'
  | 'ground'
  | 'boat'
  | 'wildlife'
  | 'cruise';

export type PricingUnit =
  | 'per_person'
  | 'per_group'
  | 'per_boat'
  | 'per_kayak'
  | 'per_vehicle'
  | 'per_kart';

// --------------------------------------
// 2) Locations (locations.json)
// --------------------------------------
export interface Location {
  id: string;
  island: string;       // e.g. "Port Blair (South Andaman)"
  location: string;     // display name
  moods: string[];
  category: string;
  brief: string;
  typicalHours: number;
  bestTime: string;
  permitRequired: boolean;
  bookingType: string;
  recommendedTime: string;
  slug: string;
}

// --------------------------------------
// 3) Adventures (adventures.json)
// --------------------------------------
export interface Adventure {
  id: string;
  name: string;
  slug: string;
  category: AdventureCategory;
  description: string;
  durationMin: number | null;
  ageMin: number | null;
  operatedIn: IslandId[];     // 'PB', 'HL', 'NL', 'DG', 'LI', 'RG', 'LA', 'MY', 'BT', 'RX'
  unit: PricingUnit | string; // keep string loose for future extra units
  basePriceINR: number | null;
  bookingType: string;
  apiSource: string;
  gearIncluded: string[];
  safetyNotes: string;
  season: string;
  difficulty: string;
}

// --------------------------------------
// 4) Location ↔ Adventure mapping (location_adventures.json)
// --------------------------------------
export interface LocationAdventureLink {
  location_id: string;    // matches Location.id
  adventure_ids: string[]; // matches Adventure.id (or slugs, depending on JSON)
}

// --------------------------------------
// 5) Ferries (ferries.json)
// --------------------------------------
export interface FerryOperatorFare {
  operator: string;      // e.g. "Makruzz"
  sampleFareINR: number | null;
}

export interface FerryRoute {
  id: string;            // e.g. "PB-HL"
  from: string;          // label "Port Blair"
  to: string;            // label "Havelock"
  originId: IslandId;    // "PB"
  destinationId: IslandId; // "HL"
  operators: FerryOperatorFare[];
  typicalDurationMin: number;
}

// --------------------------------------
// 6) Cabs (cabs.json) – keep slightly generic
// --------------------------------------
export type CabCategory =
  | 'HATCHBACK'
  | 'SEDAN'
  | 'SUV'
  | 'MUV'
  | 'TEMPO'
  | string; // allow future custom tags

export interface CabOption {
  id: string;
  islandId: IslandId;         // where this cab category applies
  category: CabCategory;      // locked per island in UI
  label: string;              // e.g. "AC Sedan (Dzire/Amaze)"
  baseRateINR: number;        // for point-to-point / day usage etc.
  unit: 'per_transfer' | 'per_day' | string;
  notes?: string;
  // additional fields if present in JSON:
  [key: string]: any;
}

// --------------------------------------
// 7) Scooters (scooters.json)
// --------------------------------------
export type ScooterPlan = 'HALF_DAY' | 'DAY' | string;

export interface ScooterRental {
  islandId: IslandId;
  island: string;
  model: string;            // e.g. "Honda Activa (110-125cc)"
  plan: ScooterPlan;        // HALF_DAY / DAY
  durationHours: number;
  baseRateINR: number;
  securityDepositINR: number;
  isAvailable: boolean;
  lateFeePerHourINR: number;
  peakSeasonMarkupPct: number;
}

// --------------------------------------
// 8) Bicycles (bicycles.json)
// --------------------------------------
export type BicyclePlan = 'HALF_DAY' | 'DAY' | string;

export interface BicycleRental {
  islandId: IslandId;
  island: string;
  model: string;             // e.g. "Hybrid City Bicycle"
  frameSize: string;         // "M", "L", "Unisex" etc.
  gears: string;             // "single-speed" / "7-speed"
  plan: BicyclePlan;
  durationHours: number;
  baseRateINR: number;
  securityDepositINR: number;
  isAvailable: boolean;
  lateFeePerHourINR: number;
  peakSeasonMarkupPct: number;
}

// --------------------------------------
// 9) Islands meta (islands.json)
// --------------------------------------
export interface IslandMeta {
  id: IslandId;            // PB, HL, NL, etc.
  name: string;            // "Port Blair (South Andaman)"
  region: 'South' | 'Middle' | 'North' | 'Remote' | string;
  isHub?: boolean;         // for ferries/cabs logic if we want later
}

// --------------------------------------
// 10) Meta (meta.json)
// --------------------------------------
export interface MetaConfig {
  currency: string;        // "INR"
  taxPercent: number;      // 0 for now
  serviceFee: number;      // 0 for now
}

// --------------------------------------
// 11) DataPack (what useDataPack() returns)
// --------------------------------------
export interface DataPack {
  locations: Location[];
  adventures: Adventure[];
  locationAdventures: LocationAdventureLink[];
  ferries: FerryRoute[];
  cabs: CabOption[];
  scooters: ScooterRental[];
  bicycles: BicycleRental[];
  islands: IslandMeta[];
  meta: MetaConfig;
}

// --------------------------------------
// 12) Cart types (used in useCart.ts & TotalsBar)
// --------------------------------------
export interface CartActivityItem {
  type: 'activity';
  adventureId: string;
  locationId?: string;
  islandId?: IslandId;
  title: string;
  quantity: number;
  unitPriceINR: number;
  totalINR: number;
}

export interface CartCabItem {
  type: 'cab';
  islandId: IslandId;
  category: CabCategory;
  label: string;
  days: number;
  totalINR: number;
}

export interface CartFerryItem {
  type: 'ferry';
  routeId: string;          // e.g. "PB-HL"
  operator: string;
  passengers: number;
  unitPriceINR: number;
  totalINR: number;
}

export interface CartScooterItem {
  type: 'scooter';
  islandId: IslandId;
  model: string;
  plan: ScooterPlan;
  days: number;
  unitPriceINR: number;
  totalINR: number;
}

export interface CartBicycleItem {
  type: 'bicycle';
  islandId: IslandId;
  model: string;
  plan: BicyclePlan;
  days: number;
  unitPriceINR: number;
  totalINR: number;
}

export type CartItem =
  | CartActivityItem
  | CartCabItem
  | CartFerryItem
  | CartScooterItem
  | CartBicycleItem;
