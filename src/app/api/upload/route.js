import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Cloudinary credentials missing on server.' }, { status: 500 });
    }

    // Read file bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create signature for Cloudinary (Signed Upload)
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signatureStr = `timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');

    // Build signed multipart request for Cloudinary
    const cloudinaryForm = new FormData();
    const fileBlob = new Blob([buffer], { type: file.type });
    cloudinaryForm.append('file', fileBlob, file.name);
    cloudinaryForm.append('api_key', apiKey);
    cloudinaryForm.append('timestamp', timestamp.toString());
    cloudinaryForm.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryForm,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: result.error?.message || 'Cloudinary upload failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: result.secure_url });
  } catch (err) {
    console.error('Server upload error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
