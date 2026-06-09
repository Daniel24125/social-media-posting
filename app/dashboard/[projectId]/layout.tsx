import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, PenSquare, Settings, Users } from 'lucide-react';
import { WorkspaceSwitcher } from '@/components/shared/WorkspaceSwitcher';

export default async function ProjectDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth0.getSession();

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser) {
    redirect('/auth/login');
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: dbUser.id,
        projectId: projectId,
      },
    },
    include: { project: true },
  });

  if (!membership) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600">403 Forbidden</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            You do not have access to this workspace.
          </p>
          <Link href="/dashboard" className="mt-6 inline-block text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const userProjects = await prisma.projectMember.findMany({
    where: { userId: dbUser.id },
    include: { project: true },
  });

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-zinc-800">
          <WorkspaceSwitcher 
            currentProjectId={projectId} 
            projects={userProjects.map(m => ({ id: m.project.id, name: m.project.name }))} 
          />
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            <li>
              <Link
                href={`/dashboard/${projectId}`}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800"
              >
                <LayoutDashboard className="h-4 w-4" />
                Overview
              </Link>
            </li>
            <li>
              <Link
                href={`/dashboard/${projectId}/compose`}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800"
              >
                <PenSquare className="h-4 w-4" />
                Compose Post
              </Link>
            </li>
            <li>
              <Link
                href={`/dashboard/${projectId}/settings`}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800"
              >
                <Settings className="h-4 w-4" />
                Workspace Settings
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {dbUser.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {dbUser.name}
              </p>
              <a href="/auth/logout" className="text-xs text-red-600 hover:underline">
                Sign out
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {membership.project.name}
          </h2>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
