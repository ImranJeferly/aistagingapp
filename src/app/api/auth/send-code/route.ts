import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { email, userId } = await req.json();

    if (!email || !userId) {
      return NextResponse.json({ error: 'Missing email or userId' }, { status: 400 });
    }

    // Rate limiting check
    const docRef = adminDb.collection('verificationCodes').doc(userId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      const lastSentAt = data?.lastSentAt || 0;
      const now = Date.now();
      const timeSinceLastSend = now - lastSentAt;

      // 60 seconds cooldown
      if (timeSinceLastSend < 60000) {
        const remainingSeconds = Math.ceil((60000 - timeSinceLastSend) / 1000);
        return NextResponse.json(
          { error: `Please wait ${remainingSeconds} seconds before requesting a new code` }, 
          { status: 429 }
        );
      }
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    // Store in Firestore (overwrites old code)
    await docRef.set({
      code,
      expiresAt,
      email,
      attempts: 0,
      lastSentAt: now
    });

    // Get user details for name
    let name = '';
    try {
      const userRecord = await adminAuth.getUser(userId);
      name = userRecord.displayName || '';
    } catch (e) {
      console.warn('Could not fetch user details for email personalization', e);
    }

    // Send email
    await sendVerificationEmail(email, code, name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending verification code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
