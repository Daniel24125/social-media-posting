import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  // LOG 1: Identify what phase the SDK is currently executing
  console.log(`🟡 BACKEND: Received Blob request type: ${body.type}`);

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        console.log("🟡 BACKEND: Executing onBeforeGenerateToken...");
        const session = await auth0.getSession();

        if (!session || !session.user) {
          console.error("🔴 BACKEND: Auth0 session missing during token generation!");
          throw new Error('Unauthenticated upload attempt blocked');
        }

        console.log("🟢 BACKEND: Auth0 session verified for user:", session.user.sub);
        return {
          // allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          tokenPayload: JSON.stringify({ userId: session.user.sub }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // If this log never appears in production, Vercel's webhook failed to reach your server.
        console.log("🟢 BACKEND: Webhook received! onUploadCompleted triggered for:", blob.url);

        try {
          // Database logic here...
          console.log("🟢 BACKEND: Database updated successfully for payload:", tokenPayload);
        } catch (error) {
          console.error("🔴 BACKEND: Database update failed inside onUploadCompleted:", error);
          throw new Error('Could not update database with uploaded file');
        }
      },
    });

    console.log(`🟢 BACKEND: Returning JSON response for type: ${body.type}`);
    return NextResponse.json(jsonResponse);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("🔴 BACKEND: Fatal error caught in handleUpload execution:", errorMessage);
    return NextResponse.json(
      { error: errorMessage || 'Blob initialization failed' },
      { status: 400 }
    );
  }
}
