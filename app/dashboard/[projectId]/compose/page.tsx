import ComposeClient from './ComposeClient';

export default async function ComposePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div>
      <ComposeClient projectId={projectId} />
    </div>
  );
}
