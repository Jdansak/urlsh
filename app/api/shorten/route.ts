import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { saveUrl, findCodeByOriginal, getUrl } from '@/lib/store';

export async function POST(req: NextRequest) {
  const body = await req.json() as { url?: string };
  const { url } = body;

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Missing url field.' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return NextResponse.json(
      { error: 'Only http and https URLs are allowed.' },
      { status: 400 }
    );
  }

  const normalized = parsed.toString();

  // Reuse existing code if this URL was already shortened
  const existingCode = await findCodeByOriginal(normalized);
  if (existingCode) {
    const data = await getUrl(existingCode);
    return NextResponse.json({
      shortUrl: `${req.nextUrl.origin}/${existingCode}`,
      code: existingCode,
      hits: data?.hits ?? 0,
    });
  }

  const code = nanoid(7);
  await saveUrl(code, normalized);

  return NextResponse.json({
    shortUrl: `${req.nextUrl.origin}/${code}`,
    code,
    hits: 0,
  });
}
