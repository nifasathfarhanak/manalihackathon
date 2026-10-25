"use client";

import React from "react";
import { ContractComparisonTable } from "../../components/ContractComparisonTable";
import { PurityConverter } from "../../components/PurityConverter";
import { Scale, ShieldCheck, MapPin, Award, Layers } from "lucide-react";

export default function ContractsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E1D5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-400/50 shadow-xs">
              OFFICIAL MCX ARCHITECTURE
            </span>
            <span className="text-xs text-slate-500 font-medium">SEBI Regulated Commodity Contracts</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            MCX Gold Specifications & Purity Normalization
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Standardization rules across differing quotation units (10g, 8g, 1g) and purity fineness (995 vs 999) into the
            Indian benchmark ₹ per 10 grams @ 995 purity.
          </p>
        </div>
      </div>

      {/* Contract Specifications Table */}
      <ContractComparisonTable />

      {/* Interactive Purity & Weight Converter */}
      <PurityConverter />

      {/* Institutional Explanatory Guide */}
      <div className="card-gradient rounded-xl border border-[#E8E1D5] bg-white/95 p-5 space-y-4 text-xs shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-600" />
          Normalization Methodology & Mathematical Proof
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] leading-relaxed text-slate-600">
          <div className="p-3.5 rounded-lg bg-amber-50/40 border border-[#E8E1D5] shadow-2xs">
            <span className="font-bold text-amber-800 block mb-1">1. Quotation Unit Normalization</span>
            <p className="text-slate-600">
              MCX GOLD and GOLDM quote directly in ₹ per 10 grams. However, GOLDGUINEA quotes per 8 grams (1 sovereign),
              requiring factor <code className="text-slate-900 font-mono bg-white px-1.5 py-0.5 rounded border border-[#E8E1D5]">10 / 8 = 1.25</code>. GOLDPETAL quotes per 1 gram, requiring
              factor <code className="text-slate-900 font-mono bg-white px-1.5 py-0.5 rounded border border-[#E8E1D5]">10 / 1 = 10.0</code>.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50/40 border border-[#E8E1D5] shadow-2xs">
            <span className="font-bold text-amber-800 block mb-1">2. Purity Fineness Adjustment</span>
            <p className="text-slate-600">
              The benchmark trades on 995 fineness (99.5% pure gold). <strong>GOLDTEN</strong>, GOLDGUINEA, and GOLDPETAL
              are minted at 999 fineness (24K pure). Their prices are deflated by factor{" "}
              <code className="text-slate-900 font-mono bg-white px-1.5 py-0.5 rounded border border-[#E8E1D5]">995 / 999 = 0.995996</code> before relative-value comparison.
              GOLDTEN uniquely shares the same ₹/10g quotation as GOLDM, making it the purest purity-basis pair.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50/40 border border-[#E8E1D5] shadow-2xs">
            <span className="font-bold text-amber-800 block mb-1">3. Compulsory Delivery Basis</span>
            <p className="text-slate-600">
              All MCX Gold contracts specify compulsory physical delivery upon contract maturity. Delivery centers are located
              at designated vaults in Ahmedabad and Mumbai, with price basis ex-Ahmedabad (inclusive of GST where applicable).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
