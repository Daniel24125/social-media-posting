'use server';

import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function createScheduledPost(projectId: string, formData: FormData) {
  const session = await auth0.getSession();
  if (!session || !session.user) {
    throw new Error('Not authenticated');
  }

  const content = formData.get('content') as string;
  const platforms = formData.getAll('platforms') as string[];
  const scheduledDateStr = formData.get('scheduledDate') as string;
  const imageUrl = formData.get('imageUrl') as string | null;
  const imageBlobPath = formData.get('imageBlobPath') as string | null;

  if (!content || platforms.length === 0 || !scheduledDateStr) {
    throw new Error('Missing required fields');
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

  await prisma.post.create({
    data: {
      projectId,
      content,
      platforms,
      scheduledDate: new Date(scheduledDateStr),
      status: 'PENDING',
      postedBy: dbUser.id,
      imageUrl: imageUrl || null,
      imageBlobPath: imageBlobPath || null,
    },
  });

  redirect(`/dashboard/${projectId}`);
}
