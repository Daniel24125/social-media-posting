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
    select: { id: true, platform: true, profileHandle: true }
  });

  const connectedPlatforms = connections.map(c => ({
    id: c.id,
    platform: c.platform,
    profileHandle: c.profileHandle
  }));

  return (
    <div>
      <ComposeClient projectId={projectId} connectedPlatforms={connectedPlatforms} />
    </div>
  );
}
