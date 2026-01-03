import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendAbuseDetectionEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get IP address
    let ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || (req as any).ip;
    
    if (!ip || ip === '::1') {
      // Fallback for local development
      ip = '127.0.0.1';
    }
    
    // If x-forwarded-for contains multiple IPs, take the first one
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }

    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // Update current user's IP
    await userRef.set({
      ipAddress: ip,
      lastLoginAt: FieldValue.serverTimestamp()
    }, { merge: true });

    // Check for abuse
    // Query all users with this IP
    const usersWithIpSnapshot = await adminDb.collection('users')
      .where('ipAddress', '==', ip)
      .get();

    const usersWithIp = usersWithIpSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{ id: string; tier?: string; [key: string]: any }>;

    // If more than 2 accounts share this IP
    if (usersWithIp.length > 2) {
      const batch = adminDb.batch();
      let restrictedCount = 0;
      const usersToNotify: Array<{ email: string; name: string }> = [];

      usersWithIp.forEach(user => {
        // Only restrict free tier users
        // Assuming 'tier' field exists, or default to free if missing
        // Also check if they are already restricted to avoid unnecessary writes
        const isPaid = user.tier === 'basic' || user.tier === 'pro'; // Adjust based on your tier names
        
        if (!isPaid) {
          const ref = adminDb!.collection('users').doc(user.id);
          
          // Only notify if this is the first time they are being restricted
          if (!user.ipRestricted && user.email) {
            usersToNotify.push({
              email: user.email,
              name: user.displayName || user.firstName || 'User'
            });
          }

          batch.update(ref, { ipRestricted: true });
          restrictedCount++;
        }
      });

      if (restrictedCount > 0) {
        await batch.commit();
        
        // Send emails asynchronously
        Promise.allSettled(
          usersToNotify.map(u => sendAbuseDetectionEmail(u.email, u.name))
        ).catch(err => console.error('Error sending abuse emails:', err));
      }
      
      return NextResponse.json({ 
        success: true, 
        restricted: true,
        message: 'Multiple accounts detected from this IP. Free tier usage restricted.' 
      });
    } else {
      // If we are back within limits (unlikely unless accounts are deleted), 
      // or if it's a new safe login, we could potentially un-restrict, 
      // but usually abuse flags stick. 
      // For now, let's just return success.
      return NextResponse.json({ success: true, restricted: false });
    }

  } catch (error) {
    console.error('Error tracking IP:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
