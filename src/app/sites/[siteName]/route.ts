import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  context: { params: Promise<{ slug?: string[] | string }> }
) {
  const resolvedParams = await context.params;
  const rawSlug = resolvedParams.slug;

  if (!rawSlug) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Convert string or array into array segments
  const slugArray = Array.isArray(rawSlug) ? rawSlug : [rawSlug];
  const pathSegments = slugArray.map((segment) => decodeURIComponent(segment));
  const siteName = pathSegments[0];

  // Resolve path inside Supabase bucket
  const filePath =
    pathSegments.length === 1
      ? `sites/${siteName}/index.html`
      : `sites/${siteName}/${pathSegments.slice(1).join('/')}`;

  // Fetch file from Supabase Storage
  const { data, error } = await supabase.storage
    .from('user-hosting-bucket')
    .download(filePath);

  if (error || !data) {
    return new NextResponse(`Site file "${filePath}" not found in storage.`, {
      status: 404,
    });
  }

  // Set Content-Type header dynamically
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