"use client";

import React from "react";
import { MCXContract } from "../types";
import { MCX_GOLD_SPECS } from "../lib/quant/specs";
import { GoldNormalizer } from "../lib/quant/normalizer";
import { Scale, CheckCircle, Shield, Award } from "lucide-react";

export const ContractComparisonTable: React.FC = () => {
  const contracts = Object.values(MCX_GOLD_SPECS);

  return (
    <div className="card-gradient rounded-xl border border-[#E8E1D5] bg-white/95 p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E1D5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">Official MCX Gold Contract Specifications Matrix</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quotation units, purity fineness, lot multipliers, and delivery parameters across all contracts
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 border border-amber-300 text-xs text-amber-900 font-semibold shadow-2xs">
          <Award className="h-4 w-4 text-amber-600" />
          <span>Standardized Benchmark: ₹ per 10g @ 995 Purity</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E8E1D5] text-slate-600 font-semibold bg-amber-50/70">
              <th className="py-3 px-4">Contract Symbol</th>
              <th className="py-3 px-4">Trading Unit</th>
              <th className="py-3 px-4">Quotation Unit</th>
              <th className="py-3 px-4">Purity Fineness</th>
              <th className="py-3 px-4">Lot Multiplier</th>
              <th className="py-3 px-4">Tick Size</th>
              <th className="py-3 px-4">Tender Window</th>
              <th className="py-3 px-4">Delivery Form</th>
              <th className="py-3 px-4">Norm. Factor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E1D5]">
            {contracts.map((c) => {
              const normFactor = GoldNormalizer.getNormalizationFactor(c.symbol);
              return (
                <tr key={c.symbol} className="hover:bg-amber-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-amber-800">{c.symbol}</span>
                      <span className="text-[11px] text-slate-500 font-normal">({c.name})</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{c.trading_unit_desc}</td>
                  <td className="py-3.5 px-4 font-mono text-amber-900 font-bold">{c.quotation_unit_desc}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                        c.purity_fineness === 999
                          ? "bg-cyan-50 text-cyan-800 border-cyan-300"
                          : "bg-amber-50 text-amber-900 border-amber-300"
                      }`}
                    >
                      {c.purity_fineness} ({c.purity_karat.slice(0, 5)})
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-800">
                    {c.lot_multiplier}x{" "}
                    <span className="text-[10px] text-slate-500">(₹{c.lot_multiplier}/point)</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">₹{c.tick_size.toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-amber-800 font-bold">{c.tender_period_days} Days</td>
                  <td className="py-3.5 px-4 text-slate-700">{c.delivery_unit}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                    {normFactor.toFixed(4)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-slate-600 bg-amber-50/50 p-3 rounded-lg border border-[#E8E1D5] flex items-center justify-between gap-3">
        <span>
          <strong>GOLDTEN</strong>, <strong>GOLDGUINEA</strong>, and <strong>GOLDPETAL</strong> are all 999 fineness. Prices normalized to 995 benchmark via factor{" "}
          <code className="text-amber-900 font-semibold bg-white px-1 py-0.5 rounded border border-amber-200">995 / 999 = 0.995996</code>.
          GOLDTEN expires 27th–31st (vs GOLDM: 3rd–5th). Note: GOLDTEN listed from 2025 onward — shorter history.
        </span>
        <span className="text-slate-800 font-semibold whitespace-nowrap">Delivery Center: Ahmedabad / Mumbai Basis</span>
      </div>
    </div>
  );
};
