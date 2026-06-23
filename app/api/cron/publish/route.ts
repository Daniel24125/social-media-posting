import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publishToLinkedin } from '@/lib/social/linkedin';
import { publishToFacebook } from '@/lib/social/facebook';
import { publishToInstagram } from '@/lib/social/instagram';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.API_CRON_KEY;

  if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    // Return a self-diagnosing JSON payload so the GitHub Actions runner prints exactly what went wrong
    return NextResponse.json({
      error: "Unauthorized",
      debug: {
        envVarExists: !!expectedKey,
        headerExists: !!authHeader,
        headerMatches: authHeader === `Bearer ${expectedKey}`
      }
    }, { status: 401 });
  }

  try {
    const postsToProcess = await prisma.post.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: new Date(),
        },
      },
    });

    const results = [];

    for (const post of postsToProcess) {
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
            await publishToLinkedin(
              account.accessToken,
              account.profileId,
              post.content,
              post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls : null
            );
          } else if (platformType === 'FACEBOOK') {
            const account = accounts.find((a) => a.id === accountId);
            if (!account || !account.accessToken || !account.profileId) {
              throw new Error(`Facebook account not connected or missing token for platform ${platformType}`);
            }
            await publishToFacebook(
              account.profileId,
              post.content,
              account.accessToken,
              post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls : undefined
            );
          } else if (platformType === 'INSTAGRAM') {
            const account = accounts.find((a) => a.id === accountId);
            if (!account || !account.accessToken || !account.profileId) {
              throw new Error(`Instagram account not connected or missing token for platform ${platformType}`);
            }
            await publishToInstagram(
              account.profileId,
              post.content,
              account.accessToken,
              post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls : undefined
            );
          }
        }

        await prisma.post.update({
          where: { id: post.id },
          data: { status: 'PUBLISHED' },
        });

        results.push({ postId: post.id, status: 'PUBLISHED' });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`Failed to process post ${post.id}:`, error);

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

    return NextResponse.json({ success: true, processed: postsToProcess.length, results });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Fatal error in cron publish worker:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
