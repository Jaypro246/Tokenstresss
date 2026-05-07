'use client';

import type { ReactNode } from 'react';

type VideoBackgroundProps = {
src: string;
poster?: string;
className?: string;
overlayClassName?: string;
children?: ReactNode;
};

/**
* Full-bleed ambient video background.
*
* Encodes the easy-to-miss rules for invisible-background bugs:
*   - Wrapper has `relative isolate` (own stacking context) and NO `bg-*`
*   - Video uses `absolute inset-0 z-0` (not `fixed`, not negative z-index)
*   - `autoplay loop muted playsInline` (browsers block autoplay without `muted`)
*   - Optional tint overlay sits above the video, below the content
*
* Use this for hero / page backgrounds where the video sits BEHIND content.
* Do NOT use this for inline product demos, hero thumbnails with controls,
* or modal videos — write a plain `<video>` for those cases.
*/
export function VideoBackground({
src,
poster,
className,
overlayClassName,
children,
}: VideoBackgroundProps) {
const wrapperClass = ['relative isolate min-h-screen overflow-hidden', className]
.filter(Boolean)
.join(' ');
const overlayClass = overlayClassName
? ['absolute inset-0 z-10', overlayClassName].join(' ')
: null;

return (
<div className={wrapperClass}>
<video
autoPlay
loop
muted
playsInline
poster={poster}
aria-hidden="true"
className="absolute inset-0 z-0 size-full object-cover"
>
<source src={src} />
</video>
{overlayClass ? <div className={overlayClass} /> : null}
<div className="relative z-20">{children}</div>
</div>
);
}
