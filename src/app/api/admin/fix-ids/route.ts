import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
  }

  try {
    const uploadsSnapshot = await adminDb.collectionGroup('uploads').get();
    const batch = adminDb.batch();
    let count = 0;
    let updated = 0;

    uploadsSnapshot.forEach(doc => {
      count++;
      const data = doc.data();
      if (!data.id) {
          batch.update(doc.ref, { id: doc.id });
          updated++;
      }
    });

    if (updated > 0) {
        await batch.commit();
    }

    return NextResponse.json({ 
        success: true, 
        totalScanned: count, 
        updatedDocs: updated,
        message: "Backfill complete. All upload documents now have an 'id' field." 
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
