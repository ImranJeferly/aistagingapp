import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor || realIp || '127.0.0.1';
    const clientIp = ip.split(',')[0].trim();

    if (!adminDb) {
         // If DB is broken, we default to "allowed" (false) or "blocked" (true)?
         // For UX, probably mostly allow, but if we want to be strict...
         // Let's assume allowed if DB fails to avoid blocking legitimate users during outages, 
         // unless the error is critical.
         // Actually, if we can't check, we should probably be careful. 
         // But here, returning "limit reached" on error might be annoying.
         // Let's return error that client handles.
         return NextResponse.json({ error: 'DB not connected' }, { status: 500 });
    }

    const snapshot = await adminDb.collection('guest_uploads')
      .where('ipAddress', '==', clientIp)
      .get();

    // If there is at least one document, the limit is reached (assuming limit is 1)
    const limitReached = !snapshot.empty;
    const count = snapshot.size;

    return NextResponse.json({ 
        limitReached, 
        count,
        ip: clientIp // Debug info (optional) 
    });

  } catch (error) {
    console.error('Error checking guest limit:', error);
    return NextResponse.json({ error: 'Failed to check limit' }, { status: 500 });
  }
}
