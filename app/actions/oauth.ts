'use server';


export async function getAuthorizeUrl(authPath: string, projectId: string) {
  let baseUrl = process.env.APP_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://s-media-posting.vercel.app' : 'http://localhost:3000');
  baseUrl = baseUrl.replace(/\/$/, ''); // Strip trailing slash if present
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

    case 'meta': {
      const clientId = process.env.META_APP_ID;
      if (!clientId) return { error: 'Meta App ID not configured in your environment variables.' };

      const scopes = [
        'instagram_basic',
        'instagram_content_publish',
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'public_profile',
        'business_management'
      ].join(',');
      const scope = encodeURIComponent(scopes);
      return { url: `https://www.facebook.com/v19.0/dialog/oauth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${projectId}&scope=${scope}` };
    }
    default:
      return { error: 'Invalid platform specified.' };
  }
}
