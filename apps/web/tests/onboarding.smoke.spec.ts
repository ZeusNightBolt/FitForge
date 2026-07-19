import { test, expect, type Route, type Request } from '@playwright/test';

/**
 * WS-4 onboarding smoke test — completes onboarding as persona P1 "Restart Rachel"
 * (beginner · home equipment · fat loss + tone · vegetarian · tree-nut allergy) and asserts the
 * exact write-through calls hit Supabase (§2.2 completion contract).
 *
 * Supabase is mocked at the network layer via `page.route` (the pragmatic equivalent of the
 * MSW mock the brief calls for — chosen to avoid an extra dependency). All PostgREST table writes
 * and `/rpc/*` calls are stubbed and RECORDED so we can assert the contract.
 *
 * ── HANDOFF NOTE (unrun in the build sandbox) ────────────────────────────────────────────────
 * This spec is intentionally left UNRUN here: it needs `@fitforge/shared` built, `next` +
 * browsers installed (`npx playwright install`), and — importantly — the Next.js *middleware and
 * Server Components* also perform Supabase auth/profile reads on the server, which `page.route`
 * (browser-only interception) does NOT catch. To run green, WS-7 should either (a) point the test
 * env at a seeded local Supabase, or (b) run with middleware auth relaxed for the test origin.
 * The assertions below encode the intended contract regardless.
 */

interface Recorded {
  rpc: Record<string, unknown[]>;
  profilePatches: Record<string, unknown>[];
  upserts: Record<string, unknown[]>;
}

const P1_USER_ID = '00000000-0000-4000-8000-000000000001';

async function jsonBody(request: Request): Promise<unknown> {
  try {
    return request.postDataJSON();
  } catch {
    return null;
  }
}

test('P1 completes onboarding and the completion contract is written', async ({ page, context }) => {
  const rec: Recorded = { rpc: {}, profilePatches: [], upserts: {} };

  // Pretend we are already authenticated (Auth screen is exercised separately).
  await context.addCookies([
    {
      name: 'sb-access-token',
      value: 'test-token',
      domain: 'localhost',
      path: '/',
    },
  ]);

  await page.route('**/auth/v1/user**', (route: Route) =>
    route.fulfill({ json: { id: P1_USER_ID, email: 'rachel@example.com' } }),
  );

  await page.route('**/rest/v1/rpc/**', async (route: Route) => {
    const name = route.request().url().split('/rpc/')[1]?.split('?')[0] ?? '';
    (rec.rpc[name] ??= []).push(await jsonBody(route.request()));
    const responses: Record<string, unknown> = {
      search_exercises: [],
      search_foods: [],
      suggest_substitutes: [],
      suggest_nutrition_targets: [
        { kcal: 1600, protein_g: 125, carbs_g: 150, fat_g: 55, method: 'Mifflin-St Jeor × 1.5 − 20% (fat loss)' },
      ],
      set_user_equipment: null,
      generate_starter_routine: 'routine-123',
    };
    await route.fulfill({ json: responses[name] ?? [] });
  });

  // Equipment catalog + routine tree reads.
  await page.route('**/rest/v1/equipment**', (route: Route) =>
    route.fulfill({
      json: [
        { slug: 'dumbbell', name: 'Dumbbells', category: 'free_weights', common_in_home: true, common_in_gym: true },
        { slug: 'resistance-bands', name: 'Resistance Bands', category: 'bodyweight_accessories', common_in_home: true, common_in_gym: true },
        { slug: 'flat-bench', name: 'Flat Bench', category: 'benches_racks', common_in_home: true, common_in_gym: true },
      ],
    }),
  );

  await page.route('**/rest/v1/routines**', (route: Route) =>
    route.fulfill({
      json: {
        id: 'routine-123',
        name: 'Full Body',
        description: null,
        routine_days: [
          {
            id: 'day-a',
            day_index: 0,
            name: 'Day A — Full Body',
            focus: 'Full Body',
            routine_exercises: [
              {
                id: 're-1',
                position: 0,
                exercise_id: 'ex-1',
                sets: 3,
                rep_min: 10,
                rep_max: 15,
                rest_seconds: 60,
                exercises: { name: 'Goblet Squat', slug: 'goblet-squat', image_path: null },
              },
            ],
          },
        ],
      },
    }),
  );

  // Record table writes; echo the body back so upserts "succeed".
  await page.route('**/rest/v1/profiles**', async (route: Route) => {
    if (route.request().method() === 'PATCH') rec.profilePatches.push((await jsonBody(route.request())) as Record<string, unknown>);
    await route.fulfill({ json: [{ id: P1_USER_ID }] });
  });

  for (const table of ['nutrition_profiles', 'user_exercise_preferences', 'user_movement_exclusions', 'user_food_preferences', 'body_metrics']) {
    await page.route(`**/rest/v1/${table}**`, async (route: Route) => {
      if (route.request().method() === 'POST') {
        const body = await jsonBody(route.request());
        (rec.upserts[table] ??= []).push(body as Record<string, unknown>);
      }
      await route.fulfill({ json: [] });
    });
  }

  const cont = () => page.getByTestId('onboarding-continue').click();

  // Screen 2 · goals — fat loss primary.
  await page.goto('/onboarding/goals');
  await page.getByText('Lose fat').click();
  await cont();

  // Screen 3 · experience — beginner (default).
  await expect(page).toHaveURL(/experience/);
  await cont();

  // Screen 4 · schedule (defaults seeded).
  await expect(page).toHaveURL(/schedule/);
  await cont();

  // Screen 5 · location — home.
  await expect(page).toHaveURL(/location/);
  await page.getByText('Home gym').click();
  await cont();

  // Screen 6 · equipment (preset applied) → continue.
  await expect(page).toHaveURL(/equipment/);
  await cont();

  // Screen 7 · exercise prefs → skip-through.
  await expect(page).toHaveURL(/exercise_prefs/);
  await cont();

  // Screen 8 · exclusions → no injuries, continue.
  await expect(page).toHaveURL(/exclusions/);
  await cont();

  // Screen 9 · body metrics → defaults, continue.
  await expect(page).toHaveURL(/body_metrics/);
  await cont();

  // Screen 10 · nutrition — vegetarian + tree-nut allergy.
  await expect(page).toHaveURL(/nutrition_prefs/);
  await page.getByText('Vegetarian', { exact: true }).click();
  await page.getByText('Tree nut').click();
  await cont();

  // Screen 11 · targets review.
  await expect(page).toHaveURL(/targets_review/);
  await cont();

  // Screen 12 · plan preview → start plan.
  await expect(page).toHaveURL(/plan_preview/);
  await cont();

  // Redirected to /today after finish.
  await expect(page).toHaveURL(/today/);

  // ── Contract assertions (§2.2) ──────────────────────────────────────────────
  expect(rec.profilePatches.some((p) => p.primary_goal === 'fat_loss')).toBe(true);
  expect(rec.rpc['set_user_equipment']?.length ?? 0).toBeGreaterThan(0);
  expect(rec.upserts['nutrition_profiles']?.some((u) => (u as { diet_type?: string }).diet_type === 'vegetarian')).toBe(true);
  expect(rec.rpc['generate_starter_routine']?.length ?? 0).toBeGreaterThan(0);
  expect(rec.profilePatches.some((p) => p.onboarding_completed_at != null)).toBe(true);
});
