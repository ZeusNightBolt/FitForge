import { WorkoutPlayer } from '@/components/features/workout/WorkoutPlayer';

/**
 * Workout player route. `sessionId` maps to a routine_day id in the mock plane (Today links to
 * /workout/{day.id}). INTEGRATION: create a workout_sessions row on entry and pass its id.
 */
export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <WorkoutPlayer sessionId={sessionId} />;
}
