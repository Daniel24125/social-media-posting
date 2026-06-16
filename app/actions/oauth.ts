'use server';

import { cookies } from 'next/headers';
import { TwitterApi } from 'twitter-api-v2';

export async function getAuthorizeUrl(authPath: string, projectId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/social/${authPath}/callback`;

  switch (authPath) {
    case 'linkedin-personal': {
      const clientId = process.env.LINKEDIN_PERSONAL_CLIENT_ID;
      if (!clientId) return { error: 'LinkedIn Personal Client ID not configured in your environment variables.' };

      const scope = encodeURIComponent('openid profile email w_member_social');
      return { url: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${projectId}&scope=${scope}` };
    }
    case 'linkedin-page': {
      const clientId = process.env.LINKEDIN_PAGE_CLIENT_ID;
      if (!clientId) return { error: 'LinkedIn Page Client ID not configured in your environment variables.' };

      const scope = encodeURIComponent('openid profile email w_member_social w_organization_social r_organization_admin');
      return { url: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${projectId}&scope=${scope}` };
    }
    case 'x': {
      const clientId = process.env.TWITTER_CLIENT_ID || process.env.TWITTER_CLIENTID;
      if (!clientId) return { error: 'X Client ID not configured in your environment variables.' };

      const client = new TwitterApi({ clientId: clientId });
      
      // Generate the secure PKCE link (automatically uses S256 hashing)
      const { url, codeVerifier, state: oauthState } = client.generateOAuth2AuthLink(
        redirectUri,
        { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
      );

      const cookieStore = await cookies();
      // Store the verifier and CSRF state
      cookieStore.set('x_code_verifier', codeVerifier, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });
      cookieStore.set('x_oauth_state', oauthState, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });
      // Store the projectId because we can no longer pass it in the URL state
      cookieStore.set('x_project_id', projectId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });

      return { url };
    }
    case 'instagram': {
      const clientId = process.env.INSTAGRAM_CLIENT_ID;
      if (!clientId) return { error: 'Instagram Client ID not configured in your environment variables.' };

      const scope = encodeURIComponent('instagram_basic instagram_content_publish pages_show_list pages_read_engagement');
      return { url: `https://www.facebook.com/v19.0/dialog/oauth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${projectId}&scope=${scope}` };
    }
    default:
      return { error: 'Invalid platform specified.' };
  }
}
