import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
     const { recordId, feedback, complaint } = await request.json();
     
     if (!recordId || !feedback) {
         return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
     }

     if (!adminDb) {
         return NextResponse.json({ error: 'Server DB error' }, { status: 500 });
     }

     // Update the guest upload record
     const recordRef = adminDb.collection('guest_uploads').doc(recordId);
     
     // Verify existence first? Or just update
     await recordRef.update({
        feedback: feedback,
        feedbackComment: complaint || null,
        feedbackSubmittedAt: Timestamp.now()
     });

     return NextResponse.json({ success: true });

  } catch (error) {
     console.error('[Guest Feedback] Error:', error);
     return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
