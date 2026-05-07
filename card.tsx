import type { ReactNode } from 'react';

interface CardProps {
children: ReactNode;
className?: string;
}

export function Card({ children, className = '' }: CardProps) {
return (
<div className={`bg-card border border-border rounded-lg p-5 ${className}`}>
{children}
</div>
);
}

export function CardHeader({ children, className = '' }: CardProps) {
return (
<div className={`mb-3 ${className}`}>{children}</div>
);
}

export function CardTitle({ children, className = '' }: CardProps) {
return (
<h3 className={`text-sm font-semibold text-muted-foreground uppercase tracking-wider ${className}`}>
{children}
</h3>
);
}

export function CardValue({ children, className = '' }: CardProps) {
return (
<p className={`text-3xl font-bold text-foreground mt-1 ${className}`}>{children}</p>
);
}
