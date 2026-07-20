import { ExerciseDetail } from '@/components/features/exercises/ExerciseDetail';
import { mockAllExercises } from '@/components/features/_mock/data';

/** Static params: one page per fixture-catalog exercise. */
export function generateStaticParams() {
  return mockAllExercises().map((ex) => ({ slug: ex.slug }));
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ExerciseDetail slug={slug} />;
}
