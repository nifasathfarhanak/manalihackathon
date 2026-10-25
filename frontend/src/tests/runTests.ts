/**
 * AuricLens Quantitative & Storage Engine Test Suite
 * Automated tests covering normalization, spread math, cost models,
 * anomaly detection, signals, and walk-forward backtesting.
 */

import { GoldNormalizer } from "../lib/quant/normalizer";
import { MCX_GOLD_SPECS } from "../lib/quant/specs";
import { CostModel } from "../lib/quant/costModel";
import { SpreadEngine } from "../lib/quant/spreadEngine";
import { AnomalyDetector } from "../lib/quant/anomalyDetector";
import { SignalEngine } from "../lib/quant/signals";
import { BhavcopyParser } from "../lib/quant/bhavcopy";
import { WalkForwardBacktester } from "../lib/quant/backtester";
import { StorageService } from "../lib/supabase/service";
import { TinyFishEvidenceAgent } from "../lib/quant/tinyfish";
import { BhavcopyRecord, BacktestConfig } from "../types";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedCount++;
  }
}

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("       AURICLENS QUANTITATIVE ENGINE TEST SUITE        ");
  console.log("=======================================================\n");

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Contract Normalizer (Quotation Units & Purity)
  // --------------------------------------------------------------------------
  console.log("[1] Testing Contract Normalization Engine...");

  // GOLD (1kg) & GOLDM (100g) quoted per 10g at 995
  const goldNorm = GoldNormalizer.normalizePrice("GOLD", 78500);
  assert(goldNorm === 78500, "GOLD price per 10g 995 normalization factor should be exactly 1.0");

  const goldmNorm = GoldNormalizer.normalizePrice("GOLDM", 78500);
  assert(goldmNorm === 78500, "GOLDM price per 10g 995 normalization factor should be exactly 1.0");

  // GOLDGUINEA: quoted per 8g at 999 purity -> factor is (10/8) * (995/999) = 1.24499...
  // PS#03 contract table specifies GOLDGUINEA as 999 fineness
  const guineaRaw = 62800; // 62,800 per 8g at 999 purity
  const guineaNorm = GoldNormalizer.normalizePrice("GOLDGUINEA", guineaRaw);
  // Expected: 62800 * (10/8) * (995/999) ≈ 78,185.69 (rounded to 2dp)
  assert(Math.abs(guineaNorm - 78185.69) <= 1.0, `GOLDGUINEA (₹${guineaRaw}/8g @ 999) normalizes to ~₹78,186/10g @ 995 benchmark: got ${guineaNorm}`);

  // GOLDPETAL: quoted per 1g at 999 -> factor is 10 * (995/999) = 9.95996
  const petalRaw = 7881.56; // 7,881.56 per 1g 999
  const petalNorm = GoldNormalizer.normalizePrice("GOLDPETAL", petalRaw);
  assert(Math.abs(petalNorm - 78500) <= 1.0, `GOLDPETAL 999 purity normalizes to 995 benchmark: got ${petalNorm}`);

  // Custom Karat conversion
  const custom22k = GoldNormalizer.convertCustom(78500, 10, 916);
  assert(custom22k.karat_estimate === 22.0, "916 fineness corresponds to 22.0 Karat");
  assert(custom22k.total_value_inr > 70000 && custom22k.total_value_inr < 75000, "22K 10g value calculated properly");

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Institutional Transaction Cost Model
  // --------------------------------------------------------------------------
  console.log("\n[2] Testing Institutional MCX Transaction Cost Model...");

  const costs = CostModel.calculateRoundTripCosts(78500, 79200, "GOLD", 20.0, 1);
  assert(costs.brokerage_inr === 80.0, "Brokerage for 4 order legs @ ₹20 is exactly ₹80.00");
  assert(costs.exchange_fee_inr > 0, "MCX exchange turnover charges calculated");
  assert(costs.ctt_inr > 0, "Commodity Transaction Tax calculated on sell orders");
  assert(costs.gst_inr > 0, "18% GST calculated on brokerage and exchange charges");
  assert(costs.total_friction_inr > 0, `Total round-trip friction computed: ₹${costs.total_friction_inr}/lot (₹${costs.friction_per_10g}/10g)`);

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Spread Engine & Cost-of-Carry Model
  // --------------------------------------------------------------------------
  console.log("\n[3] Testing Spread Engine & Cost of Carry Model...");

  const leg1: BhavcopyRecord = {
    trade_date: "2025-02-01",
    symbol: "GOLD",
    expiry_date: "2025-04-05",
    open: 78400,
    high: 78600,
    low: 78300,
    close: 78500,
    volume_lots: 3000,
    open_interest: 12000,
    normalized_price_10g_995: 78500,
    source: "MCX_BHAVCOPY",
  };

  const leg2: BhavcopyRecord = {
    trade_date: "2025-02-01",
    symbol: "GOLD",
    expiry_date: "2025-06-05",
    open: 79100,
    high: 79300,
    low: 79000,
    close: 79250,
    volume_lots: 1800,
    open_interest: 8500,
    normalized_price_10g_995: 79250,
    source: "MCX_BHAVCOPY",
  };

  const spreadResult = SpreadEngine.calculateSpread(leg1, leg2, 0.065, 0.0025, 0.0);
  assert(spreadResult.spread_norm_abs === 750, "Absolute spread calculated correctly: 79250 - 78500 = ₹750/10g");
  assert(spreadResult.implied_carry_rate_pct > 0, `Implied carry rate computed: ${spreadResult.implied_carry_rate_pct}% p.a.`);
  assert(spreadResult.fair_spread_cost_of_carry > 0, `Cost of carry fair spread computed: ₹${spreadResult.fair_spread_cost_of_carry}/10g`);
  assert(spreadResult.market_regime === "NORMAL_CONTANGO" || spreadResult.market_regime === "SUPER_CONTANGO", "Market regime properly identified");

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Anomaly Detection Engine
  // --------------------------------------------------------------------------
  console.log("\n[4] Testing Anomaly Detection Engine...");

  // Test Z-Score Anomaly
  const extremeSpread = { ...spreadResult, z_score: 2.85 };
  const anomaliesZ = AnomalyDetector.detectAnomalies(extremeSpread);
  assert(anomaliesZ.some((a) => a.code === "STATISTICAL_EXTREME_Z"), "Extreme Z-Score (> 2.5) correctly flagged as critical anomaly");

  // Test Backwardation Inversion
  const backwardationSpread = { ...spreadResult, spread_norm_abs: -150 };
  const anomaliesBack = AnomalyDetector.detectAnomalies(backwardationSpread);
  assert(anomaliesBack.some((a) => a.code === "UNNATURAL_BACKWARDATION"), "Physical backwardation correctly flagged as high anomaly");

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Signal & Rejection Engine
  // --------------------------------------------------------------------------
  console.log("\n[5] Testing Signal Evaluation & Transparent Rejection Reasons...");

  // Case 5a: Underpriced Spread (spread 750 < fair 890, dislocation < 0, z <= -1.8) -> LONG_SPREAD
  const actionableLongSignal = SignalEngine.evaluateSignal(spreadResult, -2.1);
  assert(actionableLongSignal.action === "LONG_SPREAD", "Underpriced spread triggers LONG_SPREAD action");
  assert(actionableLongSignal.rejection_detail === null, "Actionable signal has no rejection detail");
  assert(actionableLongSignal.confidence_score > 70, `Confidence score calculated: ${actionableLongSignal.confidence_score}%`);

  // Case 5b: Overpriced Spread (spread 1050 > fair 890, dislocation > 0, z >= +1.8) -> SHORT_SPREAD
  const leg2Overpriced: BhavcopyRecord = { ...leg2, close: 79550, normalized_price_10g_995: 79550 };
  const overpricedSpread = SpreadEngine.calculateSpread(leg1, leg2Overpriced, 0.065, 0.0025, 0.0);
  const actionableShortSignal = SignalEngine.evaluateSignal(overpricedSpread, 2.1);
  assert(actionableShortSignal.action === "SHORT_SPREAD", "Overpriced spread triggers SHORT_SPREAD action");
  assert(actionableShortSignal.rejection_detail === null, "Actionable short signal has no rejection detail");

  // Rejection Case 1: Tender Period Window
  const tenderSpread = { ...spreadResult, in_tender_period: true, days_to_leg1_expiry: 3 };
  const tenderSignal = SignalEngine.evaluateSignal(tenderSpread, 2.5);
  assert(tenderSignal.action === "NO_TRADE", "Tender period triggers mandatory NO_TRADE");
  assert(tenderSignal.status === "REJECTED_RISK", "Status correctly marked as REJECTED_RISK");

  // Rejection Case 2: Insufficient Liquidity in Deferred Leg
  const illiquidSpread = { ...spreadResult, leg2_oi: 35 };
  const illiquidSignal = SignalEngine.evaluateSignal(illiquidSpread, 2.3);
  assert(illiquidSignal.action === "NO_TRADE", "Low deferred OI triggers NO_TRADE");
  assert(illiquidSignal.status === "REJECTED_LIQUIDITY", "Status correctly marked as REJECTED_LIQUIDITY");

  // Equilibrium State: No trade
  const eqSignal = SignalEngine.evaluateSignal(spreadResult, 0.45);
  assert(eqSignal.action === "NO_TRADE", "Spread in statistical noise (|Z| < 1.8) triggers NO_TRADE");
  assert(eqSignal.status === "EQUILIBRIUM", "Status correctly marked as EQUILIBRIUM");

  // --------------------------------------------------------------------------
  // TEST GROUP 6: Walk-Forward Backtester (Zero Look-Ahead Bias)
  // --------------------------------------------------------------------------
  console.log("\n[6] Testing Walk-Forward Backtester (Zero Look-Ahead Bias)...");

  const dataset = BhavcopyParser.getVerifiedHistoricalDataset();
  const leg1Series = dataset.filter((r) => r.symbol === "GOLD" && r.expiry_date === "2025-04-05");
  const leg2Series = dataset.filter((r) => r.symbol === "GOLD" && r.expiry_date === "2025-06-05");

  const btConfig: BacktestConfig = {
    pair_key: "GOLD_APR25-GOLD_JUN25",
    lookback_window: 20,
    entry_z: 1.8,
    exit_z: 0.2,
    stop_loss_z: 3.2,
    brokerage_per_order: 20.0,
    slippage_ticks: 1,
    initial_capital: 1000000,
    lot_type: "GOLD",
    max_holding_days: 45,
  };

  const report = WalkForwardBacktester.runBacktest(leg1Series, leg2Series, btConfig);
  assert(report.equity_curve.length > 0, `Equity curve generated: ${report.equity_curve.length} points`);
  assert(report.data_quality_audit.look_ahead_bias_free === true, "Data quality audit verifies zero look-ahead bias");
  assert(report.total_friction_paid_inr >= 0, `Total transaction friction recorded: ₹${report.total_friction_paid_inr}`);
  assert(typeof report.sharpe_ratio === "number", `Sharpe ratio computed: ${report.sharpe_ratio}`);
  assert(typeof report.max_drawdown_pct === "number", `Max drawdown computed: -${report.max_drawdown_pct}%`);

  // --------------------------------------------------------------------------
  // TEST GROUP 7: Storage Service & Database Diagnostics
  // --------------------------------------------------------------------------
  console.log("\n[7] Testing Storage Service & Supabase Layer...");

  const contracts = await StorageService.getContracts();
  assert(contracts.length === 5, `Contracts loaded successfully (${contracts.length} official MCX contracts)`);

  const dbDiag = await StorageService.testDatabaseConnection();
  assert(dbDiag !== null, "Database diagnostic executed cleanly without crashing");
  assert(typeof dbDiag.tables.contracts === "number", "Contract table check functional");

  // --------------------------------------------------------------------------
  // TEST GROUP 8: TinyFish Evidence Agent & Regulatory Discrepancy Auditor
  // --------------------------------------------------------------------------
  console.log("\n[8] Testing TinyFish Evidence Agent & Regulatory Discrepancy Auditor...");

  // 8a. Baseline official evidence check
  const evidenceList = TinyFishEvidenceAgent.OFFICIAL_BASELINE_EVIDENCE;
  assert(evidenceList.length >= 8, `Official regulatory evidence loaded: ${evidenceList.length} authoritative records`);
  assert(
    evidenceList.every(
      (e) => e.source_url.startsWith("https://") && (e.status === "VERIFIED_SOURCE_FACT" || e.status === "HYPOTHESIS")
    ),
    "All evidence records contain verified HTTPS URLs and proper status separation (facts vs hypotheses)"
  );

  // 8b. Clean contract audit against verified evidence
  const goldContract = MCX_GOLD_SPECS["GOLD"];
  const cleanAudit = TinyFishEvidenceAgent.auditContractAgainstEvidence(goldContract, evidenceList);
  assert(cleanAudit.discrepancies.length === 0, "Official MCX GOLD contract specification matches official evidence with 0 discrepancies");

  // 8c. Intentional discrepancy detection (simulated outdated contract)
  const modifiedContract = { ...goldContract, tender_period_days: 3 }; // altered from official 5 days
  const flaggedAudit = TinyFishEvidenceAgent.auditContractAgainstEvidence(modifiedContract, evidenceList);
  assert(
    flaggedAudit.discrepancies.length > 0 && flaggedAudit.discrepancies[0].includes("Tender period"),
    `Evidence Agent successfully flags specification discrepancy: "${flaggedAudit.discrepancies[0]}"`
  );

  // 8d. Audit trail generation for candidate signals
  const auditTrail = TinyFishEvidenceAgent.buildAuditTrail(
    spreadResult,
    MCX_GOLD_SPECS["GOLD"],
    MCX_GOLD_SPECS["GOLD"]
  );
  assert(auditTrail.verified_source_facts.length >= 3, `Audit trail includes ${auditTrail.verified_source_facts.length} verified facts`);
  assert(auditTrail.calculated_results.length >= 4, `Audit trail documents ${auditTrail.calculated_results.length} deterministic calculation formulas`);
  assert(auditTrail.hypotheses_and_assumptions.length >= 3, "Audit trail separates economic hypotheses (repo rate, vaulting)");
  assert(
    typeof auditTrail.rejection_or_candidate_audit.hurdle_passed === "boolean",
    "Audit trail includes complete hurdle validation matrix"
  );

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
