import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { email, returnToken } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    // Check if user exists
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (error) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store in Firestore
    await adminDb.collection('passwordResets').doc(token).set({
      email,
      userId: userRecord.uid,
      expiresAt,
      used: false
    });

    // If requested to return token (for logged-in users), skip email
    if (returnToken) {
      return NextResponse.json({ success: true, token });
    }

    // Generate Link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    // Send email
    await sendPasswordResetEmail(email, resetLink, userRecord.displayName || '');

    return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Error sending password reset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
