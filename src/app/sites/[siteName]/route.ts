import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteName: string }> }
) {
  const resolvedParams = await params;
  const siteName = decodeURIComponent(resolvedParams.siteName);

  const { data, error } = await supabase.storage
    .from('user-hosting-bucket')
    .download(`sites/${siteName}/index.html`);

  if (error || !data) {
    return new NextResponse('Site Not Found', { status: 404 });
  }

  const htmlContent = await data.text();

  return new NextResponse(htmlContent, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}