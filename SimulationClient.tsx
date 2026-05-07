'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

/* ─── Scenario definitions ─────────────────────────────────────────────── */

const MODES = [
{
id: 'whale-exit' as const,
label: 'Whale Exit',
emoji: '🐋',
tagLabel: 'High Risk',
tagColor: 'text-red-400 bg-red-500/10 border-red-500/20',
accentColor: 'hsl(var(--primary))',
glowColor: 'rgba(251,146,60,0.18)',
description: 'Simulate structural stress caused by large holder exits. Models the cascading effect when top wallets liquidate simultaneously.',
controls: [
{ key: 'holders', label: 'Top holders removed', min: 1, max: 5, step: 1, default: 3, unit: 'wallets' },
],
},
{
id: 'liquidity-shock' as const,
label: 'Liquidity Shock',
emoji: '💧',
tagLabel: 'Critical',
tagColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
accentColor: '#38bdf8',
glowColor: 'rgba(56,189,248,0.14)',
description: 'Model the impact of a sudden DEX liquidity drain. Tests how the token holds under pool instability and thin order books.',
controls: [
{ key: 'liquidityPct', label: 'Liquidity removed', min: 0, max: 100, step: 5, default: 50, unit: '%' },
],
},
{
id: 'redistribution' as const,
label: 'Redistribution',
emoji: '🔀',
tagLabel: 'Moderate',
tagColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
accentColor: '#a78bfa',
glowColor: 'rgba(167,139,250,0.14)',
description: 'Analyse the effect of a mass token redistribution across holder tiers. Useful for assessing concentration dilution.',
controls: [
{ key: 'redistributionPct', label: 'Amount redistributed', min: 0, max: 100, step: 5, default: 30, unit: '%' },
],
},
] as const;

type ModeId = (typeof MODES)[number]['id'];

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function SimulationClient() {
const router = useRouter();
const searchParams = useSearchParams();
const address = searchParams.get('address') ?? '';

const [activeModeId, setActiveModeId] = useState<ModeId | null>(null);
const [values, setValues] = useState<Record<string, number>>(
Object.fromEntries(MODES.flatMap((m) => m.controls.map((c) => [c.key, c.default])))
);

const activeMode = MODES.find((m) => m.id === activeModeId) ?? null;
const tokenBack = address ? `/token/${address}` : '/';

function handleSlider(key: string, value: number) {
setValues((prev) => ({ ...prev, [key]: value }));
}

function runSimulation() {
if (!activeModeId) return;
const params = new URLSearchParams({ mode: activeModeId, address });
if (activeModeId === 'whale-exit') params.set('holders', String(values.holders));
if (activeModeId === 'liquidity-shock') params.set('liquidityPct', String(values.liquidityPct));
if (activeModeId === 'redistribution') params.set('redistributionPct', String(values.redistributionPct));
router.push(`/results?${params.toString()}`);
}

return (
<>
{/* Scoped animation styles */}
<style>{`
.scenario-card {
transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
}
.scenario-card:hover {
transform: translateY(-3px);
}
.controls-reveal {
animation: revealDown 260ms cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes revealDown {
from { opacity: 0; transform: translateY(-10px); }
to   { opacity: 1; transform: translateY(0); }
}
.sim-range {
-webkit-appearance: none;
appearance: none;
height: 6px;
border-radius: 9999px;
outline: none;
cursor: pointer;
background: linear-gradient(
to right,
hsl(var(--primary)) 0%,
hsl(var(--primary)) var(--pct, 50%),
hsl(var(--muted)) var(--pct, 50%),
hsl(var(--muted)) 100%
);
}
.sim-range::-webkit-slider-thumb {
-webkit-appearance: none;
width: 18px; height: 18px;
border-radius: 50%;
background: hsl(var(--primary));
border: 2px solid hsl(var(--background));
box-shadow: 0 0 0 3px hsl(var(--primary) / 0.25);
cursor: pointer;
transition: box-shadow 120ms ease;
}
.sim-range::-webkit-slider-thumb:hover {
box-shadow: 0 0 0 5px hsl(var(--primary) / 0.35);
}
.sim-range::-moz-range-thumb {
width: 18px; height: 18px;
border-radius: 50%;
background: hsl(var(--primary));
border: 2px solid hsl(var(--background));
cursor: pointer;
}
`}</style>

<div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

{/* Breadcrumb */}
<nav className="text-xs text-muted-foreground flex items-center gap-2">
<Link href="/" className="hover:text-foreground transition-colors">Home</Link>
<span>/</span>
{address
? <Link href={tokenBack} className="hover:text-foreground transition-colors">Token Overview</Link>
: <span>Token Overview</span>}
<span>/</span>
<span className="text-foreground">Simulation</span>
</nav>

{/* Header */}
<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
<div>
<p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary mb-2">Risk Analysis</p>
<h1 className="text-3xl font-bold text-foreground tracking-tight">Stress Simulation</h1>
<p className="text-sm text-muted-foreground mt-2 max-w-lg">
Choose a stress scenario to model how structural changes affect this token's fragility.
</p>
</div>
{address && (
<div className="shrink-0 bg-card border border-border rounded-xl px-4 py-2.5 flex items-center gap-2.5">
<span className="size-2 rounded-full bg-primary/70 shrink-0" />
<span className="text-[10px] text-muted-foreground uppercase tracking-widest">Token</span>
<span className="text-xs font-mono text-secondary-foreground truncate max-w-[180px]">{address}</span>
</div>
)}
</div>

{/* ── Scenario Cards Grid ─────────────────────────────────────────── */}
<div>
<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Select Scenario</p>
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
{MODES.map((mode) => {
const isActive = activeModeId === mode.id;
return (
<button
key={mode.id}
onClick={() => setActiveModeId(isActive ? null : mode.id)}
className="scenario-card text-left rounded-2xl border p-5 flex flex-col gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
style={{
background: isActive
? `radial-gradient(ellipse at top left, ${mode.glowColor}, transparent 70%), hsl(var(--card))`
: 'hsl(var(--card))',
borderColor: isActive ? mode.accentColor : 'hsl(var(--border))',
boxShadow: isActive
? `0 0 0 1px ${mode.accentColor}40, 0 8px 32px ${mode.glowColor}`
: 'none',
}}
>
{/* Top row: emoji + checkmark */}
<div className="flex items-start justify-between">
<span
className="text-3xl leading-none p-2 rounded-xl"
style={{ background: isActive ? `${mode.glowColor}` : 'hsl(var(--muted) / 0.5)' }}
>
{mode.emoji}
</span>
{isActive && (
<span
className="size-6 rounded-full flex items-center justify-center text-xs font-bold"
style={{ background: mode.accentColor, color: '#0f0f0f' }}
>
✓
</span>
)}
</div>

{/* Label + tag */}
<div className="flex items-center gap-2 flex-wrap">
<span className="font-semibold text-foreground text-base">{mode.label}</span>
<span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${mode.tagColor}`}>
{mode.tagLabel}
</span>
</div>

{/* Description */}
<p className="text-xs text-muted-foreground leading-relaxed">{mode.description}</p>

{/* Select indicator */}
<div
className="mt-auto pt-1 text-[11px] font-medium transition-colors"
style={{ color: isActive ? mode.accentColor : 'hsl(var(--muted-foreground))' }}
>
{isActive ? '● Active scenario' : '○ Select scenario'}
</div>
</button>
);
})}
</div>
</div>

{/* ── Controls Panel (animated reveal) ────────────────────────────── */}
{activeMode && (
<div key={activeMode.id} className="controls-reveal space-y-6">

{/* Divider with label */}
<div className="flex items-center gap-3">
<div className="h-px flex-1 bg-border" />
<span className="text-xs text-muted-foreground uppercase tracking-widest px-2">
Configure — {activeMode.label}
</span>
<div className="h-px flex-1 bg-border" />
</div>

{/* Sliders card */}
<div className="rounded-2xl border border-border bg-card p-6 space-y-8">
{activeMode.controls.map((control) => {
const pct = ((values[control.key] - control.min) / (control.max - control.min)) * 100;
return (
<div key={control.key} className="space-y-3">
<div className="flex items-center justify-between">
<label className="text-sm font-medium text-foreground">{control.label}</label>
<div
className="font-mono text-sm font-bold px-3 py-1 rounded-lg"
style={{ color: activeMode.accentColor, background: activeMode.glowColor }}
>
{values[control.key]}
<span className="text-xs font-normal text-muted-foreground ml-1">{control.unit}</span>
</div>
</div>

<input
type="range"
min={control.min}
max={control.max}
step={control.step}
value={values[control.key]}
onChange={(e) => handleSlider(control.key, Number(e.target.value))}
className="sim-range w-full"
style={{ '--pct': `${pct}%` } as React.CSSProperties}
/>

<div className="flex justify-between text-[11px] text-muted-foreground font-mono">
<span>{control.min} {control.unit}</span>
<span>{control.max} {control.unit}</span>
</div>
</div>
);
})}
</div>

{/* Formula transparency */}
<div className="rounded-2xl border border-border bg-card/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
<div className="text-xs text-muted-foreground font-mono space-y-0.5 flex-1">
<p className="text-foreground/70 font-semibold not-italic mb-1">Fragility Index formula</p>
<p>= (0.4 × concentration) + (0.3 × liquidity) + (0.2 × volatility) + (0.1 × recovery)</p>
<p className="text-muted-foreground mt-1">Normalised 0–100 · Deterministic · No AI</p>
</div>
<div className="shrink-0 text-[10px] font-semibold px-3 py-1.5 rounded-full border border-border text-muted-foreground">
Transparent
</div>
</div>

{/* Action row */}
<div className="flex justify-end gap-3 pt-1">
<Link
href={tokenBack}
className="px-5 py-2.5 rounded-xl text-sm text-muted-foreground border border-border hover:bg-secondary/60 transition-colors"
>
← Back
</Link>
<button
onClick={runSimulation}
className="bg-primary text-primary-foreground font-semibold px-8 py-2.5 rounded-xl text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
>
Run Simulation →
</button>
</div>
</div>
)}

{/* Placeholder when nothing is selected */}
{!activeMode && (
<div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground text-sm">
Select a scenario above to configure parameters and run the simulation.
</div>
)}

</div>
</>
);
}
