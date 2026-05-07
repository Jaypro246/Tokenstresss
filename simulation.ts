/**
* TokenStress Simulation Engine
* Pure deterministic formulas — no randomness, no AI, no fake data.
* All calculations are based strictly on user inputs.
*/

export type SimMode = 'whale-exit' | 'liquidity-shock' | 'redistribution';

export interface SimInputs {
mode: SimMode;
/** Whale Exit: number of top holders removed (1–5) */
holders?: number;
/** Liquidity Shock: % liquidity removed (0–100) */
liquidityPct?: number;
/** Redistribution: % redistributed (0–100) */
redistributionPct?: number;
}

export interface SimResult {
mode: SimMode;
fragilityIndex: number;       // 0–100 normalised
riskLabel: 'Strong' | 'Moderate' | 'Fragile' | 'Critical';
/** 0–100 scale */
concentrationImpact: number;
liquidityImpact: number;
volatilityRisk: number;
recoveryFactor: number;
stabilityScore: number;       // 100 - fragilityIndex (convenience)
/** Human-readable breakdown lines for UI */
breakdown: { label: string; value: number; unit: string }[];
}

function clamp(v: number, min = 0, max = 100): number {
return Math.min(max, Math.max(min, v));
}

function riskLabel(index: number): SimResult['riskLabel'] {
if (index <= 25) return 'Strong';
if (index <= 50) return 'Moderate';
if (index <= 75) return 'Fragile';
return 'Critical';
}

/**
* Fragility Index formula (spec-exact):
*   0.4 × concentration_impact
* + 0.3 × liquidity_impact
* + 0.2 × volatility_risk
* + 0.1 × (100 - recovery_factor)
* Normalised to 0–100.
*/
function fragilityIndex(
concentrationImpact: number,
liquidityImpact: number,
volatilityRisk: number,
recoveryFactor: number,
): number {
const raw =
0.4 * concentrationImpact +
0.3 * liquidityImpact +
0.2 * volatilityRisk +
0.1 * (100 - recoveryFactor);
return clamp(Math.round(raw));
}

// ─── Whale Exit ───────────────────────────────────────────────────────────────
// input: holders removed (1–5)
// concentration_impact = holders × 8
// liquidity_impact     = holders × 6
// volatility_risk      = liquidity_impact × 0.5
// recovery_factor      = 10
function whaleExit(holders: number): SimResult {
const h = clamp(holders, 1, 5);
const concentrationImpact = clamp(h * 8);
const liquidityImpact = clamp(h * 6);
const volatilityRisk = clamp(liquidityImpact * 0.5);
const recoveryFactor = 10;

const fi = fragilityIndex(concentrationImpact, liquidityImpact, volatilityRisk, recoveryFactor);

return {
mode: 'whale-exit',
fragilityIndex: fi,
riskLabel: riskLabel(fi),
concentrationImpact,
liquidityImpact,
volatilityRisk,
recoveryFactor,
stabilityScore: 100 - fi,
breakdown: [
{ label: 'Top holders removed', value: h, unit: 'wallets' },
{ label: 'Concentration impact', value: concentrationImpact, unit: '%' },
{ label: 'Liquidity impact', value: liquidityImpact, unit: '%' },
{ label: 'Volatility risk', value: Math.round(volatilityRisk), unit: '%' },
{ label: 'Recovery factor', value: recoveryFactor, unit: '/100' },
],
};
}

// ─── Liquidity Shock ─────────────────────────────────────────────────────────
// input: % liquidity removed (0–100)
// liquidity_impact     = input %
// volatility_risk      = liquidity_impact × 0.7
// concentration_impact = liquidity_impact × 0.3
// recovery_factor      = 5
function liquidityShock(liquidityPct: number): SimResult {
const pct = clamp(liquidityPct, 0, 100);
const liquidityImpact = pct;
const volatilityRisk = clamp(pct * 0.7);
const concentrationImpact = clamp(pct * 0.3);
const recoveryFactor = 5;

const fi = fragilityIndex(concentrationImpact, liquidityImpact, volatilityRisk, recoveryFactor);

return {
mode: 'liquidity-shock',
fragilityIndex: fi,
riskLabel: riskLabel(fi),
concentrationImpact,
liquidityImpact,
volatilityRisk,
recoveryFactor,
stabilityScore: 100 - fi,
breakdown: [
{ label: 'Liquidity removed', value: pct, unit: '%' },
{ label: 'Liquidity impact', value: liquidityImpact, unit: '%' },
{ label: 'Volatility risk', value: Math.round(volatilityRisk), unit: '%' },
{ label: 'Concentration impact', value: Math.round(concentrationImpact), unit: '%' },
{ label: 'Recovery factor', value: recoveryFactor, unit: '/100' },
],
};
}

// ─── Redistribution ──────────────────────────────────────────────────────────
// input: % redistributed (0–100)
// concentration_reduction = input × 0.6
// stability_gain          = concentration_reduction × 0.8
// concentration_impact    = max(0, 20 - concentration_reduction)
// liquidity_impact        = input × 0.2
// volatility_risk         = 5
// recovery_factor         = stability_gain
function redistribution(redistributionPct: number): SimResult {
const pct = clamp(redistributionPct, 0, 100);
const concentrationReduction = pct * 0.6;
const stabilityGain = concentrationReduction * 0.8;
const concentrationImpact = clamp(Math.max(0, 20 - concentrationReduction));
const liquidityImpact = clamp(pct * 0.2);
const volatilityRisk = 5;
const recoveryFactor = clamp(stabilityGain);

const fi = fragilityIndex(concentrationImpact, liquidityImpact, volatilityRisk, recoveryFactor);

return {
mode: 'redistribution',
fragilityIndex: fi,
riskLabel: riskLabel(fi),
concentrationImpact,
liquidityImpact,
volatilityRisk,
recoveryFactor,
stabilityScore: 100 - fi,
breakdown: [
{ label: 'Amount redistributed', value: pct, unit: '%' },
{ label: 'Concentration reduction', value: Math.round(concentrationReduction), unit: '%' },
{ label: 'Stability gain', value: Math.round(stabilityGain), unit: '%' },
{ label: 'Liquidity impact', value: Math.round(liquidityImpact), unit: '%' },
{ label: 'Recovery factor', value: Math.round(recoveryFactor), unit: '/100' },
],
};
}

/** Main entry point — call with parsed inputs, get deterministic results */
export function runSimulation(inputs: SimInputs): SimResult {
switch (inputs.mode) {
case 'whale-exit':
return whaleExit(inputs.holders ?? 3);
case 'liquidity-shock':
return liquidityShock(inputs.liquidityPct ?? 50);
case 'redistribution':
return redistribution(inputs.redistributionPct ?? 30);
}
}
