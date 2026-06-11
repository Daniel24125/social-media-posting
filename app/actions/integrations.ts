'use server';

import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function disconnectAccount(projectId: string, platform: string) {
  const session = await auth0.getSession();
  if (!session || !session.user) {
    throw new Error('Not authenticated');
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser) {
    throw new Error('User not found');
  }

  // Security: Check if user has access to this project
  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: dbUser.id,
        projectId,
      },
    },
  });

  if (!membership) {
    throw new Error('Unauthorized');
  }

  await prisma.connectedAccount.deleteMany({
    where: {
      projectId,
      platform,
    },
  });

  revalidatePath(`/dashboard/${projectId}/integrations`);
  revalidatePath(`/dashboard/${projectId}/compose`);
}
