'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface Token {
address: string;
symbol: string | null;
name: string | null;
logoURI: string | null;
liquidity: number | null;
price?: number | null;
priceChange24h?: number | null;
}

function truncateAddress(addr: string) {
return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatLiquidity(value: number): string {
if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
return `${value.toFixed(0)}`;
}

function TokenAvatar({ logoURI, symbol }: { logoURI: string | null; symbol: string | null }) {
const [imgError, setImgError] = useState(false);
if (logoURI && !imgError) {
return (
// eslint-disable-next-line @next/next/no-img-element
<img
src={logoURI}
alt={symbol ?? 'token'}
className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
onError={() => setImgError(true)}
/>
);
}
return (
<div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
<span className="text-[10px] font-bold text-muted-foreground uppercase">
{symbol ? symbol.slice(0, 2) : '?'}
</span>
</div>
);
}

export function NewTokensFeed() {
const router = useRouter();
const [tokens, setTokens] = useState<Token[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
let cancelled = false;

async function load() {
try {
const res = await fetch('/api/birdeye/new-tokens');
const data = (await res.json()) as { ok: boolean; tokens?: Token[]; error?: string };
if (cancelled) return;
if (!data.ok || !Array.isArray(data.tokens)) {
setError('Unable to load tokens');
} else {
setTokens(data.tokens);
}
} catch {
if (!cancelled) setError('Unable to load tokens');
} finally {
if (!cancelled) setLoading(false);
}
}

void load();
return () => {
cancelled = true;
};
}, []);

if (loading) {
return (
<div className="space-y-2">
{[1, 2, 3, 4, 5].map((i) => (
<div
key={i}
className="flex items-center gap-3 p-4 border border-border rounded-lg bg-card animate-pulse"
>
<div className="w-9 h-9 rounded-full bg-muted shrink-0" />
<div className="flex-1 space-y-2">
<div className="h-3 bg-muted rounded w-1/3" />
<div className="h-2.5 bg-muted rounded w-1/4" />
</div>
<div className="h-5 w-10 bg-muted rounded-full" />
</div>
))}
</div>
);
}

if (error) {
return (
<div className="text-center py-10 border border-dashed border-border rounded-lg bg-card/40">
<p className="text-muted-foreground text-sm font-medium">Unable to load tokens</p>
<p className="text-xs text-muted-foreground/60 mt-1">Data unavailable — check back later</p>
</div>
);
}

if (tokens.length === 0) {
return (
<div className="text-center py-10 border border-dashed border-border rounded-lg bg-card/40">
<p className="text-muted-foreground text-sm">No tokens returned</p>
</div>
);
}

return (
<div className="space-y-2">
{tokens.map((token) => (
<button
key={token.address}
onClick={() => router.push(`/token/${encodeURIComponent(token.address)}`)}
className="w-full flex items-center gap-3 p-4 border border-border rounded-lg bg-card hover:border-primary/40 hover:bg-card/80 transition-all text-left cursor-pointer group"
>
<TokenAvatar logoURI={token.logoURI} symbol={token.symbol} />
<div className="flex-1 min-w-0">
<p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
{token.name ?? 'Unknown'}
</p>
<p className="text-xs text-muted-foreground mt-0.5">
<span className="font-mono">{token.symbol ?? '—'}</span>
<span className="mx-1.5 text-muted-foreground">·</span>
<span className="font-mono text-muted-foreground">{truncateAddress(token.address)}</span>
</p>
</div>
<div className="flex flex-col items-end gap-0.5 shrink-0">
{/* Liquidity — always available for new listings */}
{token.liquidity !== null && token.liquidity > 0 ? (
<>
<span className="text-sm font-mono font-semibold text-green-400">
{formatLiquidity(token.liquidity)}
</span>
<span className="text-[10px] text-muted-foreground uppercase tracking-wide">Liquidity</span>
</>
) : (
<Badge label="New" variant="new" />
)}
</div>
</button>
))}
</div>
);
}
