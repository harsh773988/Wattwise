import { describe, expect, it } from "vitest";
import {
  getTranslations,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
} from "../../src/domain/i18n";

describe("i18n domain module", () => {
  it("supports all major Indian linguistic regions", () => {
    expect(SUPPORTED_LANGUAGES.length).toBe(6);
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(["en", "hi", "gu", "mr", "kn", "ta"]);
  });

  it("contains complete translation dictionaries for all supported languages", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const dict = getTranslations(lang.code);
      expect(dict.slogan).toBeTruthy();
      expect(dict.dashboard).toBeTruthy();
      expect(dict.challenges).toBeTruthy();
      expect(dict.community).toBeTruthy();
      expect(dict.solar).toBeTruthy();
      expect(dict.scanBill).toBeTruthy();
      expect(dict.missionLifePillars).toBeTruthy();
    }
  });

  it("falls back to English for unknown language code", () => {
    // @ts-expect-error testing fallback
    const fallback = getTranslations("unknown_lang");
    expect(fallback).toBe(TRANSLATIONS.en);
  });
});

