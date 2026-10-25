import { MCXContract, MCXSymbol } from "../types";

export const MCX_GOLD_SPECS: Record<MCXSymbol, MCXContract> = {
  GOLD: {
    id: "GOLD",
    symbol: "GOLD",
    name: "Gold Standard (1 Kg)",
    trading_unit_grams: 1000.0,
    trading_unit_desc: "1 Kilogram (1000 grams)",
    quotation_unit_grams: 10.0,
    quotation_unit_desc: "₹ per 10 grams",
    purity_fineness: 995,
    purity_karat: "23.88K (99.5% pure)",
    tick_size: 1.0,
    lot_multiplier: 100.0, // 1000g / 10g quotation = 100 units per point
    initial_margin_pct: 10.0,
    tender_period_days: 5,
    delivery_type: "Compulsory Delivery",
    delivery_unit: "1 Kg bar with serial number",
    max_order_size: 100,
    liquidity_tier: "High",
    is_active: true,
  },
  GOLDM: {
    id: "GOLDM",
    symbol: "GOLDM",
    name: "Gold Mini (100g)",
    trading_unit_grams: 100.0,
    trading_unit_desc: "100 grams",
    quotation_unit_grams: 10.0,
    quotation_unit_desc: "₹ per 10 grams",
    purity_fineness: 995,
    purity_karat: "23.88K (99.5% pure)",
    tick_size: 1.0,
    lot_multiplier: 10.0, // 100g / 10g quotation = 10 units per point
    initial_margin_pct: 10.0,
    tender_period_days: 5,
    delivery_type: "Compulsory Delivery",
    delivery_unit: "100 grams bar",
    max_order_size: 500,
    liquidity_tier: "High",
    is_active: true,
  },
  GOLDTEN: {
    id: "GOLDTEN",
    symbol: "GOLDTEN",
    name: "Gold Ten (10g)",
    trading_unit_grams: 10.0,
    trading_unit_desc: "10 grams",
    quotation_unit_grams: 10.0,
    quotation_unit_desc: "₹ per 10 grams",
    purity_fineness: 999,
    purity_karat: "24K Fine Gold (99.9% pure)",
    tick_size: 1.0,
    lot_multiplier: 1.0, // 10g / 10g quotation = 1 unit per point
    initial_margin_pct: 10.0,
    tender_period_days: 5,
    delivery_type: "Compulsory Delivery",
    delivery_unit: "10 gram bar with hallmark",
    max_order_size: 1000,
    liquidity_tier: "Medium",
    is_active: true,
  },
  GOLDGUINEA: {
    id: "GOLDGUINEA",
    symbol: "GOLDGUINEA",
    name: "Gold Guinea (8g)",
    trading_unit_grams: 8.0,
    trading_unit_desc: "8 grams (1 Sovereign)",
    quotation_unit_grams: 8.0,
    quotation_unit_desc: "₹ per 8 grams",
    purity_fineness: 999, // 999 per MCX PS#03 contract table
    purity_karat: "24K Fine Gold (99.9% pure)",
    tick_size: 1.0,
    lot_multiplier: 1.0, // 8g / 8g quotation = 1 unit per point
    initial_margin_pct: 10.0,
    tender_period_days: 5,
    delivery_type: "Compulsory Delivery",
    delivery_unit: "8 grams coin",
    max_order_size: 1000,
    liquidity_tier: "Medium",
    is_active: true,
  },
  GOLDPETAL: {
    id: "GOLDPETAL",
    symbol: "GOLDPETAL",
    name: "Gold Petal (1g)",
    trading_unit_grams: 1.0,
    trading_unit_desc: "1 gram",
    quotation_unit_grams: 1.0,
    quotation_unit_desc: "₹ per 1 gram",
    purity_fineness: 999,
    purity_karat: "24K Fine Gold (99.9% pure)",
    tick_size: 1.0,
    lot_multiplier: 1.0, // 1g / 1g quotation = 1 unit per point
    initial_margin_pct: 10.0,
    tender_period_days: 5,
    delivery_type: "Compulsory Delivery",
    delivery_unit: "1 gram coin in tamper-proof packing",
    max_order_size: 5000,
    liquidity_tier: "Medium-High",
    is_active: true,
  },
};

export const BENCHMARK_SPEC = {
  benchmark_unit_grams: 10.0,
  benchmark_purity_fineness: 995,
  description: "Standardized Indian Benchmark: ₹ per 10 grams @ 995 purity fineness",
};

export const DEFAULT_QUANT_CONFIG = {
  rbi_repo_rate: 0.065, // 6.50% RBI Repo Rate
  annual_storage_cost: 0.0025, // 0.25% vaulted storage and insurance
  convenience_yield: 0.0, // 0%
  tender_period_days: 5,
  min_front_oi: 250,
  min_next_oi: 100,
  min_daily_volume: 50,
  entry_z_score: 1.8,
  exit_z_score: 0.2,
  stop_loss_z: 3.2,
  friction_hurdle_multiplier: 2.0,
};
