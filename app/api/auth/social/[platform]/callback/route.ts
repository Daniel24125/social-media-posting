import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const session = await auth0.getSession();
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const { platform } = await params;
  
  // Retrieve projectId based on platform
  const projectId = searchParams.get('state'); // Default for LinkedIn

  if (error) {
    console.error('OAuth Error:', error, searchParams.get('error_description'));
    return new NextResponse(`OAuth Error: ${error}`, { status: 400 });
  }

  if (!code || !projectId) {
    return new NextResponse('Missing code or projectId', { status: 400 });
  }

  // Verify user has access to this project
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser) return new NextResponse('User not found', { status: 404 });

  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: dbUser.id,
        projectId,
      },
    },
  });

  if (!membership) return new NextResponse('Unauthorized for this project', { status: 403 });

  let accessToken = '';
  const refreshToken: string | null = null;
  const expiresAt: Date | null = null;
  let profileId: string | null = null;
  let profileHandle: string | null = null;
  const dbPlatformId = platform.toUpperCase(); // "LINKEDIN-PERSONAL", "LINKEDIN-PAGE", "X", "INSTAGRAM"

  // Token exchange logic
  switch (platform) {
    case 'linkedin-personal':
    case 'linkedin-page': {
      const isPersonal = platform === 'linkedin-personal';
      const clientId = isPersonal ? process.env.LINKEDIN_PERSONAL_CLIENT_ID : process.env.LINKEDIN_PAGE_CLIENT_ID;
      const clientSecret = isPersonal ? process.env.LINKEDIN_PERSONAL_CLIENT_SECRET : process.env.LINKEDIN_PAGE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return new NextResponse(`LinkedIn ${isPersonal ? 'Personal' : 'Page'} credentials not configured`, { status: 500 });
      }

      const redirectUri = `${process.env.APP_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://s-media-posting.vercel.app' : 'http://localhost:3000')}/api/auth/social/${platform}/callback`;

      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('LinkedIn Token Error:', errorText);
        return new NextResponse('Failed to exchange token', { status: 500 });
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;

      if (isPersonal) {
        // Fetch profile to get urn and name
        const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          profileId = profileData.sub; // This is the URN in OIDC
          profileHandle = profileData.name;
        } else {
          profileId = 'urn:li:person:unknown';
          profileHandle = 'LinkedIn User (Personal)';
        }
      } else {
        const cookieStore = await cookies();
        cookieStore.set('linkedin_temp_token', accessToken, { secure: true, httpOnly: true });
        const baseUrl = process.env.APP_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://s-media-posting.vercel.app' : 'http://localhost:3000');
        return NextResponse.redirect(`${baseUrl}/dashboard/${projectId}/integrations/linkedin/select`);
      }
      break;
    }

    case 'meta': {
      const clientId = process.env.META_APP_ID;
      const clientSecret = process.env.META_APP_SECRET;

      if (!clientId || !clientSecret) {
        return new NextResponse('Meta credentials not configured', { status: 500 });
      }

      const baseUrl = process.env.APP_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://s-media-posting.vercel.app' : 'http://localhost:3000');
      const redirectUri = `${baseUrl}/api/auth/social/meta/callback`;

      const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`);

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Meta Token Error:', errorText);
        return new NextResponse('Failed to exchange token', { status: 500 });
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
      
      const cookieStore = await cookies();
      cookieStore.set('meta_temp_token', accessToken, { secure: true, httpOnly: true });
      return NextResponse.redirect(`${baseUrl}/dashboard/${projectId}/integrations/meta/select`);
    }
    default:
      return new NextResponse('Invalid platform', { status: 400 });
  }

  // Save the token into the ConnectedAccount table
  const existingAccount = await prisma.connectedAccount.findFirst({
    where: {
      projectId,
      platform: dbPlatformId,
      profileId: profileId || null
    }
  });

  if (existingAccount) {
    await prisma.connectedAccount.update({
      where: { id: existingAccount.id },
      data: { accessToken, refreshToken, expiresAt, profileHandle }
    });
  } else {
    await prisma.connectedAccount.create({
      data: {
        projectId, platform: dbPlatformId, accessToken, refreshToken, expiresAt, profileId, profileHandle
      }
    });
  }

  // Redirect back to integrations page
  const baseUrl = process.env.APP_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://s-media-posting.vercel.app' : 'http://localhost:3000');
  return NextResponse.redirect(`${baseUrl}/dashboard/${projectId}/integrations`);
}
