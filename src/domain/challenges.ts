/**
 * Daily challenge catalogue for household sustainability micro-tasks.
 * Domain data is static and typed; UI consumes it without business logic.
 */

import type { Challenge, ChallengeCompletion, UserProfile } from "./types";

export const challengeCatalog: readonly Challenge[] = [
  {
    id: "ac-one-hour-less",
    title: "AC one hour less",
    description: "Reduce AC runtime by one hour in the evening.",
    difficulty: "easy",
    points: 25,
    applianceTag: "ac",
    estimatedKwhEffect: 1.4,
  },
  {
    id: "full-load-wash",
    title: "Run a full-load wash",
    description: "Wait until the washing machine is full before running a cycle.",
    difficulty: "easy",
    points: 20,
    applianceTag: "washing machine",
    estimatedKwhEffect: 1.1,
  },
  {
    id: "lights-off-empty-rooms",
    title: "Light empty rooms only",
    description: "Switch off lights in empty rooms and use task lighting.",
    difficulty: "easy",
    points: 15,
    applianceTag: "lights",
    estimatedKwhEffect: 0.7,
  },
  {
    id: "air-dry-clothes",
    title: "Air-dry clothes today",
    description: "Avoid dryer use and hang clothes in the sun or indoors.",
    difficulty: "medium",
    points: 30,
    applianceTag: "washing machine",
    estimatedKwhEffect: 1.9,
  },
  {
    id: "unplug-chargers",
    title: "Unplug chargers overnight",
    description: "Remove standby chargers and adapters from the wall before sleep.",
    difficulty: "easy",
    points: 15,
    applianceTag: "standby",
    estimatedKwhEffect: 0.5,
  },
  {
    id: "geyser-shifted",
    title: "Shift geyser use",
    description: "Take a shower before 18:00 or after 22:00 to avoid the evening peak.",
    difficulty: "medium",
    points: 30,
    applianceTag: "geyser",
    estimatedKwhEffect: 2.2,
  },
  {
    id: "iron-off-peak",
    title: "Iron outside peak hours",
    description: "Do ironing after 22:00 or during the morning instead of in the evening.",
    difficulty: "medium",
    points: 20,
    applianceTag: "iron",
    estimatedKwhEffect: 1.0,
  },
  {
    id: "pump-after-peak",
    title: "Pump water after peak hours",
    description: "Schedule water pumping for a time outside the assumed peak window.",
    difficulty: "easy",
    points: 20,
    applianceTag: "pump",
    estimatedKwhEffect: 1.2,
  },
  {
    id: "fan-usage-moderation",
    title: "Moderate fan use",
    description: "Turn off fans in unoccupied rooms and use a lower speed where possible.",
    difficulty: "easy",
    points: 15,
    applianceTag: "fan",
    estimatedKwhEffect: 0.6,
  },
  {
    id: "smart-plug-timer",
    title: "Use a timer or smart plug",
    description: "Automate a device to switch off at a set time each night.",
    difficulty: "medium",
    points: 25,
    applianceTag: "standby",
    estimatedKwhEffect: 0.9,
  },
  {
    id: "cooler-better-settings",
    title: "Set cooler settings wisely",
    description: "Raise the settings a little and use natural ventilation when possible.",
    difficulty: "easy",
    points: 20,
    applianceTag: "ac",
    estimatedKwhEffect: 1.1,
  },
  {
    id: "close-curtains-early",
    title: "Reduce daytime heat gain",
    description: "Close curtains or blinds before the hottest part of the afternoon.",
    difficulty: "easy",
    points: 15,
    applianceTag: "ac",
    estimatedKwhEffect: 0.8,
  },
  {
    id: "cook-batch-meals",
    title: "Batch cook once today",
    description: "Prepare a larger meal in one session instead of multiple reheats.",
    difficulty: "medium",
    points: 25,
    applianceTag: "kitchen",
    estimatedKwhEffect: 1.5,
  },
  {
    id: "dishwasher-full-cycle",
    title: "Run dishwasher only when full",
    description: "Wait for a full dishwasher load instead of running a partial cycle.",
    difficulty: "easy",
    points: 20,
    applianceTag: "kitchen",
    estimatedKwhEffect: 1.0,
  },
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function simpleHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function pickDailyChallenges(
  profile: UserProfile,
  date: string,
  completedHistory: readonly string[],
): readonly Challenge[] {
  const preferred = challengeCatalog.filter((challenge) => {
    if (!challenge.applianceTag) return true;
    const applianceTag = challenge.applianceTag ?? "";
    return profile.main_appliances.some((appliance) => normalize(appliance) === normalize(applianceTag));
  });

  const base = preferred.length > 0 ? preferred : challengeCatalog;
  const seed = simpleHash(`${profile.id}:${date}`);
  const seen = new Set(completedHistory.map((value) => value.trim()));
  const ranked = [...base].sort((a, b) => {
    const aPriority = seen.has(a.id) ? 999 : 0;
    const bPriority = seen.has(b.id) ? 999 : 0;
    return aPriority - bPriority || (simpleHash(`${seed}:${a.id}`) % 17) - (simpleHash(`${seed}:${b.id}`) % 17);
  });

  const selected: Challenge[] = [];
  const usedIds = new Set<string>();
  for (const challenge of ranked) {
    if (selected.length >= 3) break;
    if (usedIds.has(challenge.id)) continue;
    if (completedHistory.includes(challenge.id)) continue;
    usedIds.add(challenge.id);
    selected.push(challenge);
  }

  if (selected.length < 3) {
    const fallback = challengeCatalog.filter((challenge) => !selected.some((item) => item.id === challenge.id));
    for (const challenge of fallback) {
      if (selected.length >= 3) break;
      if (usedIds.has(challenge.id)) continue;
      selected.push(challenge);
    }
  }

  return selected.slice(0, 3);
}

export function calculateChallengeStreak(
  completions: readonly ChallengeCompletion[],
  todayDate: string,
): number {
  if (completions.length === 0) {
    return 0;
  }

  const uniqueDates = Array.from(
    new Set(completions.map((completion) => completion.date)),
  ).sort((a, b) => b.localeCompare(a));

  let streak = 0;
  let cursor = new Date(`${todayDate}T00:00:00Z`);

  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (!uniqueDates.includes(iso)) {
      break;
    }
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }

  return streak;
}

export const challengeIds = challengeCatalog.map((challenge) => challenge.id);
