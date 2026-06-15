import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth0.getSession();
        if (!session || !session.user) {
          throw new Error('Unauthenticated upload attempt blocked');
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          tokenPayload: JSON.stringify({
            userId: session.user.sub,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Vercel Blob finished uploading:', blob.url);

        try {
          const payload = JSON.parse(tokenPayload || '{}');
          const userId = payload.userId;

          // TODO: Add your database logic here (e.g., Prisma)
          // Save `blob.url` to your user profile or media library
          // await prisma.media.create({ data: { url: blob.url, userId } });

        } catch (error) {
          console.error("Failed to sync completed upload to database:", error);
          throw new Error('Could not update database with uploaded file');
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Vercel Blob Upload Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || 'Blob initialization failed' },
      { status: 400 }
    );
  }
}
