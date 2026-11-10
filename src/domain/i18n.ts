/**
 * Pan-India Bhasha & Multi-Language Support Engine.
 * Aligned with National Mission LiFE accessibility across Indian linguistic states.
 * Pure domain logic — zero framework, I/O, or env imports.
 */

export type SupportedLanguage = "en" | "hi" | "gu" | "mr" | "kn" | "ta";

export interface LanguageInfo {
  readonly code: SupportedLanguage;
  readonly name: string;
  readonly nativeName: string;
  readonly region: string;
}

export const SUPPORTED_LANGUAGES: readonly LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", region: "Pan-India" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", region: "North / Central" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", region: "Gujarat" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", region: "Maharashtra" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", region: "Karnataka" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", region: "Tamil Nadu" },
];

export interface TranslationDictionary {
  readonly slogan: string;
  readonly dashboard: string;
  readonly challenges: string;
  readonly community: string;
  readonly solar: string;
  readonly admin: string;
  readonly scanBill: string;
  readonly greenPassport: string;
  readonly solarHours: string;
  readonly peakHours: string;
  readonly missionLifePillars: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    slogan: "Know where your power goes",
    dashboard: "Dashboard",
    challenges: "Challenges",
    community: "Community",
    solar: "Solar Planner",
    admin: "Admin",
    scanBill: "Scan Indian Bill",
    greenPassport: "Green Passport",
    solarHours: "Green Solar Hours",
    peakHours: "Evening Grid Peak",
    missionLifePillars: "7 Mission LiFE Pillars",
  },
  hi: {
    slogan: "जानिए आपकी बिजली कहाँ खर्च होती है",
    dashboard: "डैशबोर्ड",
    challenges: "दैनिक चुनौतियां",
    community: "समुदाय",
    solar: "सोलर योजना",
    admin: "प्रशासन",
    scanBill: "बिजली बिल स्कैन करें",
    greenPassport: "ग्रीन पासपोर्ट",
    solarHours: "हरित सौर घंटे",
    peakHours: "शाम का पीक लोड",
    missionLifePillars: "मिशन लाइफ के 7 स्तंभ",
  },
  gu: {
    slogan: "જાણો તમારી વીજળી ક્યાં વપરાય છે",
    dashboard: "ડેશબોર્ડ",
    challenges: "દૈનિક પડકારો",
    community: "સમુદાય",
    solar: "સોલર પ્લાનર",
    admin: "એડમિન",
    scanBill: "વીજળી બિલ સ્કેન કરો",
    greenPassport: "ગ્રીન પાસપોર્ટ",
    solarHours: "ગ્રીન સોલર કલાકો",
    peakHours: "સાંજનો પીક લોડ",
    missionLifePillars: "મિશન લાઈફના 7 સ્તંભ",
  },
  mr: {
    slogan: "जाणून घ्या तुमची वीज कुठे वापरली जाते",
    dashboard: "डॅशबोर्ड",
    challenges: "दैनिक आव्हाने",
    community: "समुदाय",
    solar: "सौर योजना",
    admin: "प्रशासन",
    scanBill: "वीज बिल स्कॅन करा",
    greenPassport: "ग्रीन पासपोर्ट",
    solarHours: "हरित सौर तास",
    peakHours: "संध्याकाळचा पीक लोड",
    missionLifePillars: "मिशन लाइफचे ७ स्तंभ",
  },
  kn: {
    slogan: "ನಿಮ್ಮ ವಿದ್ಯುತ್ ಎಲ್ಲಿ ಬಳಕೆಯಾಗುತ್ತದೆ ಎಂದು ತಿಳಿಯಿರಿ",
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    challenges: "ದೈನಂದಿನ ಸವಾಲುಗಳು",
    community: "ಸಮುದಾಯ",
    solar: "ಸೌರ ಯೋಜನೆ",
    admin: "ಆಡಳಿತ",
    scanBill: "ವಿದ್ಯುತ್ ಬಿಲ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
    greenPassport: "ಹಸಿರು ಪಾಸ್‌ಪೋರ್ಟ್",
    solarHours: "ಹಸಿರು ಸೌರ ಗಂಟೆಗಳು",
    peakHours: "ಸಂಜೆಯ ಗರಿಷ್ಠ ಹೊರೆ",
    missionLifePillars: "ಮಿಷನ್ ಲೈಫ್‌ನ 7 ಸ್ತಂಭಗಳು",
  },
  ta: {
    slogan: "உங்கள் மின்சாரம் எங்கு செலவாகிறது என்பதை அறிந்து கொள்ளுங்கள்",
    dashboard: "டாஷ்போர்டு",
    challenges: "தினசரி சவால்கள்",
    community: "சமூகம்",
    solar: "சூரிய சக்தி திட்டம்",
    admin: "நிர்வாகம்",
    scanBill: "மின் கட்டணத்தை ஸ்கேன் செய்க",
    greenPassport: "கிரீன் பாஸ்போர்ட்",
    solarHours: "பச்சை சூரிய நேரங்கள்",
    peakHours: "மாலை உச்ச சுமை",
    missionLifePillars: "மிஷன் லைஃப் 7 தூண்கள்",
  },
};

/**
 * Retrieve translation dictionary for a supported language code.
 */
export function getTranslations(lang: SupportedLanguage = "en"): TranslationDictionary {
  return TRANSLATIONS[lang] ?? TRANSLATIONS.en;
}

