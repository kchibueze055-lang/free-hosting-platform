import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const siteName = formData.get('siteName') as string;

    if (!file || !siteName) {
      return NextResponse.json(
        { error: 'File and Site Name are required' },
        { status: 400 }
      );
    }

    // Force strict folder creation: sites/<siteName>/<fileName>
    const cleanSiteName = siteName.trim();
    const storagePath = `sites/${cleanSiteName}/${file.name}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from('user-hosting-bucket')
      .upload(storagePath, buffer, {
        contentType: file.type || 'text/html',
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      path: storagePath,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}