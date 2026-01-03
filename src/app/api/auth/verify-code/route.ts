import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { userId, code } = await req.json();

    if (!userId || !code) {
      return NextResponse.json({ error: 'Missing userId or code' }, { status: 400 });
    }

    const docRef = adminDb.collection('verificationCodes').doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    const data = doc.data();

    if (!data) {
      return NextResponse.json({ error: 'Invalid code data' }, { status: 400 });
    }

    // Check expiration
    if (Date.now() > data.expiresAt) {
      return NextResponse.json({ error: 'Code expired' }, { status: 400 });
    }

    // Check attempts
    if (data.attempts > 5) {
      return NextResponse.json({ error: 'Too many attempts. Please request a new code.' }, { status: 400 });
    }

    // Verify code
    if (data.code !== code) {
      await docRef.update({ attempts: (data.attempts || 0) + 1 });
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    // Mark email as verified in Firebase Auth
    await adminAuth.updateUser(userId, {
      emailVerified: true
    });

    // Clean up code
    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
