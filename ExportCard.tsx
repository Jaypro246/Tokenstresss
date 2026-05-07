'use client';

import React from 'react';
import type { SimResult, SimMode } from '@/lib/simulation';

interface ExportCardProps {
tokenName: string | null;
tokenSymbol: string | null;
address: string;
mode: SimMode;
result: SimResult;
}

const MODE_LABELS: Record<SimMode, string> = {
'whale-exit': 'Whale Exit',
'liquidity-shock': 'Liquidity Shock',
redistribution: 'Redistribution',
};

const RISK_PALETTE: Record<SimResult['riskLabel'], { ring: string; badge: string; text: string; bg: string }> = {
Strong:   { ring: '#4ade80', badge: '#14532d', text: '#4ade80',  bg: 'rgba(74,222,128,0.08)' },
Moderate: { ring: '#facc15', badge: '#713f12', text: '#facc15',  bg: 'rgba(250,204,21,0.08)' },
Fragile:  { ring: '#fb923c', badge: '#7c2d12', text: '#fb923c',  bg: 'rgba(251,146,60,0.08)' },
Critical: { ring: '#f87171', badge: '#7f1d1d', text: '#f87171',  bg: 'rgba(248,113,113,0.08)' },
};

/**
* A self-contained, fixed-size card rendered in the DOM (but visually hidden)
* so html2canvas can capture it into a PNG.
* Size: 1200×675 (16:9) — Twitter/X card optimal.
*/
const ExportCard = React.forwardRef<HTMLDivElement, ExportCardProps>(
({ tokenName, tokenSymbol, address, mode, result }, ref) => {
const pal = RISK_PALETTE[result.riskLabel];
const modeLabel = MODE_LABELS[mode];
const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '—';

const metrics = [
{ label: 'Liquidity Impact',     value: `${Math.round(result.liquidityImpact)}%`     },
{ label: 'Concentration Change', value: `${Math.round(result.concentrationImpact)}%` },
{ label: 'Stability Score',      value: `${result.stabilityScore}`                   },
{ label: 'Volatility Risk',      value: `${Math.round(result.volatilityRisk)}%`       },
];

return (
<div
ref={ref}
style={{
width: 1200,
height: 675,
background: '#0a0b0f',
fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
display: 'flex',
flexDirection: 'column',
justifyContent: 'space-between',
padding: '64px 72px',
boxSizing: 'border-box',
position: 'relative',
overflow: 'hidden',
}}
>
{/* Ambient glow */}
<div style={{
position: 'absolute',
top: -120,
right: -120,
width: 480,
height: 480,
borderRadius: '50%',
background: `radial-gradient(circle, ${pal.ring}18 0%, transparent 70%)`,
pointerEvents: 'none',
}} />

{/* Top row: scenario label + token info */}
<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
<div>
<div style={{
display: 'inline-flex',
alignItems: 'center',
gap: 8,
background: 'rgba(255,255,255,0.06)',
border: '1px solid rgba(255,255,255,0.1)',
borderRadius: 8,
padding: '6px 14px',
marginBottom: 20,
}}>
<span style={{ fontSize: 11, color: '#8892a0', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
Scenario
</span>
<span style={{ fontSize: 11, color: '#c8d0dc', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
{modeLabel}
</span>
</div>
<div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
<h1 style={{ fontSize: 42, fontWeight: 800, color: '#f0f4f8', margin: 0, lineHeight: 1 }}>
{tokenName ?? '—'}
</h1>
{tokenSymbol && (
<span style={{ fontSize: 20, fontWeight: 600, color: '#8892a0' }}>{tokenSymbol}</span>
)}
</div>
<p style={{ fontSize: 13, color: '#4b5563', fontFamily: 'monospace', marginTop: 8 }}>{shortAddr}</p>
</div>

{/* Fragility ring */}
<div style={{ textAlign: 'center' }}>
<div style={{
width: 140,
height: 140,
borderRadius: '50%',
border: `5px solid ${pal.ring}`,
display: 'flex',
flexDirection: 'column',
alignItems: 'center',
justifyContent: 'center',
background: pal.bg,
boxShadow: `0 0 40px ${pal.ring}30`,
}}>
<span style={{ fontSize: 48, fontWeight: 900, color: '#f0f4f8', lineHeight: 1 }}>
{result.fragilityIndex}
</span>
<span style={{ fontSize: 11, color: '#8892a0', marginTop: 2 }}>/ 100</span>
</div>
<div style={{
marginTop: 12,
display: 'inline-block',
background: pal.badge,
border: `1px solid ${pal.ring}50`,
borderRadius: 6,
padding: '5px 16px',
}}>
<span style={{ fontSize: 13, fontWeight: 700, color: pal.text, letterSpacing: '0.04em' }}>
{result.riskLabel}
</span>
</div>
</div>
</div>

{/* Divider */}
<div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 0 4px' }} />

{/* Metrics grid */}
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
{metrics.map((m) => (
<div key={m.label} style={{
background: 'rgba(255,255,255,0.04)',
border: '1px solid rgba(255,255,255,0.08)',
borderRadius: 12,
padding: '20px 22px',
}}>
<p style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
{m.label}
</p>
<p style={{ fontSize: 32, fontWeight: 800, color: '#f0f4f8', margin: '10px 0 0', fontFamily: 'monospace' }}>
{m.value}
</p>
</div>
))}
</div>

{/* Footer */}
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
<div style={{
background: 'rgba(255,165,0,0.15)',
border: '1px solid rgba(255,165,0,0.3)',
borderRadius: 8,
padding: '6px 14px',
}}>
<span style={{ fontSize: 14, fontWeight: 800, color: '#fb923c', letterSpacing: '0.06em' }}>
TokenStress
</span>
</div>
<span style={{ fontSize: 12, color: '#374151' }}>·</span>
<span style={{ fontSize: 12, color: '#374151' }}>Powered by Birdeye</span>
</div>
<p style={{ fontSize: 11, color: '#374151', maxWidth: 420, textAlign: 'right', lineHeight: 1.5, margin: 0 }}>
Structural simulation only — does not predict exact market prices.
</p>
</div>
</div>
);
}
);

ExportCard.displayName = 'ExportCard';

export default ExportCard;
