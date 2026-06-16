import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth0 } from '@/lib/auth0';
import * as xlsx from 'xlsx';
import { format } from 'date-fns';
import { Post } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth0.getSession();
  if (!session || !session.user) return new NextResponse('Unauthorized', { status: 401 });

  const { projectId } = await params;

  // 1. Fetch posts and users
  const posts = await prisma.post.findMany({
    where: { projectId },
    orderBy: { scheduledAt: 'desc' }
  });



  const exportData: Record<string, string>[] = [];

  posts.forEach((post: Post) => {
    const dateFormatted = post.scheduledAt ? format(new Date(post.scheduledAt), 'dd/MM/yyyy') : 'N/A';

    if (post.platforms.length === 0) {
      exportData.push({
        'Date': dateFormatted,
        'Type of activity': 'Post on social Media',
        'Role': "Post author",
        'Activity Description': post.title,
        'Outreach': '',
        'Link': post.postLink || ''
      });
    } else {
      post.platforms.forEach(platform => {
        const platformFormatted = platform === 'X' ? 'X (Twitter)' : platform.charAt(0) + platform.slice(1).toLowerCase();

        exportData.push({
          'Date': dateFormatted,
          'Type of activity': `Post on social Media (${platformFormatted})`,
          'Role': "Post author",
          'Activity Description': post.title,
          'Outreach': '',
          'Link': post.postLink || ''
        });
      });
    }
  });

  // 3. Generate .xlsx buffer
  const worksheet = xlsx.utils.json_to_sheet(exportData);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Outreach Activities');

  const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  // 4. Return as downloadable file
  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Disposition': `attachment; filename="SUNRISE_Outreach_Tracking_${format(new Date(), 'yyyy-MM-dd')}.xlsx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  });
}
