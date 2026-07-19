// INTEGRATION: delete, use components/ui
//
// Thin local stand-ins for WS-4's design-system primitives (apps/web/components/ui). WS-5 pages
// import UI ONLY from this module so they compile & render standalone while WS-4 builds
// concurrently. The prop contracts here mirror components/ui/index.ts EXACTLY; at integration
// time the integrator replaces every `@/components/features/_stubs` import with `@/components/ui`
// and deletes this folder. No behavioural divergence is intended.
'use client';

import * as React from 'react';

/* -------------------------------------------------- local utils (avoid cross-tree imports) */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/* -------------------------------------------------------------------------------- Button */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
}

const BTN_VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-foreground hover:opacity-90 active:opacity-80 disabled:opacity-50',
  secondary:
    'bg-surface-2 text-foreground border border-border hover:bg-muted active:opacity-80 disabled:opacity-50',
  ghost: 'bg-transparent text-foreground hover:bg-surface-2 active:opacity-80 disabled:opacity-50',
  danger: 'bg-danger text-white hover:opacity-90 active:opacity-80 disabled:opacity-50',
};
const BTN_SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-11 px-4 text-base rounded-xl',
  lg: 'h-14 px-6 text-base rounded-2xl',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', block, loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 font-medium',
        'transition-[opacity,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        'disabled:cursor-not-allowed touch-manipulation',
        BTN_VARIANTS[variant],
        BTN_SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});

/* ---------------------------------------------------------------------------------- Card */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  interactive?: boolean;
}

export function Card({ selected, interactive, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border bg-surface-2 p-4',
        selected ? 'border-accent ring-2 ring-accent' : 'border-border',
        interactive && 'cursor-pointer transition-colors hover:border-accent/60',
        className,
      )}
      {...rest}
    />
  );
}
export function CardTitle({ className, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold text-foreground', className)} {...rest} />;
}
export function CardDescription({
  className,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 text-sm text-muted-foreground', className)} {...rest} />;
}

/* ---------------------------------------------------------------------------------- Chip */
export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  leading?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
}

export function Chip({
  selected,
  leading,
  removable,
  onRemove,
  className,
  children,
  type,
  ...rest
}: ChipProps) {
  return (
    <button
      type={type ?? 'button'}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-chip border px-3.5 py-2 text-sm font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent touch-manipulation',
        selected
          ? 'border-accent bg-accent-muted text-accent'
          : 'border-border bg-surface-2 text-foreground hover:border-accent/50',
        className,
      )}
      {...rest}
    >
      {leading && <span aria-hidden>{leading}</span>}
      {children}
      {removable && (
        <span
          role="button"
          aria-label="Remove"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-0.5 grid h-4 w-4 place-items-center rounded-full text-current/70 hover:text-current"
        >
          ×
        </span>
      )}
    </button>
  );
}

/* ---------------------------------------------------------------------- SelectableCardGrid */
export interface SelectableOption<V extends string> {
  value: V;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}
export interface SelectableCardGridProps<V extends string> {
  options: ReadonlyArray<SelectableOption<V>>;
  value: V | V[] | null;
  onChange: (value: V) => void;
  mode?: 'single' | 'multiple';
  columns?: 1 | 2;
  className?: string;
}

export function SelectableCardGrid<V extends string>({
  options,
  value,
  onChange,
  mode = 'single',
  columns = 1,
  className,
}: SelectableCardGridProps<V>) {
  const selectedSet = React.useMemo(
    () => new Set(Array.isArray(value) ? value : value ? [value] : []),
    [value],
  );
  return (
    <div
      role={mode === 'single' ? 'radiogroup' : 'group'}
      className={cn('grid gap-3', columns === 2 ? 'grid-cols-2' : 'grid-cols-1', className)}
    >
      {options.map((opt) => {
        const isSelected = selectedSet.has(opt.value);
        return (
          <Card
            key={opt.value}
            role={mode === 'single' ? 'radio' : 'checkbox'}
            aria-checked={isSelected}
            tabIndex={0}
            interactive
            selected={isSelected}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange(opt.value);
              }
            }}
            className="flex items-start gap-3"
          >
            {opt.icon && (
              <span aria-hidden className="mt-0.5 text-2xl leading-none">
                {opt.icon}
              </span>
            )}
            <div className="min-w-0">
              <CardTitle>{opt.title}</CardTitle>
              {opt.description && <CardDescription>{opt.description}</CardDescription>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------------------- Stepper */
export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
  'aria-label'?: string;
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 7,
  step = 1,
  unit,
  className,
  ...aria
}: StepperProps) {
  const set = (n: number) => onChange(clamp(n, min, max));
  return (
    <div
      className={cn(
        'inline-flex items-center gap-4 rounded-2xl border border-border bg-surface-2 p-2',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => set(value - step)}
        className="grid h-11 w-11 place-items-center rounded-xl bg-surface text-xl font-semibold disabled:opacity-40"
      >
        −
      </button>
      <div
        className="min-w-16 text-center tabular-nums"
        role="status"
        aria-live="polite"
        aria-label={aria['aria-label']}
      >
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {unit && <span className="ml-1 text-sm text-muted-foreground">{unit}</span>}
      </div>
      <button
        type="button"
        aria-label="Increase"
        disabled={value >= max}
        onClick={() => set(value + step)}
        className="grid h-11 w-11 place-items-center rounded-xl bg-surface text-xl font-semibold disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

/* --------------------------------------------------------------------------- SearchInput */
export interface SearchInputProps<T> {
  search: (query: string, signal: AbortSignal) => Promise<T[]>;
  renderResult: (item: T, active: boolean) => React.ReactNode;
  onSelect: (item: T) => void;
  getKey: (item: T) => string;
  recents?: T[];
  placeholder?: string;
  minChars?: number;
  debounceMs?: number;
  emptyLabel?: string;
  autoFocus?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function SearchInput<T>({
  search,
  renderResult,
  onSelect,
  getKey,
  recents = [],
  placeholder = 'Search…',
  minChars = 2,
  debounceMs = 150,
  emptyLabel = 'No matches',
  autoFocus,
  className,
  ...aria
}: SearchInputProps<T>) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<T[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const abortRef = React.useRef<AbortController | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showRecents = query.trim().length < minChars;
  const items = showRecents ? recents : results;

  React.useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();
    const q = query.trim();
    if (q.length < minChars) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;
      search(q, controller.signal)
        .then((rows) => {
          if (!controller.signal.aborted) {
            setResults(rows.slice(0, 8));
            setActive(0);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, minChars, debounceMs, search]);

  const choose = (item: T) => {
    onSelect(item);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[active];
      if (item) choose(item);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-2 px-3">
        <span aria-hidden className="text-muted-foreground">
          {'\u{1F50D}'}
        </span>
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-label={aria['aria-label'] ?? placeholder}
          autoFocus={autoFocus}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className="h-12 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
        {loading && (
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
          />
        )}
      </div>

      {open && (items.length > 0 || (!showRecents && !loading)) && (
        <ul
          role="listbox"
          className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-border bg-surface p-1 shadow-xl"
        >
          {items.length === 0 && (
            <li className="px-3 py-3 text-sm text-muted-foreground">{emptyLabel}</li>
          )}
          {items.map((item, i) => (
            <li key={getKey(item)} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(item)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  'flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm',
                  i === active
                    ? 'bg-accent-muted text-accent'
                    : 'text-foreground hover:bg-surface-2',
                )}
              >
                {renderResult(item, i === active)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------- ProgressBar */
export interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
  label?: string;
}

export function ProgressBar({ current, total, className, label }: ProgressBarProps) {
  const pct = clamp((current / Math.max(1, total)) * 100, 0, 100);
  return (
    <div className={cn('w-full', className)}>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label ?? `Step ${current} of ${total}`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------------- Sheet */
export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 max-h-[85dvh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl',
          className,
        )}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border sm:hidden" aria-hidden />
        {title && <h2 className="mb-3 text-lg font-semibold text-foreground">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------- MacroRing */
export interface MacroRingProps {
  value: number;
  target: number;
  label?: string;
  caption?: React.ReactNode;
  size?: number;
  stroke?: number;
  color?: string;
  className?: string;
}

export function MacroRing({
  value,
  target,
  label,
  caption,
  size = 120,
  stroke = 10,
  color = 'var(--color-accent)',
  className,
}: MacroRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? clamp(value / target, 0, 1) : 0;
  const dash = circumference * pct;

  return (
    <div className={cn('inline-flex flex-col items-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label ?? `${value} of ${target}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-lg font-bold"
          style={{ fontSize: size * 0.16 }}
        >
          {caption ?? `${Math.round(value)}`}
        </text>
      </svg>
      {label && <span className="mt-1 text-xs font-medium text-muted-foreground">{label}</span>}
    </div>
  );
}
