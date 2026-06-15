'use server';

import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { publishToLinkedin } from '@/lib/social/linkedin';
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
  const imageUrls = formData.getAll('imageUrls') as string[];
  const imageBlobPaths = formData.getAll('imageBlobPaths') as string[];

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
      imageUrls: imageUrls,
      imageBlobPaths: imageBlobPaths,
    },
  });

  if (isInstant) {
    try {
      const accounts = await prisma.connectedAccount.findMany({
        where: {
          projectId,
        },
      });

      for (const platformKey of platforms) {
        const [platformType, accountId] = platformKey.split(':');
        
        if (platformType.startsWith('LINKEDIN')) {
          const account = accounts.find((a) => a.id === accountId);
          if (!account || !account.accessToken || !account.profileId) {
            throw new Error(`LinkedIn account not connected for platform ${platformType}`);
          }
          await publishToLinkedin(account.accessToken, account.profileId, content, imageUrls && imageUrls.length > 0 ? imageUrls : null);
        }
        // If there are other platforms (e.g., X, Instagram), we would handle them here.
      }

      await prisma.post.update({
        where: { id: post.id },
        data: { status: 'PUBLISHED' },
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Failed to publish instant post:', error);
      await prisma.post.update({
        where: { id: post.id },
        data: { 
          status: 'FAILED',
          errorMessage: error.message || 'Unknown execution error'
        },
      });
      throw new Error(`Failed to publish post: ${error.message}`);
    }
  }

  redirect(`/dashboard/${projectId}`);
}
