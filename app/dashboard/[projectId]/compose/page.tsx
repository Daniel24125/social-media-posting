import { prisma } from '@/lib/prisma';
import ComposeClient from './ComposeClient';

export default async function ComposePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const connections = await prisma.connectedAccount.findMany({
    where: { projectId },
    select: { platform: true }
  });

  const connectedPlatforms = connections.map(c => c.platform);

  return (
    <div>
      <ComposeClient projectId={projectId} connectedPlatforms={connectedPlatforms} />
    </div>
  );
}
