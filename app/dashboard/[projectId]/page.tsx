import { prisma } from '@/lib/prisma';
import DashboardClient from './DashboardClient';
import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth0.getSession();

  if (!session || !session.user) {
    redirect('/api/auth/login');
  }

  // Fetch the posts for this project
  const posts = await prisma.post.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h1>
        <p className="text-gray-600 dark:text-gray-400">Track and manage your social media publications.</p>
      </div>
      
      <DashboardClient 
        projectId={projectId} 
        initialPosts={posts} 
      />
    </div>
  );
}
