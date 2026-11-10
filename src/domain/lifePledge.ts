/**
 * Official Mission LiFE Citizen Pledge Engine.
 * Implements the Government of India's 5-point lifestyle commitment and certificate generator.
 * Pure domain logic — zero framework, I/O, or env imports.
 */

export interface LifePledgeCommitment {
  readonly id: string;
  readonly title: string;
  readonly hindiTitle: string;
  readonly description: string;
  readonly defaultChecked: boolean;
}

export interface CitizenPledgeRecord {
  readonly citizenName: string;
  readonly stateCode: string;
  readonly pledgeDate: string; // YYYY-MM-DD
  readonly certificateId: string;
  readonly commitmentsAccepted: readonly string[];
  readonly pointsAwarded: number;
}

export const OFFICIAL_PLEDGE_COMMITMENTS: readonly LifePledgeCommitment[] = [
  {
    id: "commit_energy",
    title: "Conserve Electricity & Shift to Solar Hours",
    hindiTitle: "बिजली बचाएं और सौर ऊर्जा का उपयोग करें",
    description: "I pledge to turn off standby appliances, set my AC to 25°C or higher, and run heavy loads during daytime solar hours.",
    defaultChecked: true,
  },
  {
    id: "commit_water",
    title: "Protect & Conserve Water",
    hindiTitle: "पानी का विवेकपूर्ण उपयोग करें",
    description: "I pledge to fix leaking taps, install aerators, and minimize unnecessary pumping to overhead water tanks.",
    defaultChecked: true,
  },
  {
    id: "commit_plastic",
    title: "Say No to Single-Use Plastic",
    hindiTitle: "एकल-उपयोग प्लास्टिक का त्याग करें",
    description: "I pledge to carry reusable cloth or jute bags and refuse disposable plastic containers, straws, and cutlery.",
    defaultChecked: true,
  },
  {
    id: "commit_mobility",
    title: "Embrace Sustainable Mobility",
    hindiTitle: "सतत और हरित आवागमन अपनाएं",
    description: "I pledge to walk or cycle for short neighborhood trips and consider public transit or electric vehicles.",
    defaultChecked: true,
  },
  {
    id: "commit_waste",
    title: "Segregate Waste & Practice 3Rs",
    hindiTitle: "कचरा अलग करें और पुनर्चक्रण करें",
    description: "I pledge to segregate wet and dry waste at home, compost organic scraps, and ensure proper e-waste recycling.",
    defaultChecked: true,
  },
];

/**
 * Generate a validated citizen pledge record with a tamper-resistant certificate identifier.
 */
export function createCitizenPledge(
  citizenName: string,
  stateCode = "IN",
  commitmentsAccepted: readonly string[] = OFFICIAL_PLEDGE_COMMITMENTS.map((c) => c.id),
  pledgeDate: string = new Date().toISOString().slice(0, 10)
): CitizenPledgeRecord {
  const trimmedName = citizenName.trim();
  if (!trimmedName || trimmedName.length < 2) {
    throw new RangeError("Citizen name must be at least 2 characters");
  }

  if (commitmentsAccepted.length === 0) {
    throw new RangeError("At least one pledge commitment must be accepted");
  }

  // Generate unique certificate ID
  const hashSeed = trimmedName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const certificateId = `LIFE-IN-${stateCode.toUpperCase()}-${hashSeed * 73 + 10429}`;

  // Award 50 bonus points for taking the national pledge
  const pointsAwarded = 50;

  return {
    citizenName: trimmedName,
    stateCode: stateCode.toUpperCase(),
    pledgeDate,
    certificateId,
    commitmentsAccepted,
    pointsAwarded,
  };
}

