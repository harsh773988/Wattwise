/**
 * National 7 Mission LiFE Themes & Quests Engine.
 * Aligned with India's official Mission LiFE (Lifestyle for Environment) pillars.
 * Pure domain logic — zero framework, I/O, or env imports.
 */

import { round2 } from "./cost";

export type LifePillar =
  | "energy"
  | "water"
  | "plastic"
  | "food"
  | "waste"
  | "lifestyle"
  | "ewaste";

export type QuestEvidenceType = "photo" | "meter_check" | "receipt";

export const NATIONAL_DAILY_VERIFIED_POINTS_CAP = 100;
export const LIFE_STREAK_MULTIPLIER_PER_DAY = 0.1;
export const LIFE_STREAK_MULTIPLIER_CAP = 1.5;

export interface LifeThemeInfo {
  readonly id: LifePillar;
  readonly title: string;
  readonly hindiTitle: string;
  readonly description: string;
  readonly iconName: string;
  readonly colorClass: string;
}

export interface NationalLifeQuest {
  readonly id: string;
  readonly pillar: LifePillar;
  readonly title: string;
  readonly description: string;
  readonly points: number;
  readonly difficulty: "easy" | "medium" | "hard";
  readonly estimatedCo2SavingKg: number;
  readonly verificationType: "self_report" | "photo_evidence" | "meter_reading";
  readonly evidenceTypes: readonly QuestEvidenceType[];
  readonly tips: string;
}

export interface NationalQuestAward {
  readonly basePoints: number;
  readonly streakMultiplier: number;
  readonly pointsAwarded: number;
  readonly dailyPointsRemaining: number;
  readonly evidenceType: QuestEvidenceType;
}

export interface CitizenPassportProfile {
  readonly name: string;
  readonly stateCode: string;
  readonly totalPoints: number;
  readonly totalKwhSaved: number;
  readonly totalCo2AvoidedKg: number;
  readonly completedQuestsCount: number;
}

export type PassportTier = "Eco Novice" | "Green Scout" | "LiFE Guardian" | "Net-Zero Pioneer";

export interface PassportBadge {
  readonly tier: PassportTier;
  readonly nextTier: PassportTier | null;
  readonly pointsToNextTier: number;
  readonly progressPercent: number;
  readonly equivalentTreesPlanted: number;
  readonly coalAvoidedKg: number;
}

export const MISSION_LIFE_THEMES: readonly LifeThemeInfo[] = [
  {
    id: "energy",
    title: "Save Energy",
    hindiTitle: "ऊर्जा बचत",
    description: "Optimize home power usage, switch to star-rated appliances, and leverage solar hours.",
    iconName: "Zap",
    colorClass: "amber",
  },
  {
    id: "water",
    title: "Save Water",
    hindiTitle: "जल संरक्षण",
    description: "Fix leaks, use aerators, practice rainwater harvesting, and reduce water-pumping runtime.",
    iconName: "Droplets",
    colorClass: "blue",
  },
  {
    id: "plastic",
    title: "Say No to Single-Use Plastic",
    hindiTitle: "प्लास्टिक मुक्ति",
    description: "Carry reusable cloth bags, avoid plastic packaging, and eliminate disposable cutlery.",
    iconName: "ShoppingBag",
    colorClass: "rose",
  },
  {
    id: "food",
    title: "Adopt Sustainable Food Systems",
    hindiTitle: "सतत आहार",
    description: "Prioritize local seasonal produce, reduce food waste, and support organic kitchen gardens.",
    iconName: "Apple",
    colorClass: "emerald",
  },
  {
    id: "waste",
    title: "Reduce Waste (3Rs)",
    hindiTitle: "कचरा न्यूनीकरण",
    description: "Segregate wet and dry waste, home compost organics, and recycle household materials.",
    iconName: "Trash2",
    colorClass: "purple",
  },
  {
    id: "lifestyle",
    title: "Adopt Healthy Lifestyles",
    hindiTitle: "स्वस्थ जीवनशैली",
    description: "Walk or cycle for short neighborhood trips, practice yoga, and embrace mindful consumption.",
    iconName: "HeartPulse",
    colorClass: "teal",
  },
  {
    id: "ewaste",
    title: "Reduce E-Waste",
    hindiTitle: "ई-कचरा प्रबंधन",
    description: "Repair electronics before replacing, recycle obsolete gadgets through authorized recyclers.",
    iconName: "Cpu",
    colorClass: "indigo",
  },
];

export const NATIONAL_QUESTS_CATALOG: readonly NationalLifeQuest[] = [
  // Save Energy
  {
    id: "quest_ac_25c",
    pillar: "energy",
    title: "Set AC to 25°C or higher",
    description: "Keep room air conditioning at 25°C or above. Every 1°C increase cuts compressor load by ~6%.",
    points: 25,
    difficulty: "easy",
    estimatedCo2SavingKg: 1.8,
    verificationType: "photo_evidence",
    evidenceTypes: ["photo"],
    tips: "Combine with ceiling fan circulation for maximum thermal comfort.",
  },
  {
    id: "quest_solar_hour_shift",
    pillar: "energy",
    title: "Shift heavy wash into Solar Green Hours",
    description: "Run washing machine or dishwasher between 10:00 AM and 4:00 PM during peak solar generation.",
    points: 40,
    difficulty: "medium",
    estimatedCo2SavingKg: 1.2,
    verificationType: "photo_evidence",
    evidenceTypes: ["photo", "meter_check"],
    tips: "Takes advantage of high clean solar energy on the national grid.",
  },
  {
    id: "quest_kill_vampire",
    pillar: "energy",
    title: "Vampire Power Audit",
    description: "Switch off entertainment units, microwaves, and phone chargers at the plug before sleeping.",
    points: 20,
    difficulty: "easy",
    estimatedCo2SavingKg: 0.6,
    verificationType: "photo_evidence",
    evidenceTypes: ["photo"],
    tips: "Standby power accounts for 5–10% of total residential consumption.",
  },

  // Save Water
  {
    id: "quest_aerator_install",
    pillar: "water",
    title: "Verify tap aerators / low-flow nozzles",
    description: "Ensure bathroom and kitchen taps have aerators to cut water flow from 15 L/min to 6 L/min.",
    points: 35,
    difficulty: "medium",
    estimatedCo2SavingKg: 0.8,
    verificationType: "photo_evidence",
    evidenceTypes: ["photo"],
    tips: "Saves both water and the electricity needed to pump it into overhead tanks.",
  },

  // Plastic
  {
    id: "quest_cloth_bag_trip",
    pillar: "plastic",
    title: "Carry cloth bags for daily groceries",
    description: "Complete your grocery or vegetable market run using durable cloth/jute bags with zero polythene.",
    points: 30,
    difficulty: "easy",
    estimatedCo2SavingKg: 0.5,
    verificationType: "photo_evidence",
    evidenceTypes: ["photo", "receipt"],
    tips: "Keep a spare folded cloth bag in your vehicle or backpack at all times.",
  },

  // Sustainable Food Systems
  {
    id: "quest_local_seasonal_meal",
    pillar: "food",
    title: "Choose a local seasonal meal",
    description: "Prepare a meal with local seasonal ingredients and plan portions to avoid food waste.",
    points: 30,
    difficulty: "medium",
    estimatedCo2SavingKg: 0.7,
    verificationType: "photo_evidence",
    evidenceTypes: ["photo", "receipt"],
    tips: "Plan the meal before shopping and store leftovers safely.",
  },

  // Waste
  {
    id: "quest_waste_segregation",
    pillar: "waste",
    title: "Strict Wet & Dry Segregation",
    description: "Keep green bin for organic food scraps and blue bin for recyclables without contamination.",
    points: 25,
    difficulty: "easy",
    estimatedCo2SavingKg: 1.1,
    verificationType: "photo_evidence",
    evidenceTypes: ["photo"],
    tips: "Prevents methane emissions at municipal landfills.",
  },

  // Healthy Lifestyle
  {
    id: "quest_cycle_walk_short",
    pillar: "lifestyle",
    title: "Zero-Fuel Neighborhood Trip",
    description: "Walk or bicycle for a trip under 2 kilometers instead of using a car or scooter.",
    points: 30,
    difficulty: "easy",
    estimatedCo2SavingKg: 0.9,
    verificationType: "photo_evidence",
    evidenceTypes: ["photo"],
    tips: "Saves petrol, cuts urban particulate pollution, and boosts daily cardio.",
  },

  // E-Waste
  {
    id: "quest_ewaste_dropoff",
    pillar: "ewaste",
    title: "Old Cables & Phone Battery Recycling",
    description: "Collect unused charging cables, old power banks, or dead batteries and take to an authorized drop point.",
    points: 50,
    difficulty: "hard",
    estimatedCo2SavingKg: 2.5,
    verificationType: "photo_evidence",
    evidenceTypes: ["photo", "receipt"],
    tips: "Prevents toxic heavy metals (lead, cadmium) from leaching into groundwater.",
  },
];

export function getLifeStreakMultiplier(consecutiveDays: number): number {
  if (!Number.isInteger(consecutiveDays) || consecutiveDays < 0) {
    throw new RangeError("Streak days must be a non-negative integer");
  }
  return Math.min(
    1 + consecutiveDays * LIFE_STREAK_MULTIPLIER_PER_DAY,
    LIFE_STREAK_MULTIPLIER_CAP
  );
}

/**
 * Calculate an evidence-backed quest award.
 * The caller must verify the evidence before requesting an award.
 */
export function calculateNationalQuestAward(
  quest: NationalLifeQuest,
  evidenceType: QuestEvidenceType,
  consecutiveDays: number,
  pointsAwardedToday: number
): NationalQuestAward {
  if (!Number.isInteger(quest.points) || quest.points <= 0) {
    throw new RangeError("Quest points must be a positive integer");
  }
  if (!Number.isInteger(pointsAwardedToday) || pointsAwardedToday < 0) {
    throw new RangeError("Points already awarded today must be a non-negative integer");
  }
  if (!quest.evidenceTypes.includes(evidenceType)) {
    throw new RangeError(
      `Evidence type "${evidenceType}" is not accepted for quest "${quest.id}"`
    );
  }

  const streakMultiplier = getLifeStreakMultiplier(consecutiveDays);
  const pointsAwarded = Math.min(
    Math.floor(quest.points * streakMultiplier),
    Math.max(0, NATIONAL_DAILY_VERIFIED_POINTS_CAP - pointsAwardedToday)
  );

  return {
    basePoints: quest.points,
    streakMultiplier,
    pointsAwarded,
    dailyPointsRemaining: Math.max(
      0,
      NATIONAL_DAILY_VERIFIED_POINTS_CAP - pointsAwardedToday - pointsAwarded
    ),
    evidenceType,
  };
}

/**
 * Calculate citizen passport tier, progress, and ecological equivalents.
 */
export function calculatePassportTier(profile: CitizenPassportProfile): PassportBadge {
  const points = Math.max(0, profile.totalPoints);

  let tier: PassportTier = "Eco Novice";
  let nextTier: PassportTier | null = "Green Scout";
  let tierMin = 0;
  let tierMax = 100;

  if (points >= 500) {
    tier = "Net-Zero Pioneer";
    nextTier = null;
    tierMin = 500;
    tierMax = 500;
  } else if (points >= 250) {
    tier = "LiFE Guardian";
    nextTier = "Net-Zero Pioneer";
    tierMin = 250;
    tierMax = 500;
  } else if (points >= 100) {
    tier = "Green Scout";
    nextTier = "LiFE Guardian";
    tierMin = 100;
    tierMax = 250;
  } else {
    tier = "Eco Novice";
    nextTier = "Green Scout";
    tierMin = 0;
    tierMax = 100;
  }

  const pointsToNextTier = nextTier ? Math.max(0, tierMax - points) : 0;
  const progressPercent =
    tierMax === tierMin
      ? 100
      : Math.min(100, Math.round(((points - tierMin) / (tierMax - tierMin)) * 100));

  // Ecological equivalents:
  // 1 tree absorbs ~20 kg CO2 / year
  const equivalentTreesPlanted = round2(profile.totalCo2AvoidedKg / 20);
  // In Indian thermal power, 1 kWh ~ 0.65 kg coal burned
  const coalAvoidedKg = round2(profile.totalKwhSaved * 0.65);

  return {
    tier,
    nextTier,
    pointsToNextTier,
    progressPercent,
    equivalentTreesPlanted,
    coalAvoidedKg,
  };
}
