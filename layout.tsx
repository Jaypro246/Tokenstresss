import type { ReactNode } from 'react';
import { Providers } from '@/components/providers';
import { Nav } from '@/components/nav';
import './globals.css';

export const metadata = {
title: 'TokenStress — Token Risk Simulator',
description: 'Structural risk simulator for Solana tokens. Test whale exits, liquidity shocks, and more.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
return (
<html lang="en">
<body>
<Providers>
<div className="min-h-screen bg-background text-foreground">
<Nav />
<main>{children}</main>
</div>
</Providers>
</body>
</html>
);
}
