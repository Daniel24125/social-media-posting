import { NextResponse } from 'next/server';

export async function GET() {
  // This route is deprecated. All authorization flows have been moved to server actions (app/actions/oauth.ts).
  return new NextResponse('Not Found', { status: 404 });
}
