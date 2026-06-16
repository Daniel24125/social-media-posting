import { TwitterApi } from 'twitter-api-v2';

export async function publishToTwitter(
  accessToken: string, // Or accessSecret if using OAuth 1.0a
  accessSecret: string,
  content: string,
  imageUrls: string[] | null
) {
  // Initialize the client. 
  // NOTE: Adjust the client instantiation based on whether the DB stores OAuth 1.0a tokens or OAuth 2.0 Bearer tokens.
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_TOKEN!,
    accessToken: accessToken,
    accessSecret: accessSecret,
  });

  const rwClient = client.readWrite;
  let mediaIds: string[] = [];

  // 1. Process and Upload Media
  if (imageUrls && imageUrls.length > 0) {
    // X allows a maximum of 4 images per tweet
    const urlsToProcess = imageUrls.slice(0, 4);

    for (const url of urlsToProcess) {
      try {
        // Fetch the image from Vercel Blob into a buffer
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to X using the v1.1 media endpoint (standard for media in twitter-api-v2)
        const mediaId = await rwClient.v1.uploadMedia(buffer, { mimeType: response.headers.get('content-type') || 'image/jpeg' });
        mediaIds.push(mediaId);
      } catch (error) {
        console.error(`Failed to upload media ${url} to X:`, error);
        throw new Error("X Media Upload Failed");
      }
    }
  }

  // 2. Publish the Tweet
  try {
    const payload: any = { text: content };
    if (mediaIds.length > 0) {
      payload.media = { media_ids: mediaIds };
    }

    const { data } = await rwClient.v2.tweet(payload);
    return data;
  } catch (error) {
    console.error("Failed to publish to X:", error);
    throw new Error("X Post Failed");
  }
}
