export async function publishToFacebook(pageId: string, content: string, accessToken: string, imageUrls?: string[]) {
  const hasMedia = imageUrls && imageUrls.length > 0;
  const endpoint = hasMedia ? `/${pageId}/photos` : `/${pageId}/feed`;
  
  const payload: Record<string, string> = {
    access_token: accessToken,
  };

  // Map fields correctly based on the endpoint
  if (hasMedia) {
    payload.url = imageUrls[0];
    payload.message = content; // Facebook uses 'message' for the caption on photos
  } else {
    payload.message = content;
  }

  const response = await fetch(`https://graph.facebook.com/v19.0${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("🟢 FB RAW ERROR:", JSON.stringify(data, null, 2));
    throw new Error(data.error?.message || "Failed to publish to Facebook");
  }
  return data;
}
