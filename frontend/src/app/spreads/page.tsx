"use client";

import React, { useState, useEffect } from "react";
import { SpreadChart } from "../../components/SpreadChart";
import { NormalizedPriceChart } from "../../components/NormalizedPriceChart";
import { StorageService } from "../../lib/supabase/service";
import { SpreadEngine } from "../../lib/quant/spreadEngine";
import { AnomalyDetector } from "../../lib/quant/anomalyDetector";
import { SignalEngine } from "../../lib/quant/signals";
import { BhavcopyRecord, CalendarSpreadResult, AnomalyAlert } from "../../types";
import {
  TrendingUp,
  Sliders,
  Scale,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  ArrowRightLeft,
} from "lucide-react";

export default function SpreadsPage() {
  const [marketData, setMarketData] = useState<BhavcopyRecord[]>([]);
  const [selectedPairKey, setSelectedPairKey] = useState<string>("GOLD_APR25-GOLD_JUN25");
  const [repoRate, setRepoRate] = useState<number>(6.5); // %
  const [storageCost, setStorageCost] = useState<number>(0.25); // %
  const [spreadMetrics, setSpreadMetrics] = useState<CalendarSpreadResult | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [spreadChartData, setSpreadChartData] = useState<{ date: string; spread: number; fairValue: number; zScore: number }[]>([]);
  const [priceChartData, setPriceChartData] = useState<{ date: string; p1Norm: number; p2Norm: number }[]>([]);

  useEffect(() => {
    StorageService.getMarketData().then((records) => {
      setMarketData(records);
      calculatePair(records, selectedPairKey, repoRate, storageCost);
    });
  }, []);

  const calculatePair = (
    records: BhavcopyRecord[],
    pairKey: string,
    currentRepo: number,
    currentStorage: number
  ) => {
    let leg1Symbol = "GOLD";
    let leg1Expiry = "2025-04-05";
    let leg2Symbol = "GOLD";
    let leg2Expiry = "2025-06-05";

    if (pairKey === "GOLD_JUN25-GOLD_AUG25") {
      leg1Symbol = "GOLD";
      leg1Expiry = "2025-06-05";
      leg2Symbol = "GOLD";
      leg2Expiry = "2025-08-05";
    } else if (pairKey === "GOLD_AUG25-GOLD_OCT25") {
      leg1Symbol = "GOLD";
      leg1Expiry = "2025-08-05";
      leg2Symbol = "GOLD";
      leg2Expiry = "2025-10-05";
    } else if (pairKey === "GOLD_APR25-GOLDM_APR25") {
      leg1Symbol = "GOLD";
      leg1Expiry = "2025-04-05";
      leg2Symbol = "GOLDM";
      leg2Expiry = "2025-04-05";
    } else if (pairKey === "GOLDM_APR25-GOLDTEN_APR25") {
      leg1Symbol = "GOLDM";
      leg1Expiry = "2025-04-05";
      leg2Symbol = "GOLDTEN";
      leg2Expiry = "2025-04-28";
    } else if (pairKey === "GOLDTEN_APR25-GOLDPETAL_APR25") {
      leg1Symbol = "GOLDTEN";
      leg1Expiry = "2025-04-28";
      leg2Symbol = "GOLDPETAL";
      leg2Expiry = "2025-04-28";
    } else if (pairKey === "GOLD_APR25-GOLDPETAL_APR25") {
      leg1Symbol = "GOLD";
      leg1Expiry = "2025-04-05";
      leg2Symbol = "GOLDPETAL";
      leg2Expiry = "2025-04-28";
    }

    const leg1Bars = records.filter((r) => r.symbol === leg1Symbol && r.expiry_date === leg1Expiry);
    const leg2Bars = records.filter((r) => r.symbol === leg2Symbol && r.expiry_date === leg2Expiry);

    if (leg1Bars.length === 0 || leg2Bars.length === 0) return;

    // Common trading days
    const commonDates = leg1Bars
      .filter((a) => leg2Bars.some((b) => b.trade_date === a.trade_date))
      .map((a) => a.trade_date)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const b1Latest = leg1Bars[leg1Bars.length - 1];
    const b2Latest = leg2Bars[leg2Bars.length - 1];

    const spreadRes = SpreadEngine.calculateSpread(
      b1Latest,
      b2Latest,
      currentRepo / 100.0,
      currentStorage / 100.0,
      0.0
    );

    // Compute historical spread series for chart and rolling z-scores
    const spreadsHistory = commonDates.map((d) => {
      const b1 = leg1Bars.find((r) => r.trade_date === d)!;
      const b2 = leg2Bars.find((r) => r.trade_date === d)!;
      const s = Math.round((b2.normalized_price_10g_995 - b1.normalized_price_10g_995) * 100) / 100;
      return { date: d, spread: s };
    });

    const zSeries = SpreadEngine.computeRollingZScores(spreadsHistory, 20);
    const latestZ = zSeries.length > 0 ? zSeries[zSeries.length - 1].zScore : 0.0;

    const evaluated = SignalEngine.evaluateSignal(spreadRes, latestZ);
    setSpreadMetrics(evaluated);

    // Detect anomalies
    const detected = AnomalyDetector.detectAnomalies(evaluated);
    setAnomalies(detected);

    // Chart series
    const dtYears = Math.max(1, (new Date(leg2Expiry).getTime() - new Date(leg1Expiry).getTime()) / (1000 * 60 * 60 * 24)) / 365.0;
    const carryRateAnnual = (currentRepo + currentStorage) / 100.0;

    const sChart = zSeries.map((z, idx) => {
      const b1 = leg1Bars.find((r) => r.trade_date === z.date)!;
      const fairVal = Math.round(b1.normalized_price_10g_995 * (Math.exp(carryRateAnnual * dtYears) - 1) * 100) / 100;
      return {
        date: z.date,
        spread: z.spread,
        fairValue: fairVal,
        zScore: z.zScore,
      };
    });
    setSpreadChartData(sChart);

    const pChart = commonDates.map((d) => {
      const b1 = leg1Bars.find((r) => r.trade_date === d)!;
      const b2 = leg2Bars.find((r) => r.trade_date === d)!;
      return {
        date: d,
        p1Norm: b1.normalized_price_10g_995,
        p2Norm: b2.normalized_price_10g_995,
      };
    });
    setPriceChartData(pChart);
  };

  const handlePairChange = (key: string) => {
    setSelectedPairKey(key);
    calculatePair(marketData, key, repoRate, storageCost);
  };

  const handleRepoChange = (val: number) => {
    setRepoRate(val);
    calculatePair(marketData, selectedPairKey, val, storageCost);
  };

  const handleStorageChange = (val: number) => {
    setStorageCost(val);
    calculatePair(marketData, selectedPairKey, repoRate, val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E1D5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-400/50 shadow-xs">
              MCX QUANT LAB
            </span>
            <span className="text-xs text-slate-500 font-medium">Institutional Fair-Value Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Relative-Value Spread Analyzer
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Analyze calendar spreads, cross-contract basis, and theoretical cost of carry fair value across all MCX gold expiries.
          </p>
        </div>

        {/* Pair Selector Buttons */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { key: "GOLD_APR25-GOLD_JUN25", label: "GOLD APR-JUN (M1-M2)" },
            { key: "GOLD_JUN25-GOLD_AUG25", label: "GOLD JUN-AUG (M2-M3)" },
            { key: "GOLD_AUG25-GOLD_OCT25", label: "GOLD AUG-OCT (M3-M4)" },
            { key: "GOLD_APR25-GOLDM_APR25", label: "GOLD vs GOLDM (Basis)" },
            { key: "GOLDM_APR25-GOLDTEN_APR25", label: "GOLDM vs GOLDTEN ⚠️" },
            { key: "GOLDTEN_APR25-GOLDPETAL_APR25", label: "GOLDTEN vs PETAL (999)" },
            { key: "GOLD_APR25-GOLDPETAL_APR25", label: "GOLD vs PETAL (Micro)" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => handlePairChange(p.key)}
              className={`rounded-lg px-3 py-1.5 font-semibold border transition-all ${
                selectedPairKey === p.key
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                  : "bg-white text-slate-700 border-[#E8E1D5] hover:bg-amber-50/70 hover:text-slate-900 shadow-xs"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Cost of Carry Sliders */}
      <div className="card-gradient rounded-xl border border-[#E8E1D5] bg-white/95 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E8E1D5] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Cost of Carry Model Parameters</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Model: <code className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">F = S × e^((r + c - y) × ΔT)</code>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-700 font-medium">Risk-Free Rate (RBI Repo Rate)</span>
              <span className="font-mono text-amber-800 font-bold text-sm">{repoRate.toFixed(2)}% p.a.</span>
            </div>
            <input
              type="range"
              min="4.0"
              max="10.0"
              step="0.25"
              value={repoRate}
              onChange={(e) => handleRepoChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>4.00%</span>
              <span className="text-amber-800 font-semibold">Current RBI: 6.50%</span>
              <span>10.00%</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-700 font-medium">Vaulted Storage & Insurance Cost</span>
              <span className="font-mono text-amber-800 font-bold text-sm">{storageCost.toFixed(2)}% p.a.</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="1.00"
              step="0.05"
              value={storageCost}
              onChange={(e) => handleStorageChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.10%</span>
              <span className="text-amber-800 font-semibold">Institutional: 0.25%</span>
              <span>1.00%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="space-y-6">
        <SpreadChart
          data={spreadChartData}
          pairKey={selectedPairKey}
          title="Historical Spread vs Theoretical Cost-of-Carry Fair Value"
        />

        <NormalizedPriceChart
          data={priceChartData}
          leg1Name={`${spreadMetrics?.leg1_symbol || "Front"} (${spreadMetrics?.leg1_expiry || ""})`}
          leg2Name={`${spreadMetrics?.leg2_symbol || "Deferred"} (${spreadMetrics?.leg2_expiry || ""})`}
        />
      </div>

      {/* Anomaly Alerts Panel */}
      {anomalies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Active Anomaly & Dislocation Alerts ({anomalies.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {anomalies.map((a, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border text-xs space-y-1.5 shadow-xs ${
                  a.severity === "CRITICAL"
                    ? "bg-rose-50 border-rose-300 text-rose-950"
                    : a.severity === "HIGH"
                    ? "bg-orange-50 border-orange-300 text-orange-950"
                    : a.severity === "MODERATE"
                    ? "bg-amber-50 border-amber-300 text-amber-950"
                    : "bg-sky-50 border-sky-300 text-sky-950"
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{a.title}</span>
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-white border border-current shadow-2xs">
                    {a.severity}
                  </span>
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed">{a.description}</p>
                <div className="text-[10px] font-mono font-semibold pt-1 text-slate-600">{a.metric}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
