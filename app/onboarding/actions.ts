'use server';

import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function createFirstWorkspace(formData: FormData) {
  const session = await auth0.getSession();
  if (!session || !session.user) {
    throw new Error('Not authenticated');
  }

  const projectName = formData.get('name') as string;
  if (!projectName || projectName.trim() === '') {
    throw new Error('Workspace name is required');
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser) {
    throw new Error('User not found in database');
  }

  const project = await prisma.project.create({
    data: {
      name: projectName,
      members: {
        create: {
          userId: dbUser.id,
          role: 'OWNER',
        },
      },
    },
  });

  redirect(`/dashboard/${project.id}`);
}
