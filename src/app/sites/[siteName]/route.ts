import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2 } from '@/lib/r2';
import { supabase } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  // 1. Un-wrap params and catch any folder naming variation
  const resolvedParams = await params;
  const siteName =
    resolvedParams?.siteName ||
    resolvedParams?.sitename ||
    resolvedParams?.site_name;

  if (!siteName) {
    return new NextResponse('Invalid site name provided in URL route.', {
      status: 400,
    });
  }

  try {
    // 2. Look up the record in your Supabase sites table
    const { data: siteRecord, error: dbError } = await supabase
      .from('sites')
      .select('file_path')
      .eq('site_name', siteName)
      .single();

    if (dbError || !siteRecord?.file_path) {
      return new NextResponse(
        `Site '${siteName}' not found in database.`,
        { status: 404 }
      );
    }

    // 3. Fetch the file directly from Cloudflare R2
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'user-hosting-bucket',
      Key: siteRecord.file_path,
    });

    const response = await r2.send(command);

    if (!response.Body) {
      return new NextResponse('File content is empty.', { status: 404 });
    }

    const content = await response.Body.transformToString();

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Render error:', error);
    return new NextResponse(`Storage Error: ${error.message}`, {
      status: 500,
    });
  }
}