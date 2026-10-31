import React from 'react';
import { cn } from '@/shared/ui/tenderrank/utils';

/**
 * TenderRank mark: three ascending bars (ranking/leaderboard) inside a
 * rounded square. Shared by Sidebar, PublicNavbar, and public/favicon.svg —
 * keep the glyph paths in sync with the favicon if this changes.
 */
export function LogoMark({ className, size = 32 }) {
  return (
    <div
      className={cn('flex items-center justify-center rounded-lg bg-primary shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="3" y="14" width="4.5" height="7" rx="1" className="fill-primary-foreground" />
        <rect x="9.75" y="9" width="4.5" height="12" rx="1" className="fill-primary-foreground" />
        <rect x="16.5" y="3" width="4.5" height="18" rx="1" className="fill-primary-foreground" />
      </svg>
    </div>
  );
}

export default function Logo({ className, iconSize = 30, showWordmark = true, wordmarkClassName }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={iconSize} />
      {showWordmark && (
        <span className={cn('text-sm font-bold tracking-tight text-foreground', wordmarkClassName)}>
          TenderRank
        </span>
      )}
    </div>
  );
}
