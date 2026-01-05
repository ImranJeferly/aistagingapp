import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { path, date } = await request.json();

    if (!path || !date) {
      return NextResponse.json({ error: 'Missing path or date' }, { status: 400 });
    }

    // Clean path for use as document ID segment
    const cleanPath = path === '/' ? 'home' : path.replace(/\//g, '_');
    const docId = `${date}_${cleanPath}`;

    const statsRef = adminDb.collection('page_stats').doc(docId);

    await statsRef.set({
      date,
      path,
      views: FieldValue.increment(1),
      lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
