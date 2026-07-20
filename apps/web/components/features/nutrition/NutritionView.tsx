'use client';

/**
 * Nutrition day view (§2.3): logs grouped by meal_slot; search_foods type-ahead → serving picker
 * (default serving_name/serving_grams, ×0.5/×1/×2 quick chips) → log_food; quick-add custom
 * entry; meal templates. Meal slot defaults by time of day (§2.3). All mocked & local.
 */
import * as React from 'react';
import { Button, Card, CardTitle, Chip, SearchInput, Sheet, MacroRing } from '@/components/ui';
import {
  FOODS,
  RECENT_FOODS,
  MEAL_SLOTS,
  MOCK_MEAL_TEMPLATES,
  mockSearchFoods,
  computeMacros,
  defaultMealSlot,
  type FoodSearchRow,
  type NutritionLog,
  type MealSlot,
} from '@/components/features/_mock/data';
import { useNutritionTargets, useTodayLogs } from '@/lib/demo/useDemo';

let logSeq = 1000;
const genLogId = () => `nl-new-${logSeq++}`;

export function NutritionView() {
  // DEMO MODE: targets + today's logs come from the demo store (persisted to localStorage).
  const targets = useNutritionTargets();
  const { logs, setLogs } = useTodayLogs();
  const [slotForSearch, setSlotForSearch] = React.useState<MealSlot | null>(null);
  const [pickFood, setPickFood] = React.useState<{ food: FoodSearchRow; slot: MealSlot } | null>(
    null,
  );
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);

  const totals = logs.reduce(
    (a, l) => ({
      kcal: a.kcal + l.kcal,
      protein_g: a.protein_g + l.protein_g,
      carbs_g: a.carbs_g + l.carbs_g,
      fat_g: a.fat_g + l.fat_g,
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );

  function addLog(log: NutritionLog) {
    setLogs((prev) => [...prev, log]);
  }
  function removeLog(id: string) {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }
  function logFood(food: FoodSearchRow, slot: MealSlot, quantityG: number) {
    const m = computeMacros(food, quantityG);
    addLog({
      id: genLogId(),
      logged_on: new Date().toISOString().slice(0, 10),
      meal_slot: slot,
      food_id: food.food_id,
      custom_name: food.name,
      quantity_g: quantityG,
      ...m,
    });
  }
  function logTemplate(templateId: string, slot: MealSlot) {
    const t = MOCK_MEAL_TEMPLATES.find((x) => x.id === templateId);
    if (!t) return;
    for (const item of t.items) {
      const food = FOODS.find((f) => f.food_id === item.food_id);
      if (food) logFood(food, slot, item.quantity_g);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Nutrition</h1>
        <span className="text-sm text-muted-foreground">Today</span>
      </header>

      {/* Day summary */}
      <Card>
        <div className="flex items-center gap-5">
          <MacroRing
            value={totals.kcal}
            target={targets.kcal_target}
            size={112}
            stroke={11}
            label={`of ${targets.kcal_target} kcal`}
          />
          <dl className="flex-1 space-y-2 text-sm">
            <MacroRow label="Protein" value={totals.protein_g} target={targets.protein_g_target} color="var(--color-accent)" />
            <MacroRow label="Carbs" value={totals.carbs_g} target={targets.carbs_g_target} color="var(--color-success)" />
            <MacroRow label="Fat" value={totals.fat_g} target={targets.fat_g_target} color="var(--color-danger)" />
          </dl>
        </div>
      </Card>

      {/* Meal slots */}
      {MEAL_SLOTS.map(({ slot, label, icon }) => {
        const slotLogs = logs.filter((l) => l.meal_slot === slot);
        const slotKcal = slotLogs.reduce((a, l) => a + l.kcal, 0);
        return (
          <Card key={slot} className="!p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span aria-hidden>{icon}</span> {label}
              </CardTitle>
              <span className="text-sm tabular-nums text-muted-foreground">
                {Math.round(slotKcal)} kcal
              </span>
            </div>
            {slotLogs.length > 0 && (
              <ul className="divide-y divide-border">
                {slotLogs.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {l.custom_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {l.quantity_g != null ? `${Math.round(l.quantity_g)} g · ` : ''}
                        {Math.round(l.protein_g)}P / {Math.round(l.carbs_g)}C / {Math.round(l.fat_g)}F
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {Math.round(l.kcal)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${l.custom_name}`}
                        onClick={() => removeLog(l.id)}
                        className="grid h-7 w-7 place-items-center rounded-lg bg-surface-2 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="px-4 py-2.5">
              <button
                type="button"
                onClick={() => setSlotForSearch(slot)}
                className="text-sm font-medium text-accent"
              >
                + Add food
              </button>
            </div>
          </Card>
        );
      })}

      {/* Meal templates */}
      <Card>
        <CardTitle className="mb-2 text-sm">Quick log a saved meal</CardTitle>
        <div className="flex flex-wrap gap-2">
          {MOCK_MEAL_TEMPLATES.map((t) => (
            <Chip
              key={t.id}
              leading={'\u{1F4CB}'}
              onClick={() => logTemplate(t.id, defaultMealSlot())}
            >
              {t.name}
            </Chip>
          ))}
          <Chip leading="+" onClick={() => setQuickAddOpen(true)}>
            Quick add
          </Chip>
        </div>
      </Card>

      {/* Food search sheet */}
      <Sheet
        open={slotForSearch != null}
        onClose={() => setSlotForSearch(null)}
        title={`Add to ${slotForSearch ? MEAL_SLOTS.find((s) => s.slot === slotForSearch)?.label : ''}`}
      >
        {slotForSearch && (
          <SearchInput<FoodSearchRow>
            autoFocus
            recents={RECENT_FOODS}
            search={async (q) => mockSearchFoods(q, 8)}
            getKey={(f) => f.food_id}
            onSelect={(f) => {
              setPickFood({ food: f, slot: slotForSearch });
              setSlotForSearch(null);
            }}
            renderResult={(f) => (
              <span className="flex w-full items-center justify-between gap-3">
                <span className="min-w-0 truncate font-medium">{f.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {Math.round(f.kcal)} kcal · {Math.round(f.protein_g)}P /100g
                </span>
              </span>
            )}
            placeholder="Search foods…"
            aria-label="Search foods"
          />
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Recents show first · results ranked by relevance and your favorites (§7.1).
        </p>
      </Sheet>

      {/* Serving picker */}
      {pickFood && (
        <ServingPicker
          food={pickFood.food}
          slot={pickFood.slot}
          onClose={() => setPickFood(null)}
          onConfirm={(qty, slot) => {
            logFood(pickFood.food, slot, qty);
            setPickFood(null);
          }}
        />
      )}

      {/* Quick add custom */}
      <QuickAddSheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onConfirm={(entry) => {
          addLog({
            id: genLogId(),
            logged_on: new Date().toISOString().slice(0, 10),
            meal_slot: entry.slot,
            food_id: null,
            custom_name: entry.name,
            quantity_g: null,
            kcal: entry.kcal,
            protein_g: entry.protein_g,
            carbs_g: entry.carbs_g,
            fat_g: entry.fat_g,
          });
          setQuickAddOpen(false);
        }}
      />
    </div>
  );
}

function MacroRow({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((value / Math.max(1, target)) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {Math.round(value)} / {target} g
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function ServingPicker({
  food,
  slot,
  onClose,
  onConfirm,
}: {
  food: FoodSearchRow;
  slot: MealSlot;
  onClose: () => void;
  onConfirm: (quantityG: number, slot: MealSlot) => void;
}) {
  const [grams, setGrams] = React.useState(food.serving_grams);
  const [slotSel, setSlotSel] = React.useState<MealSlot>(slot);
  const m = computeMacros(food, grams);
  const servings = grams / food.serving_grams;

  return (
    <Sheet open onClose={onClose} title={food.name}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <MacroRing value={m.kcal} target={m.kcal} size={84} stroke={9} caption={Math.round(m.kcal)} label="kcal" />
          <p className="text-sm text-muted-foreground">
            {Math.round(m.protein_g)}P / {Math.round(m.carbs_g)}C / {Math.round(m.fat_g)}F ·{' '}
            {servings.toFixed(2)}× {food.serving_name}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[0.5, 1, 2].map((mult) => (
            <Chip
              key={mult}
              selected={Math.abs(grams - food.serving_grams * mult) < 0.01}
              onClick={() => setGrams(+(food.serving_grams * mult).toFixed(1))}
            >
              ×{mult} ({food.serving_name})
            </Chip>
          ))}
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Grams
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={grams}
            onChange={(e) => setGrams(Number(e.target.value))}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base tabular-nums outline-none focus:border-accent"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Meal
          </span>
          <div className="flex flex-wrap gap-2">
            {MEAL_SLOTS.map((s) => (
              <Chip key={s.slot} selected={slotSel === s.slot} onClick={() => setSlotSel(s.slot)}>
                {s.label}
              </Chip>
            ))}
          </div>
        </div>

        <Button block size="lg" onClick={() => onConfirm(grams, slotSel)}>
          Log {Math.round(m.kcal)} kcal
        </Button>
      </div>
    </Sheet>
  );
}

function QuickAddSheet({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (e: {
    name: string;
    slot: MealSlot;
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }) => void;
}) {
  const [name, setName] = React.useState('');
  const [kcal, setKcal] = React.useState(0);
  const [p, setP] = React.useState(0);
  const [c, setC] = React.useState(0);
  const [f, setF] = React.useState(0);
  const [slot, setSlot] = React.useState<MealSlot>(defaultMealSlot());

  return (
    <Sheet open={open} onClose={onClose} title="Quick add">
      <div className="space-y-3">
        <input
          value={name}
          placeholder="What did you eat?"
          onChange={(e) => setName(e.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base outline-none focus:border-accent"
        />
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              ['kcal', kcal, setKcal],
              ['P', p, setP],
              ['C', c, setC],
              ['F', f, setF],
            ] as const
          ).map(([lbl, val, set]) => (
            <label key={lbl} className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground">{lbl}</span>
              <input
                type="number"
                inputMode="decimal"
                value={val || ''}
                onChange={(e) => set(Number(e.target.value))}
                className="h-11 w-full rounded-xl border border-border bg-surface px-2 text-base tabular-nums outline-none focus:border-accent"
              />
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {MEAL_SLOTS.map((s) => (
            <Chip key={s.slot} selected={slot === s.slot} onClick={() => setSlot(s.slot)}>
              {s.label}
            </Chip>
          ))}
        </div>
        <Button
          block
          size="lg"
          disabled={!name.trim()}
          onClick={() =>
            onConfirm({ name: name.trim(), slot, kcal, protein_g: p, carbs_g: c, fat_g: f })
          }
        >
          Add
        </Button>
      </div>
    </Sheet>
  );
}
