interface BadgeProps {
label: string;
variant?: 'new' | 'warning' | 'danger' | 'success' | 'default';
}

const variantStyles: Record<string, string> = {
new: 'bg-primary/15 text-primary border border-primary/30',
warning: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
danger: 'bg-destructive/15 text-red-400 border border-destructive/30',
success: 'bg-green-500/15 text-green-400 border border-green-500/30',
default: 'bg-secondary text-secondary-foreground border border-border',
};

export function Badge({ label, variant = 'default' }: BadgeProps) {
return (
<span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-widest ${variantStyles[variant]}`}>
{label}
</span>
);
}
