'use server';

import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { del } from '@vercel/blob';

export async function createManualPost(projectId: string, formData: FormData) {
  const session = await auth0.getSession();
  if (!session || !session.user) {
    throw new Error('Not authenticated');
  }

  const content = formData.get('content') as string;
  const platforms = formData.getAll('platforms') as string[];
  const scheduledDateStr = formData.get('scheduledDate') as string;

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
      status: 'MANUAL',
      postedBy: dbUser.id,
    },
  });

  revalidatePath(`/dashboard/${projectId}`);
}

export async function deleteScheduledPost(postId: string, projectId: string) {
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

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new Error('Post not found');
  }

  if (post.projectId !== projectId) {
    throw new Error('Post does not belong to this project');
  }

  if (post.imageBlobPath) {
    try {
      await del(post.imageBlobPath);
    } catch (err) {
      console.error('Failed to delete blob image:', err);
    }
  }

  await prisma.post.delete({
    where: { id: postId },
  });

  revalidatePath(`/dashboard/${projectId}`);
}
