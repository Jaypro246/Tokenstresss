import Link from 'next/link';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
params: Promise<{ address: string }>;
}

interface TokenData {
address: string;
name: string | null;
symbol: string | null;
price: number | null;
liquidity: number | null;
marketCap: number | null;
logoURI: string | null;
holder: number | null;
trade24h: number | null;
volume24hUSD: number | null;
priceChange24hPercent: number | null;
}

async function fetchTokenOverview(address: string): Promise<TokenData | null> {
const { env } = await getCloudflareContext();
const apiKey = (env as unknown as { BIRDEYE_API_KEY?: string }).BIRDEYE_API_KEY;
if (!apiKey) return null;

try {
const res = await fetch(
`https://public-api.birdeye.so/defi/token_overview?address=${encodeURIComponent(address)}`,
{
headers: {
'x-api-key': apiKey,
'x-chain': 'solana',
accept: 'application/json',
},
}
);
if (!res.ok) return null;
const json = (await res.json()) as {
success: boolean;
data: {
address: string;
name: string;
symbol: string;
price: number;
liquidity: number;
marketCap: number;
logoURI?: string | null;
holder?: number;
trade24h?: number;
v24hUSD?: number;
priceChange24hPercent?: number;
};
};
if (!json.success || !json.data) return null;
const d = json.data;
return {
address: d.address,
name: d.name ?? null,
symbol: d.symbol ?? null,
price: d.price ?? null,
liquidity: d.liquidity ?? null,
marketCap: d.marketCap ?? null,
logoURI: d.logoURI ?? null,
holder: d.holder ?? null,
trade24h: d.trade24h ?? null,
volume24hUSD: d.v24hUSD ?? null,
priceChange24hPercent: d.priceChange24hPercent ?? null,
};
} catch {
return null;
}
}

function fmt(val: number | null, style: 'currency' | 'decimal' | 'percent' = 'decimal', decimals = 2): string {
if (val === null || val === undefined) return 'Data unavailable';
if (style === 'currency') {
if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B`;
if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
if (val >= 1_000) return `${(val / 1_000).toFixed(2)}K`;
return `${val.toFixed(decimals)}`;
}
if (style === 'percent') return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
return val.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

function fmtPrice(price: number | null): string {
if (price === null) return 'Data unavailable';
if (price < 0.000001) return `${price.toExponential(4)}`;
if (price < 0.01) return `${price.toFixed(8)}`;
if (price < 1) return `${price.toFixed(6)}`;
return `${price.toFixed(4)}`;
}

export default async function TokenOverviewPage({ params }: Props) {
const { address } = await params;
const token = await fetchTokenOverview(address);

const displayName = token?.name ?? 'Data unavailable';
const displaySymbol = token?.symbol ?? '—';
const priceChangePos = token?.priceChange24hPercent !== null && (token?.priceChange24hPercent ?? 0) >= 0;

return (
<div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

{/* Breadcrumb */}
<nav className="text-xs text-muted-foreground flex items-center gap-2">
<Link href="/" className="hover:text-foreground transition-colors">Home</Link>
<span>/</span>
<span className="text-foreground">Token Overview</span>
</nav>

{/* Token Header */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
<div className="flex items-center gap-4">
{token?.logoURI ? (
// eslint-disable-next-line @next/next/no-img-element
<img
src={token.logoURI}
alt={displaySymbol}
className="w-12 h-12 rounded-full object-cover border border-border"
/>
) : (
<div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center">
<span className="text-muted-foreground text-xs font-bold uppercase">
{token?.symbol ? token.symbol.slice(0, 2) : '?'}
</span>
</div>
)}
<div>
<div className="flex items-center gap-2">
<h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
{token && <Badge label={displaySymbol} variant="new" />}
{!token && <Badge label="Data unavailable" variant="default" />}
</div>
<p className="text-muted-foreground text-sm mt-0.5">
{token ? (
<>
<span className="font-mono font-semibold text-foreground">{fmtPrice(token.price)}</span>
{token.priceChange24hPercent !== null && (
<span className={`ml-2 text-xs ${priceChangePos ? 'text-green-400' : 'text-red-400'}`}>
{fmt(token.priceChange24hPercent, 'percent')} 24h
</span>
)}
</>
) : (
'Price: Data unavailable'
)}
</p>
</div>
</div>

{/* Address + Birdeye link */}
<div className="flex flex-col gap-2 max-w-xs w-full sm:w-auto">
<div className="bg-muted/40 border border-border rounded-lg px-4 py-2.5">
<p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Contract Address</p>
<p className="font-mono text-xs text-secondary-foreground break-all">{address}</p>
</div>
<a
href={`https://birdeye.so/token/${address}?chain=solana`}
target="_blank"
rel="noopener noreferrer"
className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg px-4 py-2 hover:bg-primary/10 transition-colors"
>
View on Birdeye ↗
</a>
</div>
</div>

{/* Summary Cards */}
<div className="grid sm:grid-cols-3 gap-4">
<SummaryCard
title="Liquidity"
description="Total available liquidity across pools"
icon="💧"
value={token ? fmt(token.liquidity, 'currency') : null}
/>
<SummaryCard
title="Market Cap"
description="Fully diluted market capitalisation"
icon="🐋"
value={token ? fmt(token.marketCap, 'currency') : null}
/>
<SummaryCard
title="24h Volume"
description="USD trade volume in the last 24 hours"
icon="📈"
value={token ? fmt(token.volume24hUSD, 'currency') : null}
/>
</div>

{/* Secondary metrics */}
{token && (
<div className="grid sm:grid-cols-2 gap-4">
<Card className="space-y-4">
<CardHeader>
<CardTitle>Token Details</CardTitle>
</CardHeader>
<dl className="space-y-3">
<MetricRow label="Holders" value={token.holder !== null ? fmt(token.holder) : 'Data unavailable'} />
<MetricRow label="24h Trades" value={token.trade24h !== null ? fmt(token.trade24h) : 'Data unavailable'} />
<MetricRow label="Price (USD)" value={fmtPrice(token.price)} />
<MetricRow label="24h Change" value={token.priceChange24hPercent !== null ? fmt(token.priceChange24hPercent, 'percent') : 'Data unavailable'} positive={priceChangePos} hasSign={token.priceChange24hPercent !== null} />
</dl>
</Card>

<Card className="space-y-4">
<CardHeader>
<CardTitle>Risk Indicators</CardTitle>
</CardHeader>
<div className="space-y-3">
<RiskIndicator label="Liquidity Depth" value={token.liquidity} thresholdLow={50_000} thresholdMed={500_000} fmt={(v) => fmt(v, 'currency')} />
<RiskIndicator label="Market Cap" value={token.marketCap} thresholdLow={100_000} thresholdMed={1_000_000} fmt={(v) => fmt(v, 'currency')} />
<p className="text-xs text-muted-foreground pt-2">
These structural signals feed into the Fragility Index on the results page.
</p>
</div>
</Card>
</div>
)}

{!token && (
<div className="text-center py-10 border border-dashed border-border rounded-lg bg-card/40">
<p className="text-muted-foreground text-sm font-medium">Data unavailable</p>
<p className="text-xs text-muted-foreground mt-1">Could not load token data from Birdeye. Check the address and try again.</p>
</div>
)}

{/* CTA */}
<div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-primary/20 rounded-xl p-6">
<div>
<h2 className="font-semibold text-foreground">Ready to run a stress test?</h2>
<p className="text-sm text-muted-foreground mt-1">
Select a scenario and adjust parameters to simulate how this token would react.
</p>
</div>
<Link
href={`/simulation?address=${encodeURIComponent(address)}`}
className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-lg text-sm hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
>
Run Simulation →
</Link>
</div>

</div>
);
}

function SummaryCard({
title, description, icon, value,
}: {
title: string; description: string; icon: string; value: string | null;
}) {
return (
<Card className="space-y-3 hover:border-border/80 transition-colors">
<div className="flex items-center justify-between">
<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
<span className="text-lg">{icon}</span>
</div>
<CardValue>{value ?? 'Data unavailable'}</CardValue>
<p className="text-xs text-muted-foreground">{description}</p>
</Card>
);
}

function MetricRow({ label, value, positive, hasSign }: { label: string; value: string; positive?: boolean; hasSign?: boolean }) {
return (
<div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
<span className="text-xs text-muted-foreground">{label}</span>
<span className={`text-xs font-medium ${hasSign ? (positive ? 'text-green-400' : 'text-red-400') : 'text-foreground'}`}>
{value}
</span>
</div>
);
}

function RiskIndicator({
label, value, thresholdLow, thresholdMed, fmt: fmtFn,
}: {
label: string;
value: number | null;
thresholdLow: number;
thresholdMed: number;
fmt: (v: number) => string;
}) {
if (value === null) {
return (
<div className="space-y-1">
<div className="flex items-center justify-between">
<span className="text-xs text-muted-foreground">{label}</span>
<span className="text-xs text-muted-foreground">Data unavailable</span>
</div>
<div className="h-1.5 bg-muted rounded-full" />
</div>
);
}

const level = value < thresholdLow ? 'high' : value < thresholdMed ? 'medium' : 'low';
const barColor = level === 'high' ? 'bg-red-500' : level === 'medium' ? 'bg-yellow-400' : 'bg-green-500';
const labelColor = level === 'high' ? 'text-red-400' : level === 'medium' ? 'text-yellow-400' : 'text-green-400';
const barPct = Math.min(100, (value / (thresholdMed * 2)) * 100);

return (
<div className="space-y-1.5">
<div className="flex items-center justify-between">
<span className="text-xs text-muted-foreground">{label}</span>
<div className="flex items-center gap-2">
<span className="text-xs text-secondary-foreground">{fmtFn(value)}</span>
<span className={`text-[10px] font-semibold uppercase ${labelColor}`}>{level} risk</span>
</div>
</div>
<div className="h-1.5 bg-muted rounded-full overflow-hidden">
<div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${barPct}%` }} />
</div>
</div>
);
}
