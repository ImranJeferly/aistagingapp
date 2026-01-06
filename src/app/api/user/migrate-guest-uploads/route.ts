import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    let userId = null;
    
    if (adminAuth) {
        try {
            const decoded = await adminAuth.verifyIdToken(token);
            userId = decoded.uid;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
    } else {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    const { sessionId } = await request.json();
    if (!sessionId) {
        return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    if (!adminDb) {
        return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }
    const db = adminDb;

    // Find custom guest uploads by session
    const snapshot = await db.collection('guest_uploads')
        .where('sessionId', '==', sessionId)
        .where('claimed', '==', false)
        .get();

    if (snapshot.empty) {
        return NextResponse.json({ message: 'No uploads to migrate' });
    }

    const batch = db.batch();
    const userRef = db.collection('users').doc(userId);
    // Maybe update user usage stats? Skipping for now to keep it simple.

    let movedCount = 0;

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Create new record in 'uploads' collection (schema from uploadService)
        // Note: The structure in uploadService implies a global collection or per-user subcollection?
        // Let's check: in uploadService it uses "addCompletedUploadRecord" which likely adds to 'uploads' collection.
        // Let's assume 'uploads' is a root collection with userId field.
        
        const newDocRef = db.collection('uploads').doc(); // Auto ID
        batch.set(newDocRef, {
            userId: userId,
            uploadedAt: data.uploadedAt || Timestamp.now(), // Preserve time
            imageSize: 0, // Metadata missing in guest upload, optional
            imageName: 'Guest Upload',
            style: data.style,
            roomType: data.roomType,
            originalImageUrl: data.originalImageUrl,
            stagedImageUrl: data.stagedImageUrl,
            status: 'completed',
            isGuestMigration: true
        });
        
        // Mark guest upload as claimed
        batch.update(doc.ref, { claimed: true, claimedBy: userId });
        movedCount++;
    });

    await batch.commit();

    return NextResponse.json({ success: true, count: movedCount });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
