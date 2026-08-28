import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { siteName: string } }
) {
  // Decode URL parameters (e.g. handles "kcey%20digital")
  const siteName = decodeURIComponent(params.siteName);

  // Download index.html from Supabase Storage
  const { data, error } = await supabase.storage
    .from('user-hosting-bucket')
    .download(`sites/${siteName}/index.html`);

  if (error || !data) {
    return new NextResponse('Site Not Found', { status: 404 });
  }

  const htmlContent = await data.text();

  // Return the raw HTML to display in the browser
  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}