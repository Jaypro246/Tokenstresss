import Link from 'next/link';

export function Nav() {
return (
<header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-50">
<div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
<Link href="/" className="flex items-center gap-2 group">
<span className="text-primary text-lg font-bold tracking-tight">
Token<span className="text-foreground">Stress</span>
</span>
<span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 uppercase tracking-widest">
Beta
</span>
</Link>
<nav className="flex items-center gap-6 text-sm text-muted-foreground">
<Link href="/" className="hover:text-foreground transition-colors">Home</Link>
<Link href="/simulation" className="hover:text-foreground transition-colors">Simulate</Link>
<Link href="/results" className="hover:text-foreground transition-colors">Results</Link>
</nav>
</div>
</header>
);
}
