'use client';

/**
 * Settings (§2.3): every onboarding answer is editable post-hoc. Editing equipment or exclusions
 * surfaces a "re-generate my plan?" prompt (generate_starter_routine). Mocked local state; writes
 * are no-ops. Covers the full §2.2 profile: goals, experience, schedule, location, equipment,
 * exclusions, body metrics, nutrition prefs & targets, plus account actions.
 */
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardTitle,
  Chip,
  SelectableCardGrid,
  Stepper,
  Sheet,
  type SelectableOption,
} from '@/components/ui';
import {
  TrophyIcon,
  DumbbellIcon,
  FlameIcon,
  RunIcon,
  HeartIcon,
  HomeIcon,
  BuildingIcon,
  PlaneIcon,
  LogOutIcon,
  ExportIcon,
  ImportIcon,
  TrashIcon,
} from '@/components/ui/icons';
import { resetDemo, exportState, importState, getState } from '@/lib/demo/store';
import {
  MOCK_PROFILE,
  MOCK_NUTRITION_PROFILE,
  WEEKDAY_LABELS,
  EQUIPMENT_FACETS,
  type GoalType,
  type DietType,
} from '@/components/features/_mock/data';

type Experience = 'beginner' | 'intermediate' | 'advanced';
type Location = 'home' | 'commercial_gym' | 'minimal';

/** A small indigo icon chip used for goal / location option cards. */
function OptionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-muted text-accent">
      {children}
    </span>
  );
}

const GOAL_OPTIONS: SelectableOption<GoalType>[] = [
  { value: 'strength', title: 'Strength', icon: <OptionBadge><TrophyIcon size={20} /></OptionBadge> },
  { value: 'hypertrophy', title: 'Build muscle', icon: <OptionBadge><DumbbellIcon size={20} /></OptionBadge> },
  { value: 'fat_loss', title: 'Lose fat', icon: <OptionBadge><FlameIcon size={20} /></OptionBadge> },
  { value: 'endurance', title: 'Endurance', icon: <OptionBadge><RunIcon size={20} /></OptionBadge> },
  { value: 'general_health', title: 'General health', icon: <OptionBadge><HeartIcon size={20} /></OptionBadge> },
];
const GOAL_LABEL: Record<GoalType, string> = {
  strength: 'Strength',
  hypertrophy: 'Build muscle',
  fat_loss: 'Lose fat',
  endurance: 'Endurance',
  general_health: 'General health',
};
const EXPERIENCE_OPTIONS: SelectableOption<Experience>[] = [
  { value: 'beginner', title: 'Beginner', description: 'Less than 1 year consistent' },
  { value: 'intermediate', title: 'Intermediate', description: '1–3 years' },
  { value: 'advanced', title: 'Advanced', description: '3+ years' },
];
const LOCATION_OPTIONS: SelectableOption<Location>[] = [
  { value: 'home', title: 'Home', description: 'Dumbbells, bands, a bench', icon: <OptionBadge><HomeIcon size={20} /></OptionBadge> },
  { value: 'commercial_gym', title: 'Commercial gym', description: 'Full equipment', icon: <OptionBadge><BuildingIcon size={20} /></OptionBadge> },
  { value: 'minimal', title: 'Minimal', description: 'Bodyweight & travel', icon: <OptionBadge><PlaneIcon size={20} /></OptionBadge> },
];
const DIET_OPTIONS: SelectableOption<DietType>[] = [
  { value: 'omnivore', title: 'Omnivore' },
  { value: 'vegetarian', title: 'Vegetarian' },
  { value: 'vegan', title: 'Vegan' },
  { value: 'pescatarian', title: 'Pescatarian' },
  { value: 'keto', title: 'Keto' },
  { value: 'mediterranean', title: 'Mediterranean' },
  { value: 'none', title: 'Just track' },
];
const SESSION_MINUTES = [30, 45, 60, 75, 90];
const BODY_AREAS = ['shoulders', 'lower_back', 'knees', 'wrists', 'hips', 'neck', 'elbows'];
const ALLERGENS = ['peanut', 'tree_nut', 'dairy', 'gluten', 'egg', 'soy', 'shellfish', 'fish', 'sesame'];

export function SettingsView() {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = React.useState<'idle' | 'ok' | 'error'>('idle');

  function resetAndLeave() {
    resetDemo();
    router.push('/');
  }

  /** Export the whole Local Mode store as a downloadable JSON backup (§5.1 / P2-16). */
  function exportData() {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitforge-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /** Restore the store from a user-selected JSON backup, then reload into Today. */
  async function importData(file: File) {
    const text = await file.text();
    if (importState(text)) {
      setImportStatus('ok');
      router.push('/today');
    } else {
      setImportStatus('error');
    }
  }
  const [primaryGoal, setPrimaryGoal] = React.useState<GoalType>(MOCK_PROFILE.primary_goal);
  const [secondaryGoal, setSecondaryGoal] = React.useState<GoalType | null>(
    MOCK_PROFILE.secondary_goal,
  );
  const [experience, setExperience] = React.useState<Experience>(MOCK_PROFILE.experience_level);
  const [location, setLocation] = React.useState<Location>(MOCK_PROFILE.training_location);
  const [daysPerWeek, setDaysPerWeek] = React.useState(MOCK_PROFILE.days_per_week);
  const [preferredDays, setPreferredDays] = React.useState<number[]>(MOCK_PROFILE.preferred_days);
  const [sessionMinutes, setSessionMinutes] = React.useState(MOCK_PROFILE.session_minutes);

  const [displayName, setDisplayName] = React.useState('');
  const [heightCm, setHeightCm] = React.useState(MOCK_PROFILE.height_cm);

  // Hydrate the editable name from the Local Mode store after mount (§5.4).
  React.useEffect(() => {
    setDisplayName(getState().profile?.display_name ?? '');
  }, []);
  const [birthdate, setBirthdate] = React.useState(MOCK_PROFILE.birthdate);
  const [unit, setUnit] = React.useState(MOCK_PROFILE.unit_system);

  const [equipment, setEquipment] = React.useState<string[]>(['barbell', 'dumbbell', 'cable-machine', 'pull-up-bar']);
  const [bodyAreas, setBodyAreas] = React.useState<string[]>([]);

  const [dietType, setDietType] = React.useState<DietType>(MOCK_NUTRITION_PROFILE.diet_type);
  const [allergies, setAllergies] = React.useState<string[]>(MOCK_NUTRITION_PROFILE.allergies);
  const [mealsPerDay, setMealsPerDay] = React.useState(MOCK_NUTRITION_PROFILE.meals_per_day);
  const [kcalTarget, setKcalTarget] = React.useState(MOCK_NUTRITION_PROFILE.kcal_target);

  // "Re-generate my plan?" prompt fires when equipment or exclusions change (§2.3).
  const [regenPrompt, setRegenPrompt] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  function toggle<T>(list: T[], v: T): T[] {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }
  function onEquipmentChange(slug: string) {
    setEquipment((prev) => toggle(prev, slug));
    setRegenPrompt(true);
  }
  function onBodyAreaChange(area: string) {
    setBodyAreas((prev) => toggle(prev, area));
    setRegenPrompt(true);
  }

  return (
    <div className="space-y-6 pb-4">
      <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>

      {/* ---------------------------------------------------------------- Your plan */}
      <GroupHeader>Your plan</GroupHeader>

      <Section title="Primary goal" hint="Drives how we generate and progress your routine.">
        <SelectableCardGrid
          options={GOAL_OPTIONS}
          value={primaryGoal}
          onChange={(v) => setPrimaryGoal(v)}
          columns={1}
        />
        <FieldLabel>Secondary goal (optional)</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.filter((o) => o.value !== primaryGoal).map((o) => (
            <Chip
              key={o.value}
              selected={secondaryGoal === o.value}
              onClick={() => setSecondaryGoal(secondaryGoal === o.value ? null : o.value)}
            >
              {GOAL_LABEL[o.value]}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Experience">
        <SelectableCardGrid
          options={EXPERIENCE_OPTIONS}
          value={experience}
          onChange={(v) => setExperience(v)}
        />
      </Section>

      <Section title="Schedule">
        <div className="flex items-center justify-between">
          <FieldLabel>Days per week</FieldLabel>
          <Stepper value={daysPerWeek} min={1} max={7} onChange={setDaysPerWeek} unit="days" />
        </div>
        <div>
          <FieldLabel>Preferred days</FieldLabel>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {WEEKDAY_LABELS.map((d, i) => (
              <Chip
                key={d}
                selected={preferredDays.includes(i)}
                onClick={() => setPreferredDays((prev) => toggle(prev, i).sort((a, b) => a - b))}
              >
                {d}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>Session length</FieldLabel>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {SESSION_MINUTES.map((m) => (
              <Chip key={m} selected={sessionMinutes === m} onClick={() => setSessionMinutes(m)}>
                {m} min
              </Chip>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Training location">
        <SelectableCardGrid
          options={LOCATION_OPTIONS}
          value={location}
          onChange={(v) => setLocation(v)}
        />
      </Section>

      <Section title="Equipment" hint="Changing this can change which exercises we recommend.">
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_FACETS.filter((e) => e.slug !== 'bodyweight').map((e) => (
            <Chip
              key={e.slug}
              selected={equipment.includes(e.slug)}
              onClick={() => onEquipmentChange(e.slug)}
            >
              {e.name}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Protect / avoid" hint="Body areas map to movement patterns we'll avoid.">
        <div className="flex flex-wrap gap-2">
          {BODY_AREAS.map((a) => (
            <Chip
              key={a}
              selected={bodyAreas.includes(a)}
              onClick={() => onBodyAreaChange(a)}
            >
              <span className="capitalize">{a.replace('_', ' ')}</span>
            </Chip>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------------- Preferences */}
      <GroupHeader>Preferences</GroupHeader>

      <Section title="Diet">
        <SelectableCardGrid
          options={DIET_OPTIONS}
          value={dietType}
          onChange={(v) => setDietType(v)}
          columns={2}
        />
        <FieldLabel>Allergies</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((a) => (
            <Chip key={a} selected={allergies.includes(a)} onClick={() => setAllergies((prev) => toggle(prev, a))}>
              <span className="capitalize">{a.replace('_', ' ')}</span>
            </Chip>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <FieldLabel>Meals per day</FieldLabel>
          <Stepper value={mealsPerDay} min={1} max={6} onChange={setMealsPerDay} unit="meals" />
        </div>
      </Section>

      <Section title="Calorie target" hint="Auto-computed, editable. Edits are stored as custom overrides.">
        <div className="flex items-center gap-3">
          <input
            type="number"
            inputMode="numeric"
            value={kcalTarget}
            onChange={(e) => setKcalTarget(Number(e.target.value))}
            className="h-11 w-32 rounded-xl border border-border bg-surface px-3 text-base tabular-nums outline-none focus:border-accent"
          />
          <span className="text-sm text-muted-foreground">kcal / day</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setKcalTarget(MOCK_NUTRITION_PROFILE.kcal_target)}
          >
            Reset to suggested
          </Button>
        </div>
      </Section>

      <Section title="Profile">
        <LabeledInput label="Display name" value={displayName} onChange={setDisplayName} />
        <div className="grid grid-cols-2 gap-3">
          <LabeledNumber label="Height (cm)" value={heightCm} onChange={setHeightCm} />
          <label className="flex flex-col gap-1">
            <FieldLabel>Birthdate</FieldLabel>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base outline-none focus:border-accent"
            />
          </label>
        </div>
        <div>
          <FieldLabel>Units</FieldLabel>
          <div className="mt-1.5 flex gap-2">
            {(['metric', 'imperial'] as const).map((u) => (
              <Chip key={u} selected={unit === u} onClick={() => setUnit(u)}>
                <span className="capitalize">{u}</span>
              </Chip>
            ))}
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- Local Mode */}
      <GroupHeader>Local Mode</GroupHeader>

      <Section
        title="Local Mode"
        hint="Everything lives in this browser. Nothing is uploaded. Back up or move your data anytime."
      >
        <div className="flex flex-col gap-2">
          <Button size="lg" variant="secondary" block onClick={exportData}>
            <ExportIcon size={18} /> Export data (JSON)
          </Button>
          <Button
            size="lg"
            variant="secondary"
            block
            onClick={() => fileInputRef.current?.click()}
          >
            <ImportIcon size={18} /> Import data
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            data-testid="import-file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importData(file);
              e.target.value = '';
            }}
          />
          {importStatus === 'error' && (
            <p role="alert" className="text-xs text-danger">
              That file wasn&apos;t a valid FitForge backup. Nothing was changed.
            </p>
          )}
          <Button
            size="lg"
            variant="danger"
            block
            onClick={() => setDeleteOpen(true)}
            data-testid="erase-local-data"
          >
            <TrashIcon size={18} /> Erase Local Mode data
          </Button>
          <p className="text-xs text-muted-foreground">
            Erasing clears your profile, routine, and food logs stored in this browser.
          </p>
        </div>
      </Section>

      <Section title="Account">
        <div className="flex flex-col gap-2">
          <Button size="lg" block>
            Save changes
          </Button>
          <Button size="lg" variant="secondary" block onClick={resetAndLeave} data-testid="demo-signout">
            <LogOutIcon size={18} /> Sign out
          </Button>
        </div>
      </Section>

      {/* Regenerate prompt */}
      <Sheet open={regenPrompt} onClose={() => setRegenPrompt(false)} title="Re-generate your plan?">
        <p className="text-sm text-muted-foreground">
          You changed your equipment or the areas you want to protect. Want us to re-generate your
          starter routine to match?
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button block onClick={() => setRegenPrompt(false)}>
            Re-generate my plan
          </Button>
          <Button variant="ghost" block onClick={() => setRegenPrompt(false)}>
            Keep my current plan
          </Button>
        </div>
      </Sheet>

      {/* Erase Local Mode confirm */}
      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Erase Local Mode data?">
        <p className="text-sm text-muted-foreground">
          This clears your profile, generated routine, and food logs stored in this browser
          (storage key <code>fitforge.demo.v1</code>). This cannot be undone. Export a backup first
          if you want to keep it.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button variant="danger" block onClick={resetAndLeave}>
            Yes, erase everything
          </Button>
          <Button variant="ghost" block onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function GroupHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 pt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardTitle className="text-base">{title}</CardTitle>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-3 space-y-3">{children}</div>
    </Card>
  );
}
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}
function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base outline-none focus:border-accent"
      />
    </label>
  );
}
function LabeledNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <FieldLabel>{label}</FieldLabel>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base tabular-nums outline-none focus:border-accent"
      />
    </label>
  );
}
