'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

interface SelectedAccount {
  id: string;
  name: string;
  type: 'FACEBOOK' | 'INSTAGRAM';
  accessToken: string;
  username?: string;
}

export async function saveMetaAccounts(projectId: string, accounts: SelectedAccount[]) {
  try {
    for (const account of accounts) {
      await prisma.connectedAccount.upsert({
        where: {
          projectId_platform_profileId: {
            projectId,
            platform: account.type,
            profileId: account.id,
          },
        },
        update: {
          profileHandle: account.username ? `@${account.username}` : account.name,
          accessToken: account.accessToken,
        },
        create: {
          projectId,
          platform: account.type,
          profileId: account.id,
          profileHandle: account.username ? `@${account.username}` : account.name,
          accessToken: account.accessToken,
        },
      });
    }

    // Optional: clean up temp token cookie if it's no longer needed after saving
    const cookieStore = await cookies();
    cookieStore.delete('meta_temp_token');

    revalidatePath(`/dashboard/${projectId}/integrations`);
    return { success: true };
  } catch (error) {
    console.error('Failed to save Meta accounts:', error);
    return { error: 'Failed to link selected accounts to your workspace.' };
  }
}
