export function SkeletonRow() {
return (
<div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-card animate-pulse">
<div className="w-9 h-9 rounded-full bg-muted shrink-0" />
<div className="flex-1 space-y-2">
<div className="h-3 bg-muted rounded w-1/3" />
<div className="h-2.5 bg-muted rounded w-1/5" />
</div>
<div className="h-5 w-10 bg-muted rounded" />
</div>
);
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
return (
<div className={`bg-muted rounded animate-pulse ${className}`} />
);
}
