"use client";

import { useMemo, useState } from "react";
import { STATE_DISCOM_REGISTRY, calculateStateBill } from "@/domain/nationalTariff";

const SAMPLE_KWH_OPTIONS = [100, 200, 300, 500, 750] as const;
type SampleKwh = (typeof SAMPLE_KWH_OPTIONS)[number];

interface TariffRow {
  code: string;
  name: string;
  discom: string;
  bill: number;
  perUnit: number;
  slabs: number;
}

function computeRows(kwh: number): TariffRow[] {
  return STATE_DISCOM_REGISTRY.map((s) => {
    const discom = s.discoms.find((d) => d.id === s.defaultDiscomId) ?? s.discoms[0];
    const result = calculateStateBill(kwh, s.code, discom.id);

    return {
      code: s.code,
      name: s.name,
      discom: discom.shortName,
      bill: result.totalBillInr,
      perUnit: kwh > 0 ? result.totalBillInr / kwh : 0,
      slabs: discom.slabs.length,
    };
  }).sort((a, b) => a.bill - b.bill);
}

export function NationalTariffComparisonTable() {
  const [kwh, setKwh] = useState<SampleKwh>(300);
  const [search, setSearch] = useState("");

  const rows = useMemo(() => computeRows(kwh), [kwh]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.discom.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)) : rows;
  }, [rows, search]);

  const minBill = rows[0]?.bill ?? 0;
  const maxBill = rows[rows.length - 1]?.bill ?? 1;

  const barColor = (bill: number) => {
    const pct = (bill - minBill) / (maxBill - minBill + 0.01);
    if (pct < 0.33) return "bg-emerald-500";
    if (pct < 0.66) return "bg-amber-400";
    return "bg-red-500";
  };

  return (
    <div className="bg-zinc-950 border-2 border-zinc-700 rounded-2xl p-5 sm:p-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Pan-India · CEA / DISCOM Aligned</div>
          <h3 className="text-lg font-black">National Electricity Tariff Comparison</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Monthly bill across all States & UTs for selected consumption</p>
        </div>

        {/* kWh selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {SAMPLE_KWH_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setKwh(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                kwh === opt
                  ? "bg-emerald-500 border-emerald-500 text-zinc-950"
                  : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {opt} kWh
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter by state, DISCOM or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Cheapest third</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Mid range</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Most expensive</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-zinc-900 border-b border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <th className="px-3 py-2.5">Rank</th>
              <th className="px-3 py-2.5">State / UT</th>
              <th className="px-3 py-2.5 hidden sm:table-cell">DISCOM</th>
              <th className="px-3 py-2.5">Bill (₹)</th>
              <th className="px-3 py-2.5 hidden md:table-cell">₹/kWh</th>
              <th className="px-3 py-2.5 hidden lg:table-cell">Cost bar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => {
              const globalRank = rows.findIndex((r) => r.code === row.code) + 1;
              const barW = Math.round(((row.bill - minBill) / (maxBill - minBill + 0.01)) * 100);
              return (
                <tr
                  key={row.code}
                  className={`border-b border-zinc-800/60 transition-colors hover:bg-zinc-900/50 ${
                    i === 0 && !search ? "bg-emerald-500/5" : ""
                  }`}
                >
                  <td className="px-3 py-2.5 font-black text-zinc-500">
                    #{globalRank}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-bold text-white">{row.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{row.code}</div>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-400 hidden sm:table-cell">{row.discom}</td>
                  <td className="px-3 py-2.5">
                    <span className={`font-black ${barColor(row.bill).replace("bg-", "text-")}`}>
                      ₹{row.bill.toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-300 font-semibold hidden md:table-cell">
                    ₹{row.perUnit.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 hidden lg:table-cell">
                    <div className="w-28 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor(row.bill)} transition-all duration-500`}
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-xs">No states match your search.</div>
        )}
      </div>

      <p className="mt-3 text-[10px] text-zinc-600">
        Domestic residential slab tariffs · Fixed charges included · Based on CEA/DISCOM gazette data · {rows.length} States & UTs
      </p>
    </div>
  );
}

