'use server';

import { del } from '@vercel/blob';
import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';

export async function deleteMedia(url: string) {
  // 1. Authenticate the request
  const session = await auth0.getSession();
  if (!session || !session.user) {
    throw new Error("Unauthorized: You must be logged in to delete media.");
  }

  // 2. Fetch the target media record to verify ownership
  const mediaRecord = await prisma.media.findFirst({
    where: { url }
  });

  if (!mediaRecord) {
    console.warn("Media record not found in database.");
    return { success: false, message: "Media not found" };
  }

  // 3. Authorize ownership (Prevent users from deleting others' files)
  if (mediaRecord.userId !== session.user.sub) {
    throw new Error("Forbidden: You do not own this file.");
  }

  try {
    // 4. Execute Cloud Deletion
    await del(url);

    // 5. Execute Database Deletion
    await prisma.media.delete({
      where: { id: mediaRecord.id }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete media:", error);
    throw new Error("Internal Server Error during deletion process");
  }
}
