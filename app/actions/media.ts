'use server';

import { del } from '@vercel/blob';
import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';

export async function deleteMedia(url: string) {
  console.log(`🟡 SERVER ACTION: Attempting to delete media URL: ${url}`);
  
  const session = await auth0.getSession();
  if (!session || !session.user) {
    console.error("🔴 ACTION BLOCKED: No authenticated session found.");
    throw new Error("Unauthorized");
  }

  // BRIDGE: Look up the real internal Database User
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!dbUser) {
    console.error("🔴 ACTION BLOCKED: User mapping failed. Auth0 user not in PostgreSQL.");
    throw new Error("User mapping failed.");
  }

  // Check if the database record actually exists
  const mediaRecord = await prisma.media.findFirst({ where: { url } });
  
  if (!mediaRecord) {
    console.error("🔴 ACTION BLOCKED: Media record not found in PostgreSQL database for URL:", url);
    return { success: false, message: "Media not found in database" };
  }

  // CRITICAL FIX: Compare against the DB UUID, not the Auth0 sub
  if (mediaRecord.userId !== dbUser.id) {
    console.error(`🔴 ACTION BLOCKED: User ID mismatch. RecordOwner: ${mediaRecord.userId}, SessionUser: ${dbUser.id}`);
    throw new Error("Forbidden: You do not own this file.");
  }

  try {
    console.log("🟡 SECURITY PASSED: Executing Vercel Blob del()...");
    await del(url);
    console.log("🟢 VERCEL BLOB: File permanently deleted from cloud.");

    await prisma.media.delete({ where: { id: mediaRecord.id } });
    console.log("🟢 POSTGRESQL: Relational record deleted.");

    return { success: true };
  } catch (error) {
    console.error("🔴 FATAL ERROR: Deletion execution failed:", error);
    throw new Error("Internal Server Error");
  }
}
