import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const rawReviews = [
  { name: "Michael Thompson", text: "AIStagingApp completely changed how I present my listings. Empty rooms finally look inviting, and I’ve noticed more engagement on my properties almost immediately." },
  { name: "Sarah Collins", text: "I was skeptical at first, but the results look incredibly realistic. It saves me so much time compared to traditional staging." },
  { name: "David Martinez", text: "The speed is what impressed me most. Upload a photo and within seconds it’s staged professionally. Perfect for busy agents." },
  { name: "Emily Rogers", text: "This tool helped one of my listings stand out in a very competitive market. Buyers could finally visualize the space." },
  { name: "Jason Miller", text: "AIStagingApp is now part of my regular workflow. It’s affordable, fast, and the quality is consistently solid." },
  { name: "Laura Bennett", text: "I love how clean and modern the staging styles are. It doesn’t feel fake or overdone like some other tools." },
  { name: "Andrew Peterson", text: "We reduced our staging costs significantly after switching to AI staging. Great value for the price." },
  { name: "Natalie Brooks", text: "The interface is simple and intuitive. I didn’t need any tutorials to get started." },
  { name: "Kevin O’Connor", text: "I use this mainly for vacant listings and it works perfectly. My online views have noticeably increased." },
  { name: "Rachel Kim", text: "AIStagingApp helped me present multiple design options to sellers without extra cost. Huge win." },
  { name: "Brian Sullivan", text: "The realism surprised me. Shadows, lighting, furniture scale — everything feels natural." },
  { name: "Jessica Moore", text: "This tool makes my listings look more premium. Buyers stay longer on the photos." },
  { name: "Daniel Foster", text: "I’ve tried other virtual staging platforms, but this one is faster and more consistent." },
  { name: "Amanda Lewis", text: "Great solution for agents who don’t want to deal with physical staging logistics." },
  { name: "Christopher Allen", text: "I staged an entire apartment in minutes. That alone sold me on the product." },
  { name: "Olivia Turner", text: "It’s perfect for MLS photos. Clean, professional, and clearly staged." },
  { name: "Mark Henderson", text: "AIStagingApp helped me close a listing faster by improving the first impression online." },
  { name: "Sophia Nguyen", text: "The pricing makes sense and the free trial was enough to convince me." },
  { name: "Thomas Reed", text: "This tool saves both time and money. I recommend it to other agents in my office." },
  { name: "Isabella Wright", text: "Very easy to use and the results look great even on larger rooms." },
  { name: "Jonathan Price", text: "AI staging has become essential for my business, and this platform delivers exactly what I need." },
  { name: "Melissa Carter", text: "I like how natural the furniture placement feels. Nothing looks awkward or forced." },
  { name: "Robert King", text: "We use this for rental listings as well, and it helps tenants understand the layout better." },
  { name: "Hannah Scott", text: "The turnaround time is amazing. Perfect for last-minute listings." },
  { name: "Steven Parker", text: "This tool helped my listing photos look more professional without hiring a designer." },
  { name: "Nicole Adams", text: "Buyers respond better to staged photos. This has made a real difference for me." },
  { name: "Anthony Rivera", text: "AIStagingApp is a great alternative to expensive traditional staging." },
  { name: "Claire Wilson", text: "Simple upload, fast results, and realistic visuals. Exactly what I was looking for." },
  { name: "Matthew Young", text: "It’s impressive how accurate the staging looks even with tricky room layouts." },
  { name: "Lily Anderson", text: "This platform makes my listings stand out online and saves me hours every week." }
];

export async function GET() {
  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
  }

  try {
    const batch = adminDb.batch();
    
    // We can only commit 500 writes in a batch, we have 30, so one batch is fine.
    
    for (const review of rawReviews) {
       const ref = adminDb.collection('reviews').doc();
       
       // Random rating logic:
       // 70% chance of 5 stars
       // 20% chance of 4 stars
       // 10% chance of 3 stars
       const r = Math.random();
       let rating = 5;
       if (r < 0.10) rating = 3;
       else if (r < 0.30) rating = 4;

       // Random date within last 60 days for variety
       const date = new Date();
       const daysBack = Math.floor(Math.random() * 60);
       date.setDate(date.getDate() - daysBack);

       batch.set(ref, {
         userName: review.name,
         text: review.text,
         rating: rating,
         userId: 'seed_script',
         userAvatar: '', // Will trigger fallback in UI
         status: 'approved', // Auto-approve
         featured: false,
         createdAt: Timestamp.fromDate(date)
       });
    }

    await batch.commit();
    return NextResponse.json({ success: true, count: rawReviews.length, message: "Use this route once then delete it or ignore it." });
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
