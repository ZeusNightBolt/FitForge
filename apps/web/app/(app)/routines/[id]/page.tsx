import { RoutineEditor } from '@/components/features/routines/RoutineEditor';

export default async function RoutineEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RoutineEditor routineId={id} />;
}
