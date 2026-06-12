'use server';

export async function getLinkedInAuthorizeUrl(type: 'personal' | 'page', projectId: string) {
  const clientId = type === 'personal' 
    ? process.env.LINKEDIN_PERSONAL_CLIENT_ID 
    : process.env.LINKEDIN_PAGE_CLIENT_ID;

  if (!clientId) {
    return { error: 'LinkedIn Client ID not configured in your environment variables.' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/social/linkedin-${type}/callback`;
  const scope = type === 'personal'
    ? 'openid profile email w_member_social'
    : 'openid profile email w_member_social w_organization_social r_organization_admin';

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${projectId}&scope=${encodeURIComponent(scope)}`;

  return { url: authUrl };
}
