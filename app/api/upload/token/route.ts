import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';

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

        // BRIDGE: Look up the real internal Database User
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email } 
        });

        if (!dbUser) {
          throw new Error('Authenticated Auth0 user does not exist in the internal PostgreSQL database.');
        }

        console.log("🟢 BACKEND: Database User located:", dbUser.id);
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          addRandomSuffix: true,
          // CRITICAL FIX: Pass the true DB UUID to the webhook, NOT the Auth0 sub!
          tokenPayload: JSON.stringify({ userId: dbUser.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("🟡 BACKEND WEBHOOK: Triggered for URL:", blob.url);
        
        try {
          // 1. Ensure the tokenPayload exists
          if (!tokenPayload) {
            throw new Error("No token payload provided by Vercel Blob.");
          }

          // 2. Safely parse the stringified JSON payload
          const parsedPayload = JSON.parse(tokenPayload);
          const userId = parsedPayload.userId;

          if (!userId) {
            throw new Error("Parsed payload does not contain a userId.");
          }

          console.log(`🟡 BACKEND WEBHOOK: Attempting to save to Prisma for User: ${userId}`);

          // 3. Execute the database insertion
          const savedRecord = await prisma.media.create({
            data: {
              url: blob.url,
              userId: userId,
            }
          });

          console.log("🟢 BACKEND WEBHOOK: Successfully saved Media record to DB:", savedRecord.id);

        } catch (error) {
          // This catch block is critical. If Prisma fails (e.g., foreign key constraint, missing field), 
          // this log will reveal the exact cause.
          console.error("🔴 BACKEND WEBHOOK FATAL ERROR: Failed to save to PostgreSQL:", error);
          // Note: Throwing an error here won't crash the frontend upload, 
          // but it will flag the Vercel logs so we can see it.
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
