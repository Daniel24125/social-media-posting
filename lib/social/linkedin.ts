export async function publishToLinkedin(
  accessToken: string,
  profileId: string, // Can be urn:li:person:ID or urn:li:organization:ID
  content: string,
  imageUrls?: string[] | null
) {
  const isOrganization = profileId.startsWith('urn:li:organization');
  const authorUrn = profileId.includes('urn:li:') ? profileId : (isOrganization ? `urn:li:organization:${profileId}` : `urn:li:person:${profileId}`);

  const mediaUrns: string[] = [];

  // 1. If imageUrls exists, loop and perform 2-step media upload
  if (imageUrls && imageUrls.length > 0) {
    for (const imageUrl of imageUrls) {
      try {
        // Step 1: Initialize Upload
        const initResponse = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Linkedin-Version': '202605',
            'X-Restli-Protocol-Version': '2.0.0'
          },
          body: JSON.stringify({
            initializeUploadRequest: {
              owner: authorUrn
            }
          })
        });

        if (!initResponse.ok) {
          const errorText = await initResponse.text();
          throw new Error(`LinkedIn Image Initialization Failed: ${errorText}`);
        }

        const initData = await initResponse.json();
        const uploadUrl = initData.value.uploadUrl;
        const mediaUrn = initData.value.image;

        // Fetch the binary of the image to upload
        const imageFetchResponse = await fetch(imageUrl);
        if (!imageFetchResponse.ok) {
          throw new Error(`Failed to fetch image binary from URL: ${imageUrl}`);
        }
        const imageBinary = await imageFetchResponse.arrayBuffer();

        // Step 2: Upload Binary
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          body: imageBinary
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`LinkedIn Image Upload Failed: ${errorText}`);
        }

        mediaUrns.push(mediaUrn);
      } catch (err) {
        console.error('LinkedIn Media Upload Error:', err);
        throw err; // Fail fast if asset registration fails
      }
    }
  }

  // 2. Publish Post
  let postContent: Record<string, unknown> = {};

  if (mediaUrns && mediaUrns.length > 0) {
    if (mediaUrns.length === 1) {
      // LinkedIn schema for exactly 1 image
      postContent = {
        media: {
          id: mediaUrns[0]
        }
      };
    } else {
      // LinkedIn schema for 2 to 20 images
      postContent = {
        multiImage: {
          images: mediaUrns.map(urn => ({ id: urn }))
        }
      };
    }
  }

  // Construct the final payload for the /rest/posts endpoint
  const payload: Record<string, unknown> = {
    author: authorUrn,
    commentary: content,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: []
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
    ...(Object.keys(postContent).length > 0 && { content: postContent })
  };

  const postResponse = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Linkedin-Version': '202605',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify(payload)
  });

  if (!postResponse.ok) {
    const errorText = await postResponse.text();
    throw new Error(`LinkedIn Post Failed: ${errorText}`);
  }

  // Wait for the response but linkedin doesn't always return JSON on 201 Created
  if (postResponse.headers.get('content-length') === '0' || postResponse.status === 201) {
    return { success: true, id: postResponse.headers.get('x-restli-id') };
  }
  
  const postData = await postResponse.json().catch(() => ({}));
  return postData;
}
