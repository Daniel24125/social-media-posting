import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const session = await auth0.getSession();
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return new NextResponse('Missing projectId', { status: 400 });
  }

  const { platform } = await params;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/social/${platform}/callback`;

  // We should pass the projectId in the state parameter to retrieve it in the callback
  const state = projectId;

  let authUrl = '';

  switch (platform) {
    case 'linkedin': {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      if (!clientId) return new NextResponse('LinkedIn Client ID not configured', { status: 500 });
      
      const scope = encodeURIComponent('w_member_social openid profile email');
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;
      break;
    }
    case 'x': {
      const clientId = process.env.X_CLIENT_ID;
      if (!clientId) return new NextResponse('X Client ID not configured', { status: 500 });

      const scope = encodeURIComponent('tweet.write users.read offline.access');
      authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}&code_challenge=challenge&code_challenge_method=plain`;
      // Note: Twitter v2 OAuth requires PKCE (code_challenge and code_challenge_method).
      // A robust implementation would generate this dynamically and store it in cookies/session, but we scaffold it here.
      break;
    }
    case 'instagram': {
      const clientId = process.env.INSTAGRAM_CLIENT_ID;
      if (!clientId) return new NextResponse('Instagram Client ID not configured', { status: 500 });

      const scope = encodeURIComponent('instagram_basic instagram_content_publish pages_show_list pages_read_engagement');
      // Meta Graph API authorization URL
      authUrl = `https://www.facebook.com/v19.0/dialog/oauth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;
      break;
    }
    default:
      return new NextResponse('Invalid platform', { status: 400 });
  }

  return NextResponse.redirect(authUrl);
}
