import { describe, expect, it } from "vitest";
import {
  calculateNationalQuestAward,
  calculatePassportTier,
  getLifeStreakMultiplier,
  LIFE_STREAK_MULTIPLIER_CAP,
  MISSION_LIFE_THEMES,
  NATIONAL_DAILY_VERIFIED_POINTS_CAP,
  NATIONAL_QUESTS_CATALOG,
} from "../../src/domain/nationalLifeQuests";

describe("nationalLifeQuests domain module", () => {
  it("includes all 7 official Mission LiFE themes", () => {
    expect(MISSION_LIFE_THEMES.length).toBe(7);
    const ids = MISSION_LIFE_THEMES.map((t) => t.id);
    expect(ids).toEqual([
      "energy",
      "water",
      "plastic",
      "food",
      "waste",
      "lifestyle",
      "ewaste",
    ]);
  });

  it("provides quests for multiple themes with valid points and verification types", () => {
    expect(NATIONAL_QUESTS_CATALOG.length).toBeGreaterThanOrEqual(9);
    expect(new Set(NATIONAL_QUESTS_CATALOG.map((quest) => quest.pillar))).toEqual(
      new Set(MISSION_LIFE_THEMES.map((theme) => theme.id))
    );
    for (const quest of NATIONAL_QUESTS_CATALOG) {
      expect(quest.points).toBeGreaterThan(0);
      expect(quest.estimatedCo2SavingKg).toBeGreaterThan(0);
      expect(quest.evidenceTypes.length).toBeGreaterThan(0);
      expect(["self_report", "photo_evidence", "meter_reading"]).toContain(
        quest.verificationType
      );
    }
    expect(
      NATIONAL_QUESTS_CATALOG.flatMap((quest) => quest.evidenceTypes)
    ).toEqual(expect.arrayContaining(["photo", "meter_check", "receipt"]));
  });

  it("calculates streak multipliers with a 1.5x ceiling", () => {
    expect(getLifeStreakMultiplier(0)).toBe(1);
    expect(getLifeStreakMultiplier(1)).toBeCloseTo(1.1);
    expect(getLifeStreakMultiplier(5)).toBe(LIFE_STREAK_MULTIPLIER_CAP);
    expect(getLifeStreakMultiplier(10)).toBe(LIFE_STREAK_MULTIPLIER_CAP);
    expect(() => getLifeStreakMultiplier(-1)).toThrow(RangeError);
    expect(() => getLifeStreakMultiplier(1.5)).toThrow(RangeError);
  });

  it("applies verified evidence, streak bonuses, and the daily points cap", () => {
    const quest = NATIONAL_QUESTS_CATALOG.find(
      (item) => item.id === "quest_ac_25c"
    )!;
    const award = calculateNationalQuestAward(quest, "photo", 1, 0);
    expect(award.basePoints).toBe(25);
    expect(award.streakMultiplier).toBeCloseTo(1.1);
    expect(award.pointsAwarded).toBe(27);
    expect(award.dailyPointsRemaining).toBe(73);

    const solarQuest = NATIONAL_QUESTS_CATALOG.find(
      (item) => item.id === "quest_solar_hour_shift"
    )!;
    expect(
      calculateNationalQuestAward(solarQuest, "meter_check", 0, 0).pointsAwarded
    ).toBe(40);

    const foodQuest = NATIONAL_QUESTS_CATALOG.find(
      (item) => item.id === "quest_local_seasonal_meal"
    )!;
    expect(
      calculateNationalQuestAward(foodQuest, "receipt", 0, 0).pointsAwarded
    ).toBe(30);

    const cappedAward = calculateNationalQuestAward(
      quest,
      "photo",
      5,
      NATIONAL_DAILY_VERIFIED_POINTS_CAP - 2
    );
    expect(cappedAward.pointsAwarded).toBe(2);
    expect(cappedAward.dailyPointsRemaining).toBe(0);

    const noRemainingAward = calculateNationalQuestAward(
      quest,
      "photo",
      5,
      NATIONAL_DAILY_VERIFIED_POINTS_CAP
    );
    expect(noRemainingAward.pointsAwarded).toBe(0);
  });

  it("rejects unsupported evidence and invalid point totals", () => {
    const quest = NATIONAL_QUESTS_CATALOG.find(
      (item) => item.id === "quest_ac_25c"
    )!;
    expect(() =>
      calculateNationalQuestAward(quest, "receipt", 0, 0)
    ).toThrow(RangeError);
    expect(() =>
      calculateNationalQuestAward(quest, "photo", 0, -1)
    ).toThrow(RangeError);
    expect(() =>
      calculateNationalQuestAward({ ...quest, points: 0 }, "photo", 0, 0)
    ).toThrow(RangeError);
  });

  it("calculates passport tier progression accurately", () => {
    const noviceBadge = calculatePassportTier({
      name: "Rohan Sharma",
      stateCode: "MH",
      totalPoints: 50,
      totalKwhSaved: 20,
      totalCo2AvoidedKg: 14.3,
      completedQuestsCount: 2,
    });
    expect(noviceBadge.tier).toBe("Eco Novice");
    expect(noviceBadge.nextTier).toBe("Green Scout");
    expect(noviceBadge.pointsToNextTier).toBe(50);
    expect(noviceBadge.coalAvoidedKg).toBe(13); // 20 * 0.65

    const scoutBadge = calculatePassportTier({
      name: "Meera Rao",
      stateCode: "KA",
      totalPoints: 100,
      totalKwhSaved: 75,
      totalCo2AvoidedKg: 53.7,
      completedQuestsCount: 6,
    });
    expect(scoutBadge.tier).toBe("Green Scout");
    expect(scoutBadge.nextTier).toBe("LiFE Guardian");
    expect(scoutBadge.pointsToNextTier).toBe(150);

    const guardianBadge = calculatePassportTier({
      name: "Priya Patel",
      stateCode: "GJ",
      totalPoints: 320,
      totalKwhSaved: 150,
      totalCo2AvoidedKg: 107.4,
      completedQuestsCount: 12,
    });
    expect(guardianBadge.tier).toBe("LiFE Guardian");
    expect(guardianBadge.nextTier).toBe("Net-Zero Pioneer");
    expect(guardianBadge.pointsToNextTier).toBe(180);

    const pioneerBadge = calculatePassportTier({
      name: "Anita Iyer",
      stateCode: "KA",
      totalPoints: 650,
      totalKwhSaved: 400,
      totalCo2AvoidedKg: 286.4,
      completedQuestsCount: 25,
    });
    expect(pioneerBadge.tier).toBe("Net-Zero Pioneer");
    expect(pioneerBadge.nextTier).toBeNull();
    expect(pioneerBadge.progressPercent).toBe(100);
  });
});
