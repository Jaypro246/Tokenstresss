'use client';

import { useMemo } from 'react';
import ExportButtons from '@/components/ExportButtons';
import {
BarChart,
Bar,
XAxis,
YAxis,
CartesianGrid,
Tooltip,
ResponsiveContainer,
LineChart,
Line,
PieChart,
Pie,
Cell,
Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import type { SimResult, SimMode } from '@/lib/simulation';
import { runSimulation } from '@/lib/simulation';
import Link from 'next/link';

/* ─── Types ─────────────────────────────────────────────────────────────────── */

interface TokenSnap {
name: string | null;
symbol: string | null;
price: number | null;
liquidity: number | null;
holder: number | null;
}

interface Props {
result: SimResult;
token: TokenSnap | null;
inputs: {
mode: SimMode;
holders: number;
liquidityPct: number;
redistributionPct: number;
};
address: string;
simBackUrl: string;
tokenBackUrl: string;
afterLiquidity: number | null;
afterHolders: number | null;
}

/* ─── Constants ─────────────────────────────────────────────────────────────── */

const MODE_LABELS: Record<SimMode, string> = {
'whale-exit': 'Whale Exit',
'liquidity-shock': 'Liquidity Shock',
redistribution: 'Redistribution',
};

const RISK_COLORS: Record<SimResult['riskLabel'], string> = {
Strong: 'text-green-400 border-green-500/40 bg-green-500/10',
Moderate: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
Fragile: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
Critical: 'text-red-400 border-red-500/40 bg-red-500/10',
};

const INDEX_RING: Record<SimResult['riskLabel'], string> = {
Strong: 'border-green-500',
Moderate: 'border-yellow-400',
Fragile: 'border-orange-400',
Critical: 'border-red-500',
};

const RISK_BANNER: Record<SimResult['riskLabel'], { bg: string; icon: string; headline: string }> = {
Strong: { bg: 'bg-green-500/10 border-green-500/30', icon: '🟢', headline: 'Token structure remains healthy under this scenario.' },
Moderate: { bg: 'bg-yellow-500/10 border-yellow-500/30', icon: '🟡', headline: 'Moderate structural stress — monitor closely if this occurs.' },
Fragile: { bg: 'bg-orange-500/10 border-orange-500/30', icon: '🟠', headline: 'Significant fragility detected — this scenario poses real risk.' },
Critical: { bg: 'bg-red-500/10 border-red-500/30', icon: '🔴', headline: 'Critical risk — token structure could break down under this scenario.' },
};

const CHART_COLORS = {
before: 'hsl(220 14% 50%)',
after: 'hsl(25 95% 55%)',
green: '#4ade80',
yellow: '#facc15',
orange: '#fb923c',
red: '#f87171',
};

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function fmtCurrency(v: number | null): string {
if (v === null) return '—';
if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
if (v >= 1_000) return `${(v / 1_000).toFixed(2)}K`;
return `${v.toFixed(2)}`;
}

function fmtPrice(v: number | null): string {
if (v === null) return '—';
if (v < 0.000001) return v.toExponential(4);
if (v < 0.01) return v.toFixed(8);
if (v < 1) return v.toFixed(6);
return v.toFixed(4);
}

function buildExplanation(mode: SimMode, inputs: Props['inputs'], result: SimResult): string {
const modeLabel = MODE_LABELS[mode];
const fi = result.fragilityIndex;
const risk = result.riskLabel;

if (mode === 'whale-exit') {
const h = inputs.holders;
return `This simulation removed ${h} top wallet${h > 1 ? 's' : ''} from the holder distribution. ` +
`Each whale exit contributes an 8% concentration shift and a 6% liquidity reduction. ` +
`With ${h} wallet${h > 1 ? 's' : ''} exiting, total concentration impact reaches ${result.concentrationImpact}% ` +
`and liquidity impact reaches ${result.liquidityImpact}%. ` +
`The resulting Fragility Index of ${fi}/100 places this token in the "${risk}" category. ` +
(risk === 'Strong' || risk === 'Moderate'
? 'The token shows resilience, suggesting a distributed holder base can absorb this exit pressure.'
: 'This level of whale exit pressure could trigger cascading sell-offs and price destabilisation.');
}

if (mode === 'liquidity-shock') {
const pct = inputs.liquidityPct;
return `This simulation modelled a sudden removal of ${pct}% of available DEX liquidity. ` +
`Liquidity shocks directly raise volatility risk (${Math.round(result.volatilityRisk)}%) and increase concentration pressure ` +
`as thin markets amplify individual trades. ` +
`With a low recovery factor of ${result.recoveryFactor}/100, the token has limited buffer to absorb this shock. ` +
`The Fragility Index of ${fi}/100 (${risk}) reflects that ` +
(risk === 'Critical' || risk === 'Fragile'
? 'this level of liquidity removal creates serious instability risk.'
: 'the token retains reasonable structural integrity despite reduced liquidity.');
}

// redistribution
const pct = inputs.redistributionPct;
return `This simulation redistributed ${pct}% of concentrated holdings across the holder base. ` +
`Redistribution reduces concentration by ${Math.round(pct * 0.6)}% and generates a stability gain of ` +
`${Math.round(pct * 0.6 * 0.8)}%, improving the recovery factor. ` +
`The resulting Fragility Index of ${fi}/100 (${risk}) shows that ` +
(result.stabilityScore > 60
? 'redistribution significantly improves structural health — a more even holder distribution strengthens the token.'
: 'even with redistribution, residual concentration risk remains elevated.');
}

/* ─── Risk Curve data (deterministic — sweep input from min to max) ─────────── */

function buildRiskCurve(mode: SimMode): { x: number; fragility: number }[] {
if (mode === 'whale-exit') {
return [1, 2, 3, 4, 5].map((h) => ({
x: h,
fragility: runSimulation({ mode, holders: h }).fragilityIndex,
}));
}
if (mode === 'liquidity-shock') {
return [0, 20, 40, 60, 80, 100].map((pct) => ({
x: pct,
fragility: runSimulation({ mode, liquidityPct: pct }).fragilityIndex,
}));
}
// redistribution
return [0, 20, 40, 60, 80, 100].map((pct) => ({
x: pct,
fragility: runSimulation({ mode, redistributionPct: pct }).fragilityIndex,
}));
}

/* ─── Component ─────────────────────────────────────────────────────────────── */

export default function ResultsClient({
result,
token,
inputs,
address,
simBackUrl,
tokenBackUrl,
afterLiquidity,
afterHolders,
}: Props) {
const modeLabel = MODE_LABELS[inputs.mode];
const banner = RISK_BANNER[result.riskLabel];

/* Bar chart: before vs after for 3 metrics */
const barData = [
{
metric: 'Concentration',
Before: 100,
After: Math.max(0, 100 - result.concentrationImpact),
},
{
metric: 'Liquidity',
Before: 100,
After: Math.max(0, 100 - result.liquidityImpact),
},
{
metric: 'Stability',
Before: 100,
After: result.stabilityScore,
},
];

/* Risk curve */
const riskCurve = buildRiskCurve(inputs.mode);
const currentX =
inputs.mode === 'whale-exit'
? inputs.holders
: inputs.mode === 'liquidity-shock'
? inputs.liquidityPct
: inputs.redistributionPct;

/* Pie chart: metric composition */
const pieData = [
{ name: 'Concentration', value: Math.round(result.concentrationImpact * 0.4) },
{ name: 'Liquidity', value: Math.round(result.liquidityImpact * 0.3) },
{ name: 'Volatility', value: Math.round(result.volatilityRisk * 0.2) },
{ name: 'Recovery gap', value: Math.round((100 - result.recoveryFactor) * 0.1) },
];
const pieColors = [CHART_COLORS.orange, CHART_COLORS.yellow, CHART_COLORS.red, CHART_COLORS.green];

const explanation = buildExplanation(inputs.mode, inputs, result);

/* Export handler */
return (
<div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

{/* Breadcrumb */}
<nav className="text-xs text-muted-foreground flex items-center gap-2">
<Link href="/" className="hover:text-foreground transition-colors">Home</Link>
<span>/</span>
<Link href={tokenBackUrl} className="hover:text-foreground transition-colors">Token Overview</Link>
<span>/</span>
<Link href={simBackUrl} className="hover:text-foreground transition-colors">Simulation</Link>
<span>/</span>
<span className="text-foreground">Results</span>
</nav>

{/* ── Scenario Summary Banner ─────────────────────────────────────────── */}
<div className={`rounded-xl border px-6 py-4 flex items-start gap-4 ${banner.bg}`}>
<span className="text-2xl mt-0.5 shrink-0">{banner.icon}</span>
<div className="space-y-1 flex-1">
<div className="flex flex-wrap items-center gap-2">
<span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
{modeLabel} Scenario
</span>
{token?.name && (
<span className="text-xs font-mono text-muted-foreground">· {token.name} ({token.symbol})</span>
)}
</div>
<p className="text-sm font-semibold text-foreground">{banner.headline}</p>
<p className="text-xs text-muted-foreground">
Fragility Index: <span className="font-bold text-foreground">{result.fragilityIndex}/100</span>
{' '}·{' '}
Risk Level: <span className="font-bold text-foreground">{result.riskLabel}</span>
{' '}·{' '}
Stability Score: <span className="font-bold text-foreground">{result.stabilityScore}</span>
</p>
</div>
<div className="flex items-center gap-2 shrink-0">
<ExportButtons
tokenName={token?.name ?? null}
tokenSymbol={token?.symbol ?? null}
address={address}
mode={inputs.mode}
modeLabel={modeLabel}
result={result}
explanation={explanation}
afterLiquidity={afterLiquidity}
afterHolders={afterHolders}
/>
<Link
href={simBackUrl}
className="text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all"
>
Re-run →
</Link>
</div>
</div>

{/* ── Fragility Index + Risk Label ───────────────────────────────────── */}
<div className="grid sm:grid-cols-[1fr_auto] gap-4">
<Card className="flex items-center gap-6">
<div className={`w-24 h-24 rounded-full border-4 ${INDEX_RING[result.riskLabel]} flex items-center justify-center shrink-0`}>
<div className="text-center">
<p className="text-3xl font-bold text-foreground">{result.fragilityIndex}</p>
<p className="text-[10px] text-muted-foreground mt-0.5">/ 100</p>
</div>
</div>
<div className="space-y-1">
<p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Fragility Index</p>
<p className="text-4xl font-bold text-foreground">{result.fragilityIndex}</p>
<p className="text-xs text-muted-foreground">Based on {modeLabel} scenario</p>
</div>
</Card>
<Card className="flex flex-col items-center justify-center min-w-[160px] text-center space-y-2">
<p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Risk Label</p>
<div className={`mt-2 px-4 py-2 rounded-lg border ${RISK_COLORS[result.riskLabel]}`}>
<p className="text-xl font-bold">{result.riskLabel}</p>
</div>
<p className="text-[10px] text-muted-foreground">Score: {result.fragilityIndex}/100</p>
</Card>
</div>

{/* ── Charts row ─────────────────────────────────────────────────────── */}
<div className="grid lg:grid-cols-2 gap-6">

{/* Before vs After Bar Chart */}
<Card>
<CardHeader>
<CardTitle>Before vs After</CardTitle>
<p className="text-xs text-muted-foreground mt-1">Structural metric comparison — 100 = pre-stress baseline</p>
</CardHeader>
<div className="mt-4 h-52">
<ResponsiveContainer width="100%" height="100%">
<BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
<CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 18%)" />
<XAxis dataKey="metric" tick={{ fill: 'hsl(220 14% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
<YAxis domain={[0, 100]} tick={{ fill: 'hsl(220 14% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
<Tooltip
contentStyle={{ background: 'hsl(220 14% 10%)', border: '1px solid hsl(220 13% 20%)', borderRadius: 8, fontSize: 12 }}
labelStyle={{ color: 'hsl(220 10% 80%)' }}
/>
<Legend wrapperStyle={{ fontSize: 11, color: 'hsl(220 14% 55%)' }} />
<Bar dataKey="Before" fill={CHART_COLORS.before} radius={[4, 4, 0, 0]} />
<Bar dataKey="After" fill={CHART_COLORS.after} radius={[4, 4, 0, 0]} />
</BarChart>
</ResponsiveContainer>
</div>
</Card>

{/* Risk Curve Line Chart */}
<Card>
<CardHeader>
<CardTitle>Risk Curve</CardTitle>
<p className="text-xs text-muted-foreground mt-1">
Fragility index across the full{' '}
{inputs.mode === 'whale-exit' ? 'holder count' : 'intensity'} range
{' '}· current value highlighted
</p>
</CardHeader>
<div className="mt-4 h-52">
<ResponsiveContainer width="100%" height="100%">
<LineChart data={riskCurve} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
<CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 18%)" />
<XAxis
dataKey="x"
tick={{ fill: 'hsl(220 14% 55%)', fontSize: 11 }}
axisLine={false}
tickLine={false}
label={{
value: inputs.mode === 'whale-exit' ? 'Wallets' : '% Input',
position: 'insideBottomRight',
offset: -4,
style: { fill: 'hsl(220 14% 45%)', fontSize: 10 },
}}
/>
<YAxis domain={[0, 100]} tick={{ fill: 'hsl(220 14% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
<Tooltip
contentStyle={{ background: 'hsl(220 14% 10%)', border: '1px solid hsl(220 13% 20%)', borderRadius: 8, fontSize: 12 }}
labelStyle={{ color: 'hsl(220 10% 80%)' }}
formatter={(v: number) => [`${v}`, 'Fragility']}
labelFormatter={(x) => `Input: ${x}`}
/>
{/* Reference dot for current value */}
<Line
type="monotone"
dataKey="fragility"
stroke={CHART_COLORS.after}
strokeWidth={2}
dot={(props) => {
const { cx, cy, payload } = props as { cx: number; cy: number; payload: { x: number } };
const isCurrent = payload.x === currentX;
return (
<circle
key={`dot-${payload.x}`}
cx={cx}
cy={cy}
r={isCurrent ? 6 : 3}
fill={isCurrent ? CHART_COLORS.after : 'hsl(220 14% 20%)'}
stroke={CHART_COLORS.after}
strokeWidth={isCurrent ? 2 : 1}
/>
);
}}
/>
</LineChart>
</ResponsiveContainer>
</div>
</Card>
</div>

{/* ── Pie + Metrics row ───────────────────────────────────────────────── */}
<div className="grid lg:grid-cols-[280px_1fr] gap-6">

{/* Pie: Fragility composition */}
<Card>
<CardHeader>
<CardTitle>Index Composition</CardTitle>
<p className="text-xs text-muted-foreground mt-1">Weighted contribution of each risk factor</p>
</CardHeader>
<div className="mt-2 h-52">
<ResponsiveContainer width="100%" height="100%">
<PieChart>
<Pie
data={pieData}
cx="50%"
cy="50%"
innerRadius={45}
outerRadius={75}
paddingAngle={3}
dataKey="value"
>
{pieData.map((_, i) => (
<Cell key={i} fill={pieColors[i]} />
))}
</Pie>
<Tooltip
contentStyle={{ background: 'hsl(220 14% 10%)', border: '1px solid hsl(220 13% 20%)', borderRadius: 8, fontSize: 12 }}
/>
<Legend wrapperStyle={{ fontSize: 10, color: 'hsl(220 14% 55%)' }} />
</PieChart>
</ResponsiveContainer>
</div>
</Card>

{/* Risk Breakdown metrics */}
<Card className="space-y-4">
<CardHeader>
<CardTitle>Risk Breakdown</CardTitle>
</CardHeader>
<div className="divide-y divide-border">
{[
{
label: 'Liquidity Impact',
description: 'Change in available trading liquidity after the scenario',
value: result.liquidityImpact,
color: result.liquidityImpact > 50 ? 'text-red-400' : result.liquidityImpact > 25 ? 'text-yellow-400' : 'text-green-400',
barColor: result.liquidityImpact > 50 ? 'bg-red-500' : result.liquidityImpact > 25 ? 'bg-yellow-400' : 'bg-green-500',
},
{
label: 'Concentration Change',
description: 'Shift in top-holder share relative to circulating supply',
value: result.concentrationImpact,
color: result.concentrationImpact > 30 ? 'text-red-400' : result.concentrationImpact > 15 ? 'text-yellow-400' : 'text-green-400',
barColor: result.concentrationImpact > 30 ? 'bg-red-500' : result.concentrationImpact > 15 ? 'bg-yellow-400' : 'bg-green-500',
},
{
label: 'Volatility Risk',
description: 'Estimated price volatility amplification under this scenario',
value: result.volatilityRisk,
color: result.volatilityRisk > 40 ? 'text-red-400' : result.volatilityRisk > 20 ? 'text-yellow-400' : 'text-green-400',
barColor: result.volatilityRisk > 40 ? 'bg-red-500' : result.volatilityRisk > 20 ? 'bg-yellow-400' : 'bg-green-500',
},
{
label: 'Stability Score',
description: 'Composite stability — higher is better (100 − Fragility Index)',
value: result.stabilityScore,
color: result.stabilityScore > 70 ? 'text-green-400' : result.stabilityScore > 40 ? 'text-yellow-400' : 'text-red-400',
barColor: result.stabilityScore > 70 ? 'bg-green-500' : result.stabilityScore > 40 ? 'bg-yellow-400' : 'bg-red-500',
},
].map((m) => (
<div key={m.label} className="flex items-center justify-between py-3.5 group">
<div className="space-y-0.5">
<p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{m.label}</p>
<p className="text-xs text-muted-foreground">{m.description}</p>
</div>
<div className="text-right min-w-[80px]">
<p className={`text-xl font-bold font-mono ${m.color}`}>{Math.round(m.value)}</p>
<div className="flex items-center justify-end gap-1 mt-1.5">
<div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
<div
className={`h-full rounded-full transition-all duration-700 ${m.barColor}`}
style={{ width: `${Math.min(100, Math.round(m.value))}%` }}
/>
</div>
</div>
</div>
</div>
))}
</div>
</Card>
</div>

{/* ── Before vs After table ───────────────────────────────────────────── */}
<div className="space-y-3">
<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Before vs After — Token Data</h2>
<div className="grid sm:grid-cols-2 gap-4">
<Card className="space-y-4 border-border hover:border-border/80 transition-colors">
<div className="flex items-center justify-between">
<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Before Simulation</p>
<span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border uppercase tracking-widest font-semibold">Actual</span>
</div>
<div className="space-y-3">
{[
{ row: 'Token', val: token?.symbol ?? '—' },
{ row: 'Price', val: fmtPrice(token?.price ?? null) },
{ row: 'Liquidity', val: fmtCurrency(token?.liquidity ?? null) },
{ row: 'Holder Count', val: token?.holder != null ? token.holder.toLocaleString() : '—' },
].map(({ row, val }) => (
<div key={row} className="flex items-center justify-between text-sm">
<span className="text-muted-foreground">{row}</span>
<span className="font-mono text-secondary-foreground">{val}</span>
</div>
))}
</div>
<div className="border border-dashed border-border rounded-lg px-4 py-3">
<p className="text-xs text-muted-foreground text-center">Pre-stress baseline · Live data from Birdeye</p>
</div>
</Card>

<Card className="space-y-4 border-primary/20 hover:border-primary/40 transition-colors">
<div className="flex items-center justify-between">
<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">After Simulation</p>
<span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest font-semibold">Projected</span>
</div>
<div className="space-y-3">
{[
{ row: 'Token', val: token?.symbol ?? '—' },
{ row: 'Price', val: '— (not predicted)' },
{ row: 'Liquidity', val: afterLiquidity !== null ? fmtCurrency(afterLiquidity) : `−${Math.round(result.liquidityImpact)}%` },
{
row: 'Holder Count',
val: afterHolders !== null
? afterHolders.toLocaleString()
: inputs.mode === 'redistribution'
? 'Redistributed'
: '—',
},
].map(({ row, val }) => (
<div key={row} className="flex items-center justify-between text-sm">
<span className="text-muted-foreground">{row}</span>
<span className="font-mono text-primary">{val}</span>
</div>
))}
</div>
<div className="border border-dashed border-primary/20 rounded-lg px-4 py-3">
<p className="text-xs text-primary/70 text-center">
Fragility: {result.fragilityIndex}/100 · {result.riskLabel}
</p>
</div>
</Card>
</div>
</div>

{/* ── Why this result? ────────────────────────────────────────────────── */}
<Card className="space-y-3 border-primary/20 bg-primary/5">
<CardHeader>
<div className="flex items-center gap-2">
<span className="text-lg">🧠</span>
<CardTitle>Why this result?</CardTitle>
</div>
</CardHeader>
<p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
<div className="pt-1 border-t border-border/50">
<p className="text-[11px] text-muted-foreground font-mono">
Formula: Fragility = 0.4×concentration + 0.3×liquidity + 0.2×volatility + 0.1×(100−recovery) · All values deterministic, no AI.
</p>
</div>
</Card>

{/* ── Scenario Parameters ─────────────────────────────────────────────── */}
<Card className="space-y-3">
<CardHeader>
<CardTitle>Scenario Parameters Used</CardTitle>
</CardHeader>
<div className="divide-y divide-border">
{result.breakdown.map((item) => (
<div key={item.label} className="flex items-center justify-between py-2.5">
<span className="text-xs text-muted-foreground">{item.label}</span>
<span className="text-xs font-mono text-foreground">
{item.value} <span className="text-muted-foreground/60">{item.unit}</span>
</span>
</div>
))}
</div>
<p className="text-[10px] text-muted-foreground pt-1">
All values are deterministic — derived from your input parameters using fixed formulas. No randomness or AI involved.
</p>
</Card>

{/* ── Footer trust bar ────────────────────────────────────────────────── */}
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border rounded-xl px-6 py-5">
<div className="space-y-1">
<div className="flex items-center gap-2">
<span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Powered by</span>
<a
href="https://birdeye.so"
target="_blank"
rel="noopener noreferrer"
className="text-xs font-bold text-primary hover:underline"
>
Birdeye ↗
</a>
</div>
<p className="text-[11px] text-muted-foreground max-w-lg">
This tool simulates structural scenarios and does not predict exact market prices.
Results are based on deterministic formulas applied to real on-chain data.
</p>
</div>
<div className="flex items-center gap-2 shrink-0">
<ExportButtons
tokenName={token?.name ?? null}
tokenSymbol={token?.symbol ?? null}
address={address}
mode={inputs.mode}
modeLabel={modeLabel}
result={result}
explanation={explanation}
afterLiquidity={afterLiquidity}
afterHolders={afterHolders}
/>
<Link
href={simBackUrl}
className="text-sm px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all"
>
Run again →
</Link>
</div>
</div>

</div>
);
}
