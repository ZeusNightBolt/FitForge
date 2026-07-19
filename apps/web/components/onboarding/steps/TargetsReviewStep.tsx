'use client';

import * as React from 'react';
import { computeNutritionTargets } from '@fitforge/shared/rules';
import { createClient } from '@/lib/supabase/client';
import { useOnboarding } from '../OnboardingProvider';
import type { OnboardingDraft } from '../types';
import { OnboardingFooter } from '../OnboardingFooter';

type TargetField = 'kcal_target' | 'protein_g_target' | 'carbs_g_target' | 'fat_g_target';

function ageFromBirthdate(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const b = new Date(birthdate);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

/** Screen 11 · Targets review (§2.2 / §7.2.4). Client preview + authoritative RPC; editable. */
export function TargetsReviewStep() {
  const { draft, patch } = useOnboarding();
  const supabase = React.useMemo(() => createClient(), []);
  const [method, setMethod] = React.useState<string>('');

  // Instant client-side preview (§7.2.4 mirror) the first time we arrive.
  React.useEffect(() => {
    if (draft.kcal_target != null) return;
    const preview = computeNutritionTargets({
      sex: draft.sex,
      weight_kg: draft.weight_kg,
      height_cm: draft.height_cm,
      age: ageFromBirthdate(draft.birthdate),
      days_per_week: draft.days_per_week,
      primary_goal: draft.primary_goal ?? 'general_health',
      diet_type: draft.diet_type,
    });
    setMethod(preview.method);
    patch({
      kcal_target: preview.kcal,
      protein_g_target: preview.protein_g,
      carbs_g_target: preview.carbs_g,
      fat_g_target: preview.fat_g,
      targets_source: 'suggested',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconcile against the authoritative RPC (single source of rounding, §5.3).
  React.useEffect(() => {
    let cancelled = false;
    supabase
      .rpc('suggest_nutrition_targets', {})
      .then(({ data }) => {
        if (cancelled || !data) return;
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) return;
        setMethod(row.method);
        // only overwrite if the user hasn't manually edited (still 'suggested')
        if (draft.targets_source === 'suggested') {
          patch({
            kcal_target: row.kcal,
            protein_g_target: row.protein_g,
            carbs_g_target: row.carbs_g,
            fat_g_target: row.fat_g,
          });
        }
      })
      .catch(() => {
        /* RPC may be unavailable until WS-6 lands — keep the client preview */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const edit = (field: TargetField, raw: string) => {
    const n = parseInt(raw, 10);
    const value = Number.isNaN(n) ? null : n;
    const next: Partial<OnboardingDraft> = { targets_source: 'custom' };
    next[field] = value;
    patch(next);
  };

  const rows: { key: TargetField; label: string; unit: string; value: number | null }[] = [
    { key: 'kcal_target', label: 'Calories', unit: 'kcal', value: draft.kcal_target },
    { key: 'protein_g_target', label: 'Protein', unit: 'g', value: draft.protein_g_target },
    { key: 'carbs_g_target', label: 'Carbs', unit: 'g', value: draft.carbs_g_target },
    { key: 'fat_g_target', label: 'Fat', unit: 'g', value: draft.fat_g_target },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-border bg-surface-2 p-4">
        <p className="text-4xl font-extrabold tabular-nums text-foreground">
          {draft.kcal_target ?? '—'} <span className="text-lg font-medium text-muted-foreground">kcal / day</span>
        </p>
        {method && <p className="mt-1 text-xs text-muted-foreground">{method}</p>}
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <label key={r.key} className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-foreground">{r.label}</span>
            <span className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={r.value ?? ''}
                onChange={(e) => edit(r.key, e.target.value)}
                className="h-11 w-28 rounded-xl border border-border bg-surface px-3 text-right text-base tabular-nums text-foreground outline-none focus:ring-2 focus:ring-accent"
              />
              <span className="w-8 text-sm text-muted-foreground">{r.unit}</span>
            </span>
          </label>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {draft.targets_source === 'custom'
          ? 'Using your custom targets.'
          : 'These are our suggestion — adjust any number and it becomes your custom target.'}
      </p>

      <div className="flex-1" />
      <OnboardingFooter step="targets_review" continueLabel="Sounds right" canContinue={draft.kcal_target != null} />
    </div>
  );
}
