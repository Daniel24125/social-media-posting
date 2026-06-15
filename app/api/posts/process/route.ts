import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publishToLinkedin } from '@/lib/social/linkedin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Find all posts that are pending and due for processing
    const postsToProcess = await prisma.post.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] }, // Also pick up any stuck in processing
        scheduledDate: {
          lte: new Date(),
        },
      },
    });

    const results = [];

    for (const post of postsToProcess) {
      // Mark as processing first to avoid double-processing if cron runs concurrently
      await prisma.post.update({
        where: { id: post.id },
        data: { status: 'PROCESSING' },
      });

      try {
        const accounts = await prisma.connectedAccount.findMany({
          where: {
            projectId: post.projectId,
          },
        });

        for (const platformKey of post.platforms) {
          const [platformType, accountId] = platformKey.split(':');
          if (platformType.startsWith('LINKEDIN')) {
            const account = accounts.find((a) => a.id === accountId);
            if (!account || !account.accessToken || !account.profileId) {
              throw new Error(`LinkedIn account not connected for platform ${platformType}`);
            }
            await publishToLinkedin(account.accessToken, account.profileId, post.content, post.imageUrl);
          }
          // Other platforms would be handled here
        }

        // Mark as published on success
        await prisma.post.update({
          where: { id: post.id },
          data: { status: 'PUBLISHED' },
        });

        results.push({ postId: post.id, status: 'PUBLISHED' });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`Failed to process post ${post.id}:`, error);
        
        // Immediately update Prisma so the post status becomes FAILED
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message || 'Unknown execution error',
          },
        });

        results.push({ postId: post.id, status: 'FAILED', error: error.message });
      }
    }

    return NextResponse.json({ success: true, processedCount: postsToProcess.length, results });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Fatal error in post processing worker:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
