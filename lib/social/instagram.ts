export async function publishToInstagram(igUserId: string, content: string, accessToken: string, imageUrls?: string[]) {
  if (!imageUrls || imageUrls.length === 0) {
    throw new Error("Instagram requires at least one image or video to publish.");
  }

  // STEP 1: Create the Media Container
  const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrls[0],
      caption: content,
      access_token: accessToken,
    }),
  });

  const containerData = await containerRes.json();
  if (!containerRes.ok) {
    console.error("🟢 IG CONTAINER ERROR:", JSON.stringify(containerData, null, 2));
    throw new Error(containerData.error?.message || "Failed to create Instagram media container");
  }

  // STEP 2: Publish the Container
  const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerData.id,
      access_token: accessToken,
    }),
  });

  const publishData = await publishRes.json();
  if (!publishRes.ok) {
    console.error("🟢 IG PUBLISH ERROR:", JSON.stringify(publishData, null, 2));
    throw new Error(publishData.error?.message || "Failed to publish Instagram container");
  }

  return publishData;
}
