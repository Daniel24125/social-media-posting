'use server';

import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addTeamMember(projectId: string, formData: FormData) {
  const session = await auth0.getSession();
  if (!session || !session.user) {
    throw new Error('Not authenticated');
  }

  const email = formData.get('email') as string;

  if (!email || email.trim() === '') {
    throw new Error('Email is required');
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser) {
    throw new Error('User not found');
  }

  // Security: Check if current user is an OWNER of this project
  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: dbUser.id,
        projectId,
      },
    },
  });

  if (!membership || membership.role !== 'OWNER') {
    throw new Error('Unauthorized. Only project owners can add members.');
  }

  // Check if user to add exists in our system
  const userToAdd = await prisma.user.findUnique({
    where: { email },
  });

  if (!userToAdd) {
    throw new Error('User with this email does not exist in our system. They must log in at least once first.');
  }

  // Add the user to the project
  try {
    await prisma.projectMember.create({
      data: {
        userId: userToAdd.id,
        projectId,
        role: 'MEMBER',
      },
    });
  } catch (error: any) {
    // Unique constraint violation if already added
    if (error.code === 'P2002') {
      throw new Error('User is already a member of this project.');
    }
    throw error;
  }

  revalidatePath(`/dashboard/${projectId}/settings`);
}
