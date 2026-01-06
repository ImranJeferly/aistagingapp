import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
     const { sessionId, originalImageUrl, stagedImageUrl, style, roomType } = await request.json();
     
     const forwardedFor = request.headers.get('x-forwarded-for');
     const realIp = request.headers.get('x-real-ip');
     const ip = forwardedFor || realIp || '127.0.0.1';
     const clientIp = ip.split(',')[0].trim();
     
     console.log(`[Guest Save] Attempting save for IP: ${clientIp}, Session: ${sessionId}`);

     if (!adminDb) {
        // This log will appear in Vercel/Server logs, aiding debugging without exposing secrets to client
        console.error('[Guest Save] Database connection failed. Possible causes: Missing FIREBASE_SERVICE_ACCOUNT keys in environment variables.');
        return NextResponse.json({ error: 'Server configuration error - DB not connected' }, { status: 500 });
     }

     // Validate payload
     if (!originalImageUrl || !stagedImageUrl) {
        console.error('[Guest Save] Missing image URLs');
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
     }

     // Double check limit
     const check = await adminDb.collection('guest_uploads')
       .where('ipAddress', '==', clientIp)
       .get();
    
     if (!check.empty) {
        console.warn(`[Guest Save] Limit reached for IP: ${clientIp}`);
        return NextResponse.json({ error: 'Free limit reached. Cannot save upload.' }, { status: 429 });
     }

     const docRef = await adminDb.collection('guest_uploads').add({
        sessionId,
        ipAddress: clientIp,
        originalImageUrl,
        stagedImageUrl,
        style,
        roomType,
        uploadedAt: Timestamp.now(),
        isGuest: true,
        claimed: false
     });

     return NextResponse.json({ success: true, id: docRef.id });

  } catch (err: any) {
      console.error('Error saving guest upload:', err);
      return NextResponse.json({ error: err.message || 'Failed to save upload' }, { status: 500 });
  }
}
