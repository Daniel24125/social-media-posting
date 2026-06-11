import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  if (!session || !session.user || typeof session.user.email !== 'string') {
    redirect('/auth/login');
  }

  const { email, name } = session.user;

  // User Synchronization Sync
  let dbUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email,
        name: name || email,
      },
    });
  }

  // Tenant Verification: check if this user has any records inside ProjectMember
  const memberships = await prisma.projectMember.findMany({
    where: { userId: dbUser.id },
  });

  if (memberships.length === 0) {
    // If they do not belong to any workspace, redirect to /onboarding
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-50">
      {children}
    </div>
  );
}
