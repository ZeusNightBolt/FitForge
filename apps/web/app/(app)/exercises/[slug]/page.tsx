import { ExerciseDetail } from '@/components/features/exercises/ExerciseDetail';

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ExerciseDetail slug={slug} />;
}
