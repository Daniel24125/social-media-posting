import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';

export default async function DashboardRootPage() {
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

  const mostRecentMembership = await prisma.projectMember.findFirst({
    where: { userId: dbUser.id },
    include: { project: true },
    orderBy: { project: { createdAt: 'desc' } },
  });

  if (mostRecentMembership) {
    redirect(`/dashboard/${mostRecentMembership.projectId}`);
  }

  redirect('/onboarding');
}
