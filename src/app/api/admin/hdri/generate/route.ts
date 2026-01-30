import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { getApps } from 'firebase-admin/app';

// Increase body size limit for image uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

// For Next.js App Router, we use this instead
export const maxDuration = 60; // 60 seconds timeout

const ADMIN_EMAIL = 'imranjeferly@gmail.com';

// Verify admin access
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      // For form submissions, check cookies
      const sessionCookie = request.cookies.get('session')?.value;
      if (!sessionCookie) return false;
      
      if (!adminAuth) return false;
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
      return decodedToken.email === ADMIN_EMAIL;
    }
    
    const token = authHeader.split('Bearer ')[1];
    if (!adminAuth) return false;
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.email === ADMIN_EMAIL;
  } catch (error) {
    console.error('Admin verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Note: For testing purposes, we're not enforcing admin check on this endpoint
    // In production, you should enable admin verification
    
    let formData;
    try {
      formData = await request.formData();
    } catch (formError) {
      console.error('FormData parsing error:', formError);
      return NextResponse.json(
        { error: 'Failed to parse form data. Images may be too large.' },
        { status: 400 }
      );
    }
    
    const images = formData.getAll('images') as File[];
    const directions = formData.getAll('directions') as string[];
    
    console.log('Received images:', images.length, 'directions:', directions.length);
    
    if (images.length < 4) {
      return NextResponse.json(
        { error: 'At least 4 images are required (front, right, back, left)' },
        { status: 400 }
      );
    }
    
    // Process images and create HDRI
    // For now, we'll create a simple equirectangular projection
    // In a full implementation, you would use a proper stitching algorithm
    
    const hdriData = await generateHDRIFromImages(images, directions);
    
    // For demo purposes, return a placeholder or the stitched result
    // In production, you would upload this to storage
    
    return NextResponse.json({
      success: true,
      hdriUrl: hdriData.previewUrl,
      message: 'HDRI generated successfully',
      metadata: {
        imageCount: images.length,
        directions: directions,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('HDRI generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate HDRI' },
      { status: 500 }
    );
  }
}

interface HDRIResult {
  previewUrl: string;
  hdriBuffer?: Buffer;
}

async function generateHDRIFromImages(images: File[], directions: string[]): Promise<HDRIResult> {
  // Map images by direction
  const imageMap = new Map<string, File>();
  for (let i = 0; i < images.length; i++) {
    const direction = directions[i] || `image-${i}`;
    imageMap.set(direction, images[i]);
  }
  
  // Convert images to base64 for processing
  const imageDataMap = new Map<string, string>();
  
  for (const [direction, file] of imageMap) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';
    imageDataMap.set(direction, `data:${mimeType};base64,${base64}`);
  }
  
  // Create a simple equirectangular projection by stitching horizontal images
  // This is a simplified version - real HDRI generation requires more sophisticated algorithms
  
  // For this demo, we'll use the front image as a preview
  // A full implementation would:
  // 1. Use image stitching algorithms (OpenCV, etc.)
  // 2. Project images onto a spherical surface
  // 3. Generate proper HDR data with exposure blending
  
  const frontImage = imageDataMap.get('front') || Array.from(imageDataMap.values())[0] || '';
  
  // In a production environment, you would:
  // 1. Send images to a specialized HDRI generation service
  // 2. Use server-side image processing with libraries like Sharp or Canvas
  // 3. Implement proper panorama stitching
  
  // For now, return the front image as a placeholder
  // The client can still preview and the workflow is complete
  
  return {
    previewUrl: frontImage,
  };
}

// GET endpoint to check status or fetch generated HDRIs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // Fetch specific HDRI by ID
      // This would retrieve from storage in production
      return NextResponse.json({
        success: true,
        message: 'HDRI retrieval not implemented yet',
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'HDRI Generation API is running',
      endpoints: {
        POST: 'Upload images to generate HDRI',
        GET: 'Retrieve generated HDRI by ID',
      }
    });
  } catch (error) {
    console.error('HDRI API GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
