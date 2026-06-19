import { prisma } from '@/lib/prisma';

export async function publishToFacebook(platformAccountId: string, content: string, projectId: string) {
  // 1. Retrieve the EXACT Page Access Token from the database
  const account = await prisma.connectedAccount.findFirst({
    where: {
      projectId,
      profileId: platformAccountId, // using profileId from the schema
      platform: 'FACEBOOK'
    }
  });

  if (!account || !account.accessToken) {
    throw new Error("Missing Page Access Token for this Facebook Page.");
  }

  // 2. Ensure we are hitting the specific Page endpoint, NOT /me/feed
  const endpoint = `https://graph.facebook.com/v19.0/${platformAccountId}/feed`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: content,
      access_token: account.accessToken, 
    }),
  });

  const data = await response.json();

  // 3. Verbose Debug Logging
  console.log("================ META DEBUG ================");
  console.log("🟢 TARGET ENDPOINT:", endpoint);
  console.log("🟢 TOKEN PREFIX:", account.accessToken.substring(0, 15) + "...");
  console.log("🟢 API RESPONSE:", data);
  console.log("============================================");

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to publish to Facebook");
  }

  return data;
}
