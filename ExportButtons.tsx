'use client';

import { useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { SimResult, SimMode } from '@/lib/simulation';
import ExportCard from './ExportCard';

/* Lazy-load heavy libs so they don't bloat the initial bundle */
const loadHtml2Canvas = () => import('html2canvas').then((m) => m.default);
const loadJsPDF = () => import('jspdf').then((m) => m.jsPDF);

interface Props {
tokenName: string | null;
tokenSymbol: string | null;
address: string;
mode: SimMode;
modeLabel: string;
result: SimResult;
explanation: string;
afterLiquidity: number | null;
afterHolders: number | null;
}

type ExportState = 'idle' | 'loading' | 'done' | 'error';

function fmtCurrency(v: number | null): string {
if (v === null) return '—';
if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
if (v >= 1_000) return `$${(v / 1_000).toFixed(2)}K`;
return `$${v.toFixed(2)}`;
}

export default function ExportButtons({
tokenName,
tokenSymbol,
address,
mode,
modeLabel,
result,
explanation,
afterLiquidity,
afterHolders,
}: Props) {
const cardRef = useRef<HTMLDivElement>(null);
const [imgState, setImgState] = useState<ExportState>('idle');
const [pdfState, setPdfState] = useState<ExportState>('idle');

/* ── Share as Image ───────────────────────────────────────────────────── */
const handleShareImage = useCallback(async () => {
if (!cardRef.current) return;
setImgState('loading');
try {
const html2canvas = await loadHtml2Canvas();
const canvas = await html2canvas(cardRef.current, {
scale: 1,
useCORS: true,
backgroundColor: '#0a0b0f',
logging: false,
width: 1200,
height: 675,
});
const dataUrl = canvas.toDataURL('image/png');
const a = document.createElement('a');
a.href = dataUrl;
a.download = `tokenstress-${tokenSymbol ?? 'token'}-${mode}.png`;
a.click();
setImgState('done');
setTimeout(() => setImgState('idle'), 2500);
} catch {
setImgState('error');
setTimeout(() => setImgState('idle'), 3000);
}
}, [tokenSymbol, mode]);

/* ── Download PDF ─────────────────────────────────────────────────────── */
const handleDownloadPDF = useCallback(async () => {
setPdfState('loading');
try {
const jsPDF = await loadJsPDF();
const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

const W = 210;
const margin = 20;
const col = margin;
let y = margin;

/* ── helpers ── */
const text = (str: string, x: number, yPos: number, opts?: Parameters<typeof doc.text>[3]) =>
doc.text(str, x, yPos, opts);
const line = (x1: number, y1: number, x2: number, y2: number) =>
doc.line(x1, y1, x2, y2);
const setFont = (style: 'normal' | 'bold') => doc.setFont('helvetica', style);
const setSize = (s: number) => doc.setFontSize(s);
const setColor = (r: number, g: number, b: number) => doc.setTextColor(r, g, b);
const setDrawColor = (r: number, g: number, b: number) => doc.setDrawColor(r, g, b);

/* ── Header bar ── */
doc.setFillColor(15, 17, 24);
doc.rect(0, 0, W, 38, 'F');

setFont('bold');
setSize(22);
setColor(251, 146, 60); // amber
text('TokenStress', col, 18);

setFont('normal');
setSize(9);
setColor(107, 114, 128);
text('Structural Risk Simulation Report', col, 26);
text(`Generated ${new Date().toUTCString()}`, col, 32);

y = 50;

/* ── Token section ── */
setFont('bold');
setSize(16);
setColor(240, 244, 248);
text(tokenName ?? '—', col, y);

setFont('normal');
setSize(10);
setColor(107, 114, 128);
if (tokenSymbol) {
text(tokenSymbol, col + doc.getTextWidth(tokenName ?? '—') + 4, y);
}
y += 6;

setSize(8);
setColor(75, 85, 99);
text(address || '—', col, y);
y += 10;

/* ── Scenario pill ── */
doc.setFillColor(40, 42, 55);
doc.roundedRect(col, y - 5, 58, 10, 2, 2, 'F');
setFont('bold');
setSize(9);
setColor(200, 210, 220);
text(`Scenario: ${modeLabel}`, col + 4, y + 1.5);
y += 14;

/* ── Fragility Index ── */
setDrawColor(251, 146, 60);
doc.setLineWidth(0.5);
line(col, y, W - margin, y);
y += 8;

setFont('bold');
setSize(13);
setColor(200, 210, 220);
text('FRAGILITY INDEX', col, y);
y += 8;

setFont('bold');
setSize(40);
setColor(251, 146, 60);
text(`${result.fragilityIndex}`, col, y + 6);

setFont('bold');
setSize(11);
setColor(200, 210, 220);
text(`/ 100`, col + 28, y + 6);

setFont('normal');
setSize(10);
setColor(156, 163, 175);
text(`Risk Level: `, col + 50, y + 2);
setFont('bold');
setColor(240, 244, 248);
text(result.riskLabel, col + 50 + doc.getTextWidth('Risk Level: '), y + 2);
y += 20;

/* ── Metrics table ── */
setDrawColor(55, 65, 81);
doc.setLineWidth(0.3);
line(col, y, W - margin, y);
y += 8;

setFont('bold');
setSize(11);
setColor(200, 210, 220);
text('Key Metrics', col, y);
y += 8;

const metrics: [string, string][] = [
['Liquidity Impact',     `${Math.round(result.liquidityImpact)}%`     ],
['Concentration Change', `${Math.round(result.concentrationImpact)}%` ],
['Volatility Risk',      `${Math.round(result.volatilityRisk)}%`       ],
['Stability Score',      `${result.stabilityScore} / 100`              ],
['Recovery Factor',      `${result.recoveryFactor} / 100`              ],
];

metrics.forEach(([label, value]) => {
setFont('normal');
setSize(9);
setColor(107, 114, 128);
text(label, col + 4, y);
setFont('bold');
setColor(240, 244, 248);
text(value, W - margin, y, { align: 'right' });
y += 7;
});
y += 4;

/* ── Before vs After ── */
line(col, y, W - margin, y);
y += 8;

setFont('bold');
setSize(11);
setColor(200, 210, 220);
text('Before vs After', col, y);
y += 8;

const beforeAfter: [string, string, string][] = [
['Metric',           'Before',                                              'After (Projected)'],
['Liquidity',        fmtCurrency(null),                                     afterLiquidity !== null ? fmtCurrency(afterLiquidity) : `−${Math.round(result.liquidityImpact)}%`],
['Holder Count',     '—',                                                   afterHolders !== null ? afterHolders.toLocaleString() : '—'],
['Concentration',    '100 (baseline)',                                      `${Math.max(0, 100 - result.concentrationImpact)} (−${Math.round(result.concentrationImpact)}%)`],
['Stability',        '100 (baseline)',                                      `${result.stabilityScore}`],
];

beforeAfter.forEach(([label, before, after], i) => {
if (i === 0) {
setFont('bold');
setSize(8);
setColor(107, 114, 128);
} else {
setFont('normal');
setSize(9);
setColor(200, 210, 220);
}
text(label, col + 4, y);
text(before, col + 68, y, { align: 'center' });
text(after, W - margin, y, { align: 'right' });
y += 7;
});
y += 4;

/* ── Scenario Parameters ── */
line(col, y, W - margin, y);
y += 8;

setFont('bold');
setSize(11);
setColor(200, 210, 220);
text('Simulation Parameters', col, y);
y += 8;

result.breakdown.forEach(({ label, value, unit }) => {
setFont('normal');
setSize(9);
setColor(107, 114, 128);
text(label, col + 4, y);
setFont('bold');
setColor(240, 244, 248);
text(`${value} ${unit}`, W - margin, y, { align: 'right' });
y += 7;
});
y += 4;

/* ── Explanation ── */
line(col, y, W - margin, y);
y += 8;

setFont('bold');
setSize(11);
setColor(200, 210, 220);
text('Why this result?', col, y);
y += 7;

setFont('normal');
setSize(8.5);
setColor(107, 114, 128);
const wrapped = doc.splitTextToSize(explanation, W - margin * 2 - 4);
wrapped.forEach((line_: string) => {
if (y > 270) {
doc.addPage();
y = margin;
}
text(line_, col + 4, y);
y += 5.5;
});
y += 6;

/* ── Footer ── */
if (y > 258) { doc.addPage(); y = margin; }
line(col, y, W - margin, y);
y += 7;

setFont('normal');
setSize(7.5);
setColor(75, 85, 99);
text('Powered by Birdeye  ·  TokenStress', col, y);
text(
'This tool simulates structural scenarios and does not predict exact market prices.',
W - margin,
y,
{ align: 'right' }
);

doc.save(`tokenstress-report-${tokenSymbol ?? 'token'}-${mode}.pdf`);
setPdfState('done');
setTimeout(() => setPdfState('idle'), 2500);
} catch {
setPdfState('error');
setTimeout(() => setPdfState('idle'), 3000);
}
}, [tokenName, tokenSymbol, address, mode, modeLabel, result, explanation, afterLiquidity, afterHolders]);

/* ── Render ─────────────────────────────────────────────────────────── */
return (
<>
{/* Hidden export card — captured by html2canvas */}
<div
style={{
position: 'fixed',
top: '-9999px',
left: '-9999px',
width: 1200,
height: 675,
pointerEvents: 'none',
zIndex: -1,
}}
aria-hidden="true"
>
<ExportCard
ref={cardRef}
tokenName={tokenName}
tokenSymbol={tokenSymbol}
address={address}
mode={mode}
result={result}
/>
</div>

{/* Visible export buttons */}
<div className="flex items-center gap-3">
{/* Share as Image */}
<button
onClick={handleShareImage}
disabled={imgState === 'loading'}
className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-lg border border-border bg-foreground/8 text-foreground font-semibold hover:bg-foreground/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
>
{imgState === 'loading' && (
<svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
</svg>
)}
{imgState === 'done'    ? '✓ Image saved'    :
imgState === 'error'   ? '✗ Failed'         :
imgState === 'loading' ? 'Capturing…'       :
'🖼 Share as Image'}
</button>

{/* Download PDF */}
<button
onClick={handleDownloadPDF}
disabled={pdfState === 'loading'}
className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
>
{pdfState === 'loading' && (
<svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
</svg>
)}
{pdfState === 'done'    ? '✓ PDF saved'    :
pdfState === 'error'   ? '✗ Failed'       :
pdfState === 'loading' ? 'Building PDF…'  :
'📄 Download PDF'}
</button>
</div>
</>
);
}
