"use client";

import { useState } from "react";

export interface StateLeaderboardItem {
  readonly rank: number;
  readonly stateCode: string;
  readonly stateName: string;
  readonly region: string;
  readonly totalMwhSaved: number;
  readonly activeHouseholds: number;
  readonly peakKwShaved: number;
  readonly solarCapacityKw: number;
  readonly topDistricts: readonly { name: string; mwhSaved: number; households: number }[];
  readonly featuredCommunities: readonly string[];
}

interface StateDirectoryEntry {
  readonly stateCode: string;
  readonly stateName: string;
  readonly region: string;
  readonly kind: "State" | "Union Territory";
}

export const INDIA_STATE_DIRECTORY: readonly StateDirectoryEntry[] = [
  { stateCode: "AP", stateName: "Andhra Pradesh", region: "South", kind: "State" },
  { stateCode: "AR", stateName: "Arunachal Pradesh", region: "North-East", kind: "State" },
  { stateCode: "AS", stateName: "Assam", region: "North-East", kind: "State" },
  { stateCode: "BR", stateName: "Bihar", region: "East", kind: "State" },
  { stateCode: "CG", stateName: "Chhattisgarh", region: "Central", kind: "State" },
  { stateCode: "GA", stateName: "Goa", region: "West", kind: "State" },
  { stateCode: "GJ", stateName: "Gujarat", region: "West", kind: "State" },
  { stateCode: "HR", stateName: "Haryana", region: "North", kind: "State" },
  { stateCode: "HP", stateName: "Himachal Pradesh", region: "North", kind: "State" },
  { stateCode: "JH", stateName: "Jharkhand", region: "East", kind: "State" },
  { stateCode: "KA", stateName: "Karnataka", region: "South", kind: "State" },
  { stateCode: "KL", stateName: "Kerala", region: "South", kind: "State" },
  { stateCode: "MP", stateName: "Madhya Pradesh", region: "Central", kind: "State" },
  { stateCode: "MH", stateName: "Maharashtra", region: "West", kind: "State" },
  { stateCode: "MN", stateName: "Manipur", region: "North-East", kind: "State" },
  { stateCode: "ML", stateName: "Meghalaya", region: "North-East", kind: "State" },
  { stateCode: "MZ", stateName: "Mizoram", region: "North-East", kind: "State" },
  { stateCode: "NL", stateName: "Nagaland", region: "North-East", kind: "State" },
  { stateCode: "OD", stateName: "Odisha", region: "East", kind: "State" },
  { stateCode: "PB", stateName: "Punjab", region: "North", kind: "State" },
  { stateCode: "RJ", stateName: "Rajasthan", region: "North", kind: "State" },
  { stateCode: "SK", stateName: "Sikkim", region: "North-East", kind: "State" },
  { stateCode: "TN", stateName: "Tamil Nadu", region: "South", kind: "State" },
  { stateCode: "TS", stateName: "Telangana", region: "South", kind: "State" },
  { stateCode: "TR", stateName: "Tripura", region: "North-East", kind: "State" },
  { stateCode: "UP", stateName: "Uttar Pradesh", region: "North", kind: "State" },
  { stateCode: "UK", stateName: "Uttarakhand", region: "North", kind: "State" },
  { stateCode: "WB", stateName: "West Bengal", region: "East", kind: "State" },
  { stateCode: "AN", stateName: "Andaman and Nicobar Islands", region: "South", kind: "Union Territory" },
  { stateCode: "CH", stateName: "Chandigarh", region: "North", kind: "Union Territory" },
  { stateCode: "DNDD", stateName: "Dadra and Nagar Haveli and Daman and Diu", region: "West", kind: "Union Territory" },
  { stateCode: "DL", stateName: "Delhi", region: "North", kind: "Union Territory" },
  { stateCode: "JK", stateName: "Jammu and Kashmir", region: "North", kind: "Union Territory" },
  { stateCode: "LA", stateName: "Ladakh", region: "North", kind: "Union Territory" },
  { stateCode: "LD", stateName: "Lakshadweep", region: "South", kind: "Union Territory" },
  { stateCode: "PY", stateName: "Puducherry", region: "South", kind: "Union Territory" },
];

// These values are illustrative placeholders, not measured or official state data.
export const PAN_INDIA_LEADERBOARD: readonly StateLeaderboardItem[] = [
  {
    rank: 1,
    stateCode: "KA",
    stateName: "Karnataka",
    region: "South",
    totalMwhSaved: 482.5,
    activeHouseholds: 12450,
    peakKwShaved: 890,
    solarCapacityKw: 4200,
    topDistricts: [
      { name: "Bengaluru Urban", mwhSaved: 260.4, households: 6800 },
      { name: "Mysuru", mwhSaved: 112.1, households: 3100 },
      { name: "Hubballi-Dharwad", mwhSaved: 74.0, households: 1850 },
    ],
    featuredCommunities: ["Indiranagar Green Society", "IISc Bangalore Green Campus", "Whitefield Eco Enclave"],
  },
  {
    rank: 2,
    stateCode: "GJ",
    stateName: "Gujarat",
    region: "West",
    totalMwhSaved: 461.2,
    activeHouseholds: 11800,
    peakKwShaved: 840,
    solarCapacityKw: 5100,
    topDistricts: [
      { name: "Surat", mwhSaved: 185.0, households: 4900 },
      { name: "Ahmedabad", mwhSaved: 172.5, households: 4500 },
      { name: "Vadodara", mwhSaved: 68.2, households: 1600 },
    ],
    featuredCommunities: ["Surat Diamond City Residents", "IIT Gandhinagar Sustainable Campus", "Navrangpura Solar Hub"],
  },
  {
    rank: 3,
    stateCode: "MH",
    stateName: "Maharashtra",
    region: "West",
    totalMwhSaved: 435.8,
    activeHouseholds: 14200,
    peakKwShaved: 920,
    solarCapacityKw: 4600,
    topDistricts: [
      { name: "Pune", mwhSaved: 198.4, households: 5800 },
      { name: "Mumbai Suburban", mwhSaved: 154.2, households: 6100 },
      { name: "Nagpur", mwhSaved: 54.0, households: 1400 },
    ],
    featuredCommunities: ["Kothrud Eco Heights", "Powai Lakeside Greens", "Bandra Net-Zero Co-op"],
  },
  {
    rank: 4,
    stateCode: "DL",
    stateName: "Delhi NCR",
    region: "North",
    totalMwhSaved: 389.0,
    activeHouseholds: 9800,
    peakKwShaved: 760,
    solarCapacityKw: 3400,
    topDistricts: [
      { name: "South Delhi", mwhSaved: 162.0, households: 4100 },
      { name: "Dwarka", mwhSaved: 128.5, households: 3300 },
      { name: "Rohini", mwhSaved: 72.0, households: 1800 },
    ],
    featuredCommunities: ["Dwarka Sector 12 Solar Society", "IIT Delhi Nilgiri Hostel", "Saket Green Vihar"],
  },
  {
    rank: 5,
    stateCode: "TN",
    stateName: "Tamil Nadu",
    region: "South",
    totalMwhSaved: 362.4,
    activeHouseholds: 9200,
    peakKwShaved: 690,
    solarCapacityKw: 3800,
    topDistricts: [
      { name: "Chennai", mwhSaved: 184.2, households: 4900 },
      { name: "Coimbatore", mwhSaved: 110.0, households: 2800 },
      { name: "Madurai", mwhSaved: 45.2, households: 1100 },
    ],
    featuredCommunities: ["Adyar Coastal Greens", "Anna University Eco Wing", "RS Puram Coimbatore"],
  },
  {
    rank: 6,
    stateCode: "UP",
    stateName: "Uttar Pradesh",
    region: "North",
    totalMwhSaved: 310.8,
    activeHouseholds: 8600,
    peakKwShaved: 580,
    solarCapacityKw: 2900,
    topDistricts: [
      { name: "Noida / Gautam Buddha Nagar", mwhSaved: 145.0, households: 3900 },
      { name: "Lucknow", mwhSaved: 98.4, households: 2800 },
      { name: "Kanpur", mwhSaved: 42.0, households: 1200 },
    ],
    featuredCommunities: ["Noida Sector 78 Clean Power", "Gomti Nagar Green Avenues", "IIT Kanpur Pioneer Hall"],
  },
  {
    rank: 7,
    stateCode: "WB",
    stateName: "West Bengal",
    region: "East",
    totalMwhSaved: 275.6,
    activeHouseholds: 7100,
    peakKwShaved: 490,
    solarCapacityKw: 2200,
    topDistricts: [
      { name: "Kolkata", mwhSaved: 162.0, households: 4200 },
      { name: "Howrah", mwhSaved: 68.0, households: 1800 },
      { name: "North 24 Parganas", mwhSaved: 32.0, households: 850 },
    ],
    featuredCommunities: ["Salt Lake Eco Block", "New Town Smart Residency", "Jadavpur Campus"],
  },
];

export function IndiaMapLeaderboard() {
  const [selectedStateCode, setSelectedStateCode] = useState<string>("KA");

  const selectedState = INDIA_STATE_DIRECTORY.find(
    (state) => state.stateCode === selectedStateCode
  )!;
  const currentState = PAN_INDIA_LEADERBOARD.find(
    (state) => state.stateCode === selectedStateCode
  );
  const illustrativeNationalTotal = PAN_INDIA_LEADERBOARD.reduce(
    (total, state) => total + state.totalMwhSaved,
    0
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            🇮🇳 India State & UT Explorer
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Browse all 28 states and 8 union territories. State-level measured reports are not connected yet.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/60">
          <span className="text-zinc-400">Coverage:</span>
          <span className="font-extrabold text-emerald-400">{INDIA_STATE_DIRECTORY.length} states & UTs</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* State and UT directory */}
        <div className="lg:col-span-5 space-y-2">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            State & Union Territory directory
          </div>

          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {INDIA_STATE_DIRECTORY.map((item) => {
              const isSelected = item.stateCode === selectedStateCode;
              const sample = PAN_INDIA_LEADERBOARD.find(
                (state) => state.stateCode === item.stateCode
              );
              return (
                <button
                  key={item.stateCode}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedStateCode(item.stateCode)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                      : "bg-zinc-800/40 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 shrink-0 rounded bg-zinc-950 px-1.5 py-1 text-center text-[10px] font-mono font-bold text-zinc-300">
                      {item.stateCode}
                    </span>
                    <div>
                      <div className="font-bold text-sm leading-tight">{item.stateName}</div>
                      <div className="mt-1 text-[11px] text-zinc-400">
                        {item.kind} · {item.region}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {sample ? (
                      <>
                        <div className="text-[10px] font-bold text-amber-300">Example #{sample.rank}</div>
                        <div className="text-[10px] text-zinc-500">illustrative</div>
                      </>
                    ) : (
                      <div className="text-[10px] text-zinc-500">No report</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected region information */}
        <div className="lg:col-span-7 bg-zinc-800/40 border border-zinc-700/60 rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-700/60 pb-3">
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                {selectedState.kind} · {selectedState.region} region
              </span>
              <h4 className="text-xl font-extrabold text-white">{selectedState.stateName}</h4>
            </div>
            <span className="rounded-full border border-zinc-600 bg-zinc-900 px-3 py-1 text-xs font-bold text-zinc-300">
              {selectedState.stateCode}
            </span>
          </div>

          {currentState ? (
            <>
              <p className="mt-4 border border-amber-400/40 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-100">
                Illustrative demo figures only. These values are not live, measured, or official state statistics and must not be used for policy or performance comparisons.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mt-4">
                <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 uppercase">Example energy saved</div>
                  <div className="text-base font-extrabold text-emerald-400">{currentState.totalMwhSaved} MWh</div>
                </div>
                <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 uppercase">Example households</div>
                  <div className="text-base font-bold text-white">{currentState.activeHouseholds.toLocaleString("en-IN")}</div>
                </div>
                <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 uppercase">Example solar capacity</div>
                  <div className="text-base font-bold text-blue-400">{currentState.solarCapacityKw.toLocaleString("en-IN")} kW</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Example district breakdown
                </div>
                <div className="space-y-1.5">
                  {currentState.topDistricts.map((district) => (
                    <div key={district.name} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-zinc-900/60 text-xs border border-zinc-800/80">
                      <span className="font-medium text-zinc-200">{district.name}</span>
                      <span className="font-mono font-bold text-emerald-400">{district.mwhSaved} MWh</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-3 text-[11px] text-zinc-400">
                Demo national total: {illustrativeNationalTotal.toLocaleString("en-IN", { maximumFractionDigits: 1 })} MWh · illustrative only.
              </p>
            </>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-zinc-600 bg-zinc-900/50 p-6 text-center">
              <p className="font-bold text-white">No state-level report is connected yet.</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Verified energy saved, participating households, community drilldowns, and solar capacity will appear here when state-attributed data is available.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
