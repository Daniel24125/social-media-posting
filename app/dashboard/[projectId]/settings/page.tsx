import { prisma } from '@/lib/prisma';
import SettingsClient from './SettingsClient';
import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth0.getSession();

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  // Fetch the members for this project
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: true },
    orderBy: { role: 'desc' }, // OWNER first
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workspace Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage team members and workspace access.</p>
      </div>
      
      <SettingsClient 
        projectId={projectId} 
        members={members} 
      />
    </div>
  );
}
