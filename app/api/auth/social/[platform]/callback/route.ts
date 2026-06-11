import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';

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
  const projectId = searchParams.get('state'); // We passed projectId in the state parameter
  const error = searchParams.get('error');

  if (error) {
    console.error('OAuth Error:', error, searchParams.get('error_description'));
    return new NextResponse(`OAuth Error: ${error}`, { status: 400 });
  }

  if (!code || !projectId) {
    return new NextResponse('Missing code or state (projectId)', { status: 400 });
  }

  const { platform } = await params;

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
  const refreshToken = null;
  const expiresAt = null;
  const profileId = null;
  let profileHandle = null;
  const dbPlatformId = platform.toUpperCase(); // "LINKEDIN", "X", "INSTAGRAM"

  // Scaffold token exchange logic
  switch (platform) {
    case 'linkedin': {
      // TODO: Implement actual token exchange POST request to LinkedIn
      // const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', { ... })
      
      // Placeholder for scaffold
      accessToken = `mock_linkedin_access_token_${code}`;
      profileHandle = 'LinkedIn User';
      break;
    }
    case 'x': {
      // TODO: Implement actual token exchange POST request to X/Twitter
      accessToken = `mock_x_access_token_${code}`;
      profileHandle = '@twitter_user';
      break;
    }
    case 'instagram': {
      // TODO: Implement actual token exchange POST request to Meta Graph API
      accessToken = `mock_instagram_access_token_${code}`;
      profileHandle = '@instagram_user';
      break;
    }
    default:
      return new NextResponse('Invalid platform', { status: 400 });
  }

  // Upsert the token into the ConnectedAccount table
  await prisma.connectedAccount.upsert({
    where: {
      projectId_platform: {
        projectId,
        platform: dbPlatformId,
      },
    },
    update: {
      accessToken,
      refreshToken,
      expiresAt,
      profileId,
      profileHandle,
    },
    create: {
      projectId,
      platform: dbPlatformId,
      accessToken,
      refreshToken,
      expiresAt,
      profileId,
      profileHandle,
    },
  });

  // Redirect back to integrations page
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return NextResponse.redirect(`${baseUrl}/dashboard/${projectId}/integrations`);
}
