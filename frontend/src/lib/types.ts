export type MCXSymbol = "GOLD" | "GOLDM" | "GOLDTEN" | "GOLDGUINEA" | "GOLDPETAL";

export interface MCXContract {
  id: string;
  symbol: MCXSymbol;
  name: string;
  trading_unit_grams: number;
  trading_unit_desc: string;
  quotation_unit_grams: number;
  quotation_unit_desc: string;
  purity_fineness: number; // 995 or 999
  purity_karat: string;
  tick_size: number;
  lot_multiplier: number;
  initial_margin_pct: number;
  tender_period_days: number;
  delivery_type: string;
  delivery_unit: string;
  max_order_size: number;
  liquidity_tier: "High" | "Medium" | "Medium-High";
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BhavcopyRecord {
  id?: string;
  trade_date: string; // YYYY-MM-DD
  symbol: MCXSymbol;
  expiry_date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  previous_close?: number;
  volume_lots: number;
  value_lakhs?: number;
  open_interest: number;
  change_in_oi?: number;
  normalized_price_10g_995: number;
  source: "MCX_BHAVCOPY" | "MANUAL_CSV" | "DEMO_DATA";
  created_at?: string;
}

export type MarketRegime =
  | "SUPER_CONTANGO"
  | "NORMAL_CONTANGO"
  | "FLAT_CARRY"
  | "MODERATE_BACKWARDATION"
  | "EXTREME_BACKWARDATION";

export type SignalAction = "LONG_SPREAD" | "SHORT_SPREAD" | "NO_TRADE";

export interface TransactionCostBreakdown {
  lot_symbol: string;
  lot_multiplier: number;
  notional_per_lot: number;
  brokerage_inr: number;
  exchange_fee_inr: number;
  ctt_inr: number;
  stamp_duty_inr: number;
  gst_inr: number;
  sebi_inr: number;
  slippage_inr: number;
  statutory_and_brokerage_inr: number;
  total_friction_inr: number;
  friction_per_10g: number;
  statutory_pct_of_turnover: number;
}

export interface CalendarSpreadResult {
  id?: string;
  pair_key: string;
  valuation_date: string;
  
  leg1_symbol: MCXSymbol;
  leg1_expiry: string;
  leg1_raw_price: number;
  leg1_norm_price: number;
  leg1_oi: number;
  leg1_volume: number;
  days_to_leg1_expiry: number;
  in_tender_period: boolean;
  
  leg2_symbol: MCXSymbol;
  leg2_expiry: string;
  leg2_raw_price: number;
  leg2_norm_price: number;
  leg2_oi: number;
  leg2_volume: number;
  days_to_leg2_expiry: number;
  
  expiry_diff_days: number;
  spread_norm_abs: number;
  spread_pct: number;
  implied_carry_rate_pct: number;
  fair_spread_cost_of_carry: number;
  dislocation_abs: number;
  dislocation_pct: number;
  z_score: number;
  market_regime: MarketRegime;
  regime_description: string;
  regime_color: string;
  
  // Signal & Explainability
  action: SignalAction;
  badge: string;
  badge_color: string;
  direction: string;
  status: "ACTIONABLE" | "REJECTED_RISK" | "REJECTED_LIQUIDITY" | "REJECTED_FRICTION" | "EQUILIBRIUM";
  primary_reason: string;
  rejection_detail: string | null;
  friction_per_10g: number;
  gross_expected_edge: number;
  net_expected_edge: number;
  entry_spread?: number;
  target_spread?: number;
  stop_spread?: number;
  thesis: string;
  confidence_score: number;
  costs?: TransactionCostBreakdown;
  is_trade_candidate?: boolean;
  audit_trail?: SignalAuditTrail;
  evidence_ids?: string[];
}

export type EvidenceStatus =
  | "VERIFIED_SOURCE_FACT"
  | "CALCULATED_RESULT"
  | "HYPOTHESIS"
  | "STALE_OR_MISSING"
  | "SYNTHETIC_DEMO";

export type EvidenceCategory =
  | "CONTRACT_SPEC"
  | "TENDER_NOTICE"
  | "EXPIRY_SCHEDULE"
  | "MACRO_RATE"
  | "REGULATORY_RULE";

export interface EvidenceRecord {
  id: string;
  category: EvidenceCategory;
  claim_key: string;
  title: string;
  extracted_fact: string;
  extracted_value: string;
  stored_value?: string;
  has_discrepancy: boolean;
  discrepancy_details?: string;
  status: EvidenceStatus;
  source_name: string;
  source_url: string;
  published_at: string;
  retrieved_at: string;
  raw_snippet?: string;
  agent_engine: "TINYFISH_LIVE" | "VERIFIED_REGULATORY_BASELINE";
}

export interface SignalAuditTrail {
  decision: "TRADE_CANDIDATE" | "NO_TRADE";
  verified_source_facts: EvidenceRecord[];
  calculated_results: {
    name: string;
    value: string | number;
    formula: string;
    deterministic: boolean;
  }[];
  hypotheses_and_assumptions: {
    parameter: string;
    assumed_value: string | number;
    source_rationale: string;
    sensitivity: string;
  }[];
  rejection_or_candidate_audit: {
    decision: "TRADE_CANDIDATE" | "NO_TRADE";
    hurdle_passed: boolean;
    failing_hurdle?: string;
    risk_checks: {
      tender_window_check: "PASS" | "FAIL";
      liquidity_oi_check: "PASS" | "FAIL";
      friction_hurdle_check: "PASS" | "FAIL";
      statistical_significance_check: "PASS" | "FAIL";
    };
  };
  provenance_summary: {
    market_data_source: "MCX_BHAVCOPY" | "MANUAL_CSV" | "DEMO_DATA";
    evidence_engine: "TINYFISH_LIVE" | "VERIFIED_REGULATORY_BASELINE";
    timestamp: string;
  };
}

export interface AnomalyAlert {
  code: string;
  severity: "INFO" | "MODERATE" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  metric: string;
}

export interface BacktestConfig {
  pair_key: string;
  lookback_window: number; // rolling z-score lookback (e.g. 20)
  entry_z: number;        // e.g. 1.8
  exit_z: number;         // e.g. 0.2
  stop_loss_z: number;    // e.g. 3.2
  brokerage_per_order: number; // ₹20
  slippage_ticks: number;      // 1 tick = ₹1/10g
  initial_capital: number;     // e.g. ₹1,000,000
  lot_type: MCXSymbol;         // GOLD (1kg) or GOLDM (100g)
  max_holding_days: number;    // e.g. 45
}

export interface EquityCurvePoint {
  date: string;
  strategy_equity: number;
  strategy_gross_equity: number;
  baseline_equity: number;
  drawdown_pct: number;
}

export interface TradeLogEntry {
  trade_id: number;
  pair_key: string;
  direction: "LONG_SPREAD" | "SHORT_SPREAD";
  entry_date: string;
  entry_spread: number;
  exit_date: string;
  exit_spread: number;
  holding_days: number;
  gross_pnl_inr: number;
  friction_paid_inr: number;
  net_pnl_inr: number;
  return_pct: number;
  exit_reason: "TARGET_REVERSION" | "STOP_LOSS" | "TENDER_ROLL_FORCE" | "EXPIRY_CLOSED";
}

export interface BacktestReport {
  id?: string;
  strategy_name: string;
  pair_key: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  final_equity: number;
  net_profit_inr: number;
  net_return_pct: number;
  cagr_pct: number;
  max_drawdown_inr: number;
  max_drawdown_pct: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  win_rate_pct: number;
  profit_factor: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  total_friction_paid_inr: number;
  baseline_return_pct: number;
  equity_curve: EquityCurvePoint[];
  trade_logs: TradeLogEntry[];
  parameters: BacktestConfig;
  data_quality_audit: {
    total_bars: number;
    missing_dates_found: number;
    zero_volume_filtered: number;
    price_spikes_flagged: number;
    look_ahead_bias_free: boolean;
    audit_passed: boolean;
  };
  created_at?: string;
}
