'use client';

import * as React from 'react';
import type { SexType, UnitSystem } from '@fitforge/shared/types';
import { Chip } from '@/components/ui';
import { useOnboarding } from '../OnboardingProvider';
import type { OnboardingDraft } from '../types';
import { OnboardingFooter } from '../OnboardingFooter';

const SEX_OPTIONS: { value: SexType; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const CM_PER_IN = 2.54;
const KG_PER_LB = 0.45359237;

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/** Screen 9 · Body metrics (§2.2). Unit toggle, medians pre-filled, all optional. */
export function BodyMetricsStep() {
  const { draft, patch } = useOnboarding();

  // Seed unit system from locale (imperial for US) and medians once (§2.2 screen 9).
  React.useEffect(() => {
    const patchInit: Partial<OnboardingDraft> = {};
    if (typeof navigator !== 'undefined') {
      const isUS = /US$/i.test(navigator.language ?? '');
      if (isUS && draft.unit_system === 'metric') patchInit.unit_system = 'imperial';
    }
    if (draft.height_cm == null) patchInit.height_cm = 170;
    if (draft.weight_kg == null) patchInit.weight_kg = 70;
    if (Object.keys(patchInit).length) patch(patchInit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const imperial = draft.unit_system === 'imperial';

  const setUnit = (u: UnitSystem) => patch({ unit_system: u });

  const heightDisplay =
    draft.height_cm == null ? '' : imperial ? String(round1(draft.height_cm / CM_PER_IN)) : String(round1(draft.height_cm));
  const weightDisplay =
    draft.weight_kg == null ? '' : imperial ? String(round1(draft.weight_kg / KG_PER_LB)) : String(round1(draft.weight_kg));

  const onHeight = (raw: string) => {
    const n = parseFloat(raw);
    if (Number.isNaN(n)) return patch({ height_cm: null });
    patch({ height_cm: round1(imperial ? n * CM_PER_IN : n) });
  };
  const onWeight = (raw: string) => {
    const n = parseFloat(raw);
    if (Number.isNaN(n)) return patch({ weight_kg: null });
    patch({ weight_kg: round1(imperial ? n * KG_PER_LB : n) });
  };

  return (
    <div className="space-y-7">
      <div className="inline-flex rounded-2xl border border-border bg-surface-2 p-1">
        {(['metric', 'imperial'] as UnitSystem[]).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setUnit(u)}
            className={
              'rounded-xl px-4 py-2 text-sm font-medium capitalize ' +
              (draft.unit_system === u ? 'bg-accent text-accent-foreground' : 'text-muted-foreground')
            }
          >
            {u}
          </button>
        ))}
      </div>

      <section>
        <p className="mb-3 text-sm font-medium text-foreground">Sex</p>
        <div className="flex flex-wrap gap-2">
          {SEX_OPTIONS.map((o) => (
            <Chip key={o.value} selected={draft.sex === o.value} onClick={() => patch({ sex: o.value })}>
              {o.label}
            </Chip>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-foreground">Height ({imperial ? 'in' : 'cm'})</span>
          <input
            type="number"
            inputMode="decimal"
            value={heightDisplay}
            onChange={(e) => onHeight(e.target.value)}
            className="mt-2 h-12 w-full rounded-2xl border border-border bg-surface-2 px-4 text-base text-foreground outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Weight ({imperial ? 'lb' : 'kg'})</span>
          <input
            type="number"
            inputMode="decimal"
            value={weightDisplay}
            onChange={(e) => onWeight(e.target.value)}
            className="mt-2 h-12 w-full rounded-2xl border border-border bg-surface-2 px-4 text-base text-foreground outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-foreground">Birthdate</span>
        <input
          type="date"
          value={draft.birthdate ?? ''}
          onChange={(e) => patch({ birthdate: e.target.value || null })}
          className="mt-2 h-12 w-full rounded-2xl border border-border bg-surface-2 px-4 text-base text-foreground outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <p className="text-xs text-muted-foreground">
        These are optional, but weight, height, sex and age let us compute accurate calorie and
        macro targets on the next screens.
      </p>

      <div className="flex-1" />
      <OnboardingFooter step="body_metrics" skippable canContinue />
    </div>
  );
}
