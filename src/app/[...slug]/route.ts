import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;

  if (!slug || slug.length === 0) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 1. Decode site name and paths
  const pathSegments = slug.map((segment) => decodeURIComponent(segment));
  const siteName = pathSegments[0];

  // 2. Resolve file path in Supabase bucket
  const filePath =
    pathSegments.length === 1
      ? `sites/${siteName}/index.html`
      : `sites/${siteName}/${pathSegments.slice(1).join('/')}`;

  // 3. Fetch file from Supabase Storage
  const { data, error } = await supabase.storage
    .from('user-hosting-bucket')
    .download(filePath);

  if (error || !data) {
    return new NextResponse(`Site file "${filePath}" not found in storage.`, {
      status: 404,
    });
  }

  // 4. Set correct content-type header
  let contentType = 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) contentType = 'text/css';
  else if (filePath.endsWith('.js')) contentType = 'application/javascript';
  else if (filePath.endsWith('.png')) contentType = 'image/png';
  else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';

  const buffer = await data.arrayBuffer();

  return new NextResponse(buffer, {
    headers: { 'Content-Type': contentType },
  });
}