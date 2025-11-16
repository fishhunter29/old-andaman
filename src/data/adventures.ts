// src/data/adventures.ts

import adventuresJson from './adventures.json';

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
  | 'per_vehicle'
  | 'per_kayak'
  | 'per_kart';

export type IslandCode =
  | 'PB'
  | 'HL'
  | 'NL'
  | 'DG'
  | 'LI'
  | 'RG'
  | 'LA'
  | 'MY'
  | 'BT'
  | 'RX';

export interface Adventure {
  id: string;
  name: string;
  slug: string;
  category: AdventureCategory | string;
  description: string;
  durationMin: number | null;
  ageMin: number | null;
  operatedIn: IslandCode[] | string[];
  unit: PricingUnit | string;
  basePriceINR: number | null;
  bookingType: string;
  apiSource: string;
  gearIncluded: string[];
  safetyNotes: string;
  season: string;
  difficulty: string;
}

export const adventures: Adventure[] = adventuresJson as Adventure[];

export const pricedAdventures: Adventure[] = adventures.filter(
  (adv) => adv.basePriceINR !== null && adv.operatedIn.length > 0
);

export function getAdventureBySlug(slug: string): Adventure | undefined {
  return adventures.find((adv) => adv.slug === slug);
}

export function listAdventuresByIsland(islandCode: IslandCode): Adventure[] {
  return pricedAdventures.filter((adv) =>
    adv.operatedIn.includes(islandCode)
  );
}

export function listAdventuresByCategory(
  category: AdventureCategory
): Adventure[] {
  return pricedAdventures.filter((adv) => adv.category === category);
}

export function getAdventurePrice(
  adventure: Adventure,
  peopleCount: number
): number | null {
  if (adventure.basePriceINR == null) return null;

  switch (adventure.unit) {
    case 'per_person':
      return adventure.basePriceINR * Math.max(peopleCount, 1);

    case 'per_group':
    case 'per_boat':
    case 'per_vehicle':
    case 'per_kayak':
    case 'per_kart':
      return adventure.basePriceINR;

    default:
      return adventure.basePriceINR;
  }
}
