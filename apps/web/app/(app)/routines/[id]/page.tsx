import { RoutineEditor } from '@/components/features/routines/RoutineEditor';
import { MOCK_ROUTINES_LIST } from '@/components/features/_mock/data';
import { DEMO_ROUTINE_ID } from '@/lib/demo/ids';

/** Static params: the generated demo routine plus the demo routine list ids. */
export function generateStaticParams() {
  const ids = new Set<string>([DEMO_ROUTINE_ID, ...MOCK_ROUTINES_LIST.map((r) => r.id)]);
  return [...ids].map((id) => ({ id }));
}

export default async function RoutineEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RoutineEditor routineId={id} />;
}
