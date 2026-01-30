import { NextRequest, NextResponse } from 'next/server';

// For Next.js App Router
export const maxDuration = 60; // 60 seconds timeout

export async function POST(request: NextRequest) {
  try {
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
        { error: 'At least 4 images are required' },
        { status: 400 }
      );
    }
    
    // Parse directions and pair with images
    const imageData: Array<{
      base64: string;
      azimuth: number;
      elevation: number;
    }> = [];
    
    for (let i = 0; i < images.length; i++) {
      const direction = directions[i] || '';
      // Parse direction format: "az0_el0" or "az45_el45"
      const azMatch = direction.match(/az(-?\d+)/);
      const elMatch = direction.match(/el(-?\d+)/);
      
      const azimuth = azMatch ? parseInt(azMatch[1]) : (i * (360 / images.length));
      const elevation = elMatch ? parseInt(elMatch[1]) : 0;
      
      const buffer = Buffer.from(await images[i].arrayBuffer());
      const base64 = `data:${images[i].type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
      
      imageData.push({ base64, azimuth, elevation });
    }
    
    console.log('Parsed image data:', imageData.map(d => `az:${d.azimuth} el:${d.elevation}`));
    
    // Return the image data for client-side stitching
    // Client will do the actual canvas manipulation since node-canvas 
    // has native dependencies that don't work well in serverless
    return NextResponse.json({
      success: true,
      message: 'Images processed successfully',
      stitchOnClient: true,
      imageData: imageData,
      config: {
        outWidth: 4096,
        outHeight: 2048,
        hFov: 65,
        vFov: 90,
      },
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

// GET endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'HDRI Generation API is running',
    endpoints: {
      POST: 'Upload images to generate HDRI',
    }
  });
}
