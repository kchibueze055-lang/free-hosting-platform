import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteName: string }> }
) {
  // 1. Resolve params promise
  const resolvedParams = await params;
  
  // 2. Decode %20 into spaces (e.g. "kcey%20digital" -> "kcey digital")
  const siteName = decodeURIComponent(resolvedParams.siteName);

  // 3. Download from Supabase bucket path
  const { data, error } = await supabase.storage
    .from('user-hosting-bucket')
    .download(`sites/${siteName}/index.html`);

  if (error || !data) {
    return new NextResponse(`Site "${siteName}" not found in storage.`, { 
      status: 404 
    });
  }

  // 4. Return raw HTML
  const htmlContent = await data.text();

  return new NextResponse(htmlContent, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}