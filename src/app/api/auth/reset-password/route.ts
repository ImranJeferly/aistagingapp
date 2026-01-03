import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Missing token or password' }, { status: 400 });
    }

    // Verify token
    const docRef = adminDb.collection('passwordResets').doc(token);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 });
    }

    const data = docSnap.data();
    
    if (data?.used) {
      return NextResponse.json({ error: 'Link already used' }, { status: 400 });
    }

    if (Date.now() > data?.expiresAt) {
      return NextResponse.json({ error: 'Link expired' }, { status: 400 });
    }

    // Update Password
    await adminAuth.updateUser(data?.userId, {
      password: newPassword
    });

    // Mark token as used
    await docRef.update({ used: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
