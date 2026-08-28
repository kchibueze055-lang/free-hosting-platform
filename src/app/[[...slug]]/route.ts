import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // If visiting root '/', let Next.js render app/page.tsx
  if (!slug || slug.length === 0) {
    return NextResponse.next();
  }

  // 1. Decode URL parameters (e.g. ['kcey%20digital', 'index.html'] -> ['kcey digital', 'index.html'])
  const pathSegments = slug.map((segment) => decodeURIComponent(segment));
  const siteName = pathSegments[0];

  // 2. Determine file path inside Supabase bucket
  // If user requests /kcey digital, default to /index.html; otherwise keep sub-path
  const filePath =
    pathSegments.length === 1
      ? `sites/${siteName}/index.html`
      : `sites/${siteName}/${pathSegments.slice(1).join('/')}`;

  // 3. Fetch from Supabase Storage
  const { data, error } = await supabase.storage
    .from('user-hosting-bucket')
    .download(filePath);

  if (error || !data) {
    return new NextResponse(`File or Site "${filePath}" not found in storage.`, {
      status: 404,
    });
  }

  // 4. Determine correct Content-Type header
  let contentType = 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) contentType = 'text/css';
  else if (filePath.endsWith('.js')) contentType = 'application/javascript';
  else if (filePath.endsWith('.png')) contentType = 'image/png';
  else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';

  const buffer = await data.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
    },
  });
}