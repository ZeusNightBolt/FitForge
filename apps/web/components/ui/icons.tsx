import * as React from 'react';

/**
 * FitForge icon set — a small, consistent family of stroke icons (1.75 stroke, round caps/joins),
 * replacing emoji so the UI reads as a designed product rather than a template. Icons inherit
 * `currentColor` and size via `1em`/props, so they take the surrounding text color and size.
 */
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

function Svg({ size = 24, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </Svg>
);

export const DumbbellIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.5 6.5 17.5 17.5" />
    <path d="m3 8 2-2M8 3l-2 2" transform="translate(-0.5 -0.5)" />
    <rect x="1.8" y="6.3" width="3.2" height="6" rx="1" transform="rotate(-45 3.4 9.3)" />
    <rect x="19" y="11.7" width="3.2" height="6" rx="1" transform="rotate(-45 20.6 14.7)" />
  </Svg>
);

export const AppleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 8c-1.5-1.5-4-2-5.5-.5C4.7 9 5 12.5 6.5 15.5 7.6 17.7 9 20 12 20s4.4-2.3 5.5-4.5C19 12.5 19.3 9 17.5 7.5 16 6 13.5 6.5 12 8Z" />
    <path d="M12 8c0-1.5.3-3.2 2-4" />
  </Svg>
);

export const TrendingUpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 16.5 9 10l4 4 8-8" />
    <path d="M16 6h5v5" />
  </Svg>
);

export const SettingsIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8 6 18M18 6l1.8-1.8" />
  </Svg>
);

export const FlameIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3c.5 3-2 4.2-2 7a2 2 0 1 0 4 0c1 1 1.5 2.2 1.5 3.5A5.5 5.5 0 0 1 6.5 13c0-3.3 2.5-4.8 3-7 .2-1 .3-2 2.5-3Z" />
  </Svg>
);

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12.5 9 17.5 20 6.5" />
  </Svg>
);

export const XIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6 18 18M18 6 6 18" />
  </Svg>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 5 8 12l7 7" />
  </Svg>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 5l7 7-7 7" />
  </Svg>
);

export const ScaleIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <path d="M8 8h8" />
    <circle cx="12" cy="14" r="3" />
    <path d="M12 14v-2.5" />
  </Svg>
);

export const UtensilsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3v7a2 2 0 0 0 2 2v9M8 3v6M4 3v6M17 3c-1.5 0-2.5 2-2.5 5S15.5 13 17 13v8" />
  </Svg>
);

export const BookIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5Z" />
    <path d="M5 19.5A1.5 1.5 0 0 1 6.5 21H19" />
  </Svg>
);

export const SparkleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M12 8.5 13 11l2.5 1-2.5 1-1 2.5-1-2.5L8.5 12 11 11Z" />
  </Svg>
);

export const TargetIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </Svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12h15M13 6l7 6-7 6" />
  </Svg>
);

export const TrophyIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0Z" />
    <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
    <path d="M12 14v3M9 21h6M10 21c0-1.5.7-2.5 2-3 1.3.5 2 1.5 2 3" />
  </Svg>
);

export const HeartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20s-7-4.5-9.2-9C1.3 8 2.6 4.8 5.8 4.8c2 0 3.2 1.4 4.2 2.8 1-1.4 2.2-2.8 4.2-2.8 3.2 0 4.5 3.2 3 6.2C19 15.5 12 20 12 20Z" />
  </Svg>
);

export const RunIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="15.5" cy="4.5" r="1.6" />
    <path d="M13 9 9.5 11 7 9M13 9l-3 3 2 4-1 4M12 12l3 1 1 4M8.5 13.5 6 21" />
  </Svg>
);

export const BuildingIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4.5" y="3" width="15" height="18" rx="2" />
    <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10.5 21v-3h3v3" />
  </Svg>
);

export const PlaneIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 13 3.5 11 2 12.5l4 3 1 4 1.5-1.5-.5-3.5 4-2 3.5 6 2-1-1.5-8 3-2.2a2 2 0 0 0-2-3.4L15 8.5 7 6 5.5 7Z" />
  </Svg>
);

export const LeafIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 19c0-9 6-13 14-13 0 8-4 14-13 14M5 19c2-4 5-6 9-7" />
  </Svg>
);

/** Level indicator (1–3 filled bars) — used for experience level. */
export const SignalBarsIcon = ({
  level = 3,
  size = 24,
  ...p
}: IconProps & { level?: 1 | 2 | 3 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    {...p}
  >
    <rect x="3" y="14" width="4" height="7" rx="1.3" fill="currentColor" opacity={level >= 1 ? 1 : 0.28} />
    <rect x="10" y="9" width="4" height="12" rx="1.3" fill="currentColor" opacity={level >= 2 ? 1 : 0.28} />
    <rect x="17" y="4" width="4" height="17" rx="1.3" fill="currentColor" opacity={level >= 3 ? 1 : 0.28} />
  </svg>
);

export const FilterIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 5h18M6 12h12M10 19h4" />
  </Svg>
);

export const InfoIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.5h.01" />
  </Svg>
);

export const RepeatIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9a5 5 0 0 1 5-5h8l-2.5-2.5M20 15a5 5 0 0 1-5 5H7l2.5 2.5" />
  </Svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 9 7 7 7-7" />
  </Svg>
);

export const LogOutIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 12h10M17 9l3 3-3 3" />
  </Svg>
);

export const UserIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
  </Svg>
);

export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
    <path d="M3.5 9h17M8 3v3M16 3v3" />
  </Svg>
);

export const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);
