import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
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
        // Complete internal backend verification logs here if necessary
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Blob initialization failed' },
      { status: 400 }
    );
  }
}
