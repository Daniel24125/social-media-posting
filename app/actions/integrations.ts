'use server';

import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function disconnectAccount(projectId: string, platform: string) {
  const session = await auth0.getSession();
  if (!session || !session.user) {
    throw new Error('Not authenticated');
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser) {
    throw new Error('User not found');
  }

  // Security: Check if user has access to this project
  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: dbUser.id,
        projectId,
      },
    },
  });

  if (!membership) {
    throw new Error('Unauthorized');
  }

  await prisma.connectedAccount.deleteMany({
    where: {
      projectId,
      platform,
    },
  });

  revalidatePath(`/dashboard/${projectId}/integrations`);
  revalidatePath(`/dashboard/${projectId}/compose`);
}

export async function saveLinkedinPage(projectId: string, profileId: string, profileHandle: string) {
  const session = await auth0.getSession();
  if (!session || !session.user) throw new Error('Not authenticated');

  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('linkedin_temp_token')?.value;

  if (!accessToken) throw new Error('No access token found. Please authenticate again.');

  const existingAccount = await prisma.connectedAccount.findFirst({
    where: {
      projectId,
      platform: 'LINKEDIN-PAGE',
      profileId
    }
  });

  if (existingAccount) {
    await prisma.connectedAccount.update({
      where: { id: existingAccount.id },
      data: { accessToken, profileHandle }
    });
  } else {
    await prisma.connectedAccount.create({
      data: {
        projectId,
        platform: 'LINKEDIN-PAGE',
        accessToken,
        profileId,
        profileHandle
      }
    });
  }

  cookieStore.delete('linkedin_temp_token');
  revalidatePath(`/dashboard/${projectId}/integrations`);
  revalidatePath(`/dashboard/${projectId}/compose`);
}
