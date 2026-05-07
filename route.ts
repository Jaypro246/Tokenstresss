import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const runtime = 'edge';

interface Params {
params: Promise<{ address: string }>;
}

export async function GET(_req: Request, { params }: Params) {
const { address } = await params;
const { env } = await getCloudflareContext();
const apiKey = (env as unknown as { BIRDEYE_API_KEY?: string }).BIRDEYE_API_KEY;

if (!apiKey) {
return NextResponse.json({ ok: false, error: 'API key not configured' }, { status: 500 });
}

if (!address || address.trim().length === 0) {
return NextResponse.json({ ok: false, error: 'Missing address' }, { status: 400 });
}

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

if (!res.ok) {
return NextResponse.json(
{ ok: false, error: `Birdeye returned ${res.status}` },
{ status: 502 }
);
}

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

if (!json.success || !json.data) {
return NextResponse.json({ ok: false, error: 'Unexpected response shape' }, { status: 502 });
}

const d = json.data;
return NextResponse.json({
ok: true,
token: {
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
},
});
} catch {
return NextResponse.json({ ok: false, error: 'Failed to reach Birdeye' }, { status: 502 });
}
}
