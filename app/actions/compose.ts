'use server';

import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function createScheduledPost(projectId: string, formData: FormData) {
  const session = await auth0.getSession();
  if (!session || !session.user) {
    throw new Error('Not authenticated');
  }

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const platforms = formData.getAll('platforms') as string[];
  const isInstant = formData.get('isInstant') === 'true';
  const scheduledDateStr = formData.get('scheduledDate') as string | null;
  const imageUrl = formData.get('imageUrl') as string | null;
  const imageBlobPath = formData.get('imageBlobPath') as string | null;

  if (!title || !content || platforms.length === 0 || (!isInstant && !scheduledDateStr)) {
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

  const post = await prisma.post.create({
    data: {
      projectId,
      title,
      content,
      platforms,
      scheduledDate: isInstant ? new Date() : new Date(scheduledDateStr!),
      status: isInstant ? 'PROCESSING' : 'PENDING',
      postedBy: dbUser.id,
      imageUrl: imageUrl || null,
      imageBlobPath: imageBlobPath || null,
    },
  });

  if (isInstant && process.env.MAKE_WEBHOOK_URL) {
    try {
      await fetch(process.env.MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          content,
          platforms,
          imageUrl: imageUrl || null,
        }),
      });
    } catch (err) {
      console.error('Failed to trigger instant post webhook:', err);
      throw new Error('Failed to trigger the webhook for instant posting. Please try again.');
    }
  }

  redirect(`/dashboard/${projectId}`);
}
