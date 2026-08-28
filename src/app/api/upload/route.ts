import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2 } from '@/lib/r2';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const siteName = formData.get('siteName') as string | null;

    if (!file || !siteName) {
      return NextResponse.json(
        { error: 'Missing file or project name.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Standard key path in R2
    const key = `sites/${siteName}/index.html`;

    // 1. Force upload to Cloudflare R2 first
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || 'user-hosting-bucket',
        Key: key,
        Body: buffer,
        ContentType: file.type || 'text/html',
      })
    );

    // 2. Write or update row in Supabase
    const { error: dbError } = await supabase.from('sites').upsert(
      [
        {
          site_name: siteName,
          file_path: key,
        },
      ],
      { onConflict: 'site_name' }
    );

    if (dbError) {
      return NextResponse.json(
        { error: `Database Error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Site deployed successfully!',
      filePath: key,
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}