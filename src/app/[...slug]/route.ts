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

  // 1. Decode segments (e.g. "kcey%20digital" -> "kcey digital")
  const rawSiteName = decodeURIComponent(slug[0]);
  
  // Create potential matching paths to check in Supabase
  const targetSubPath = slug.length === 1 ? 'index.html' : slug.slice(1).join('/');
  
  const possiblePaths = [
    `sites/${rawSiteName}/${targetSubPath}`,
    `sites/${rawSiteName.trim()}/${targetSubPath}`,
    `sites/${rawSiteName.toLowerCase()}/${targetSubPath}`,
    `sites/${rawSiteName.replace(/\s+/g, '-')}/${targetSubPath}`,
  ];

  let fileBuffer: ArrayBuffer | null = null;
  let matchedPath = '';

  // 2. Try fetching from Supabase using possible folder names
  for (const path of possiblePaths) {
    const { data } = await supabase.storage
      .from('user-hosting-bucket')
      .download(path);

    if (data) {
      fileBuffer = await data.arrayBuffer();
      matchedPath = path;
      break;
    }
  }

  if (!fileBuffer) {
    return new NextResponse(`Site file not found in storage. Checked paths:\n${possiblePaths.join('\n')}`, {
      status: 404,
    });
  }

  // 3. Set content type header
  let contentType = 'text/html; charset=utf-8';
  if (matchedPath.endsWith('.css')) contentType = 'text/css';
  else if (matchedPath.endsWith('.js')) contentType = 'application/javascript';
  else if (matchedPath.endsWith('.png')) contentType = 'image/png';
  else if (matchedPath.endsWith('.jpg') || matchedPath.endsWith('.jpeg')) contentType = 'image/jpeg';

  return new NextResponse(fileBuffer, {
    headers: { 'Content-Type': contentType },
  });
}