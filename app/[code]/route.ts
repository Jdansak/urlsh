import { NextResponse, after } from 'next/server';
import { getUrl, incrementHits } from '@/lib/store';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const data = await getUrl(code);

  if (!data) {
    return new Response('Short URL not found.', { status: 404 });
  }

  // Increment hit counter in the background — does not delay the redirect
  after(() => incrementHits(code));

  return NextResponse.redirect(data.original, { status: 301 });
}
