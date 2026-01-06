import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

// Initialize Google GenAI client (Nano Banana Pro)
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { originalImage, maskedImage, markers, style, roomType, additionalPrompt } = await request.json();

    // --- AUTH & RATE LIMIT CHECK ---
    const authHeader = request.headers.get('Authorization');
    let isGuest = true;
    let userId = null;

    console.log('[API] Auth Header present:', !!authHeader);

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        if (adminAuth) {
           const decodedToken = await adminAuth.verifyIdToken(token);
           userId = decodedToken.uid;
           isGuest = false;
           console.log('[API] User authenticated:', userId);
        } else {
           console.warn('[API] adminAuth is null, cannot verify token');
        }
      } catch (e) {
        console.warn('[API] Invalid auth token, treating as guest:', e);
      }
    } else {
        console.log('[API] No Bearer token found');
    }

    if (isGuest) {
      console.log('[API] Processing as GUEST');
      const forwardedFor = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      const ip = forwardedFor || realIp || '127.0.0.1';
      const clientIp = ip.split(',')[0].trim();

      if (!adminDb) {
         console.error('[API] Critical: adminDb not initialized for Guest request');
         return NextResponse.json(
           { error: 'Service configuration error. Please try again later.' },
           { status: 503 }
         );
      }

      const snapshot = await adminDb.collection('guest_uploads')
        .where('ipAddress', '==', clientIp)
        .get();

      if (!snapshot.empty) {
        return NextResponse.json(
          { error: 'Free limit reached. Please log in to continue creating.' },
          { status: 429 } 
        );
      }
    }
    // ----------------------------

    if (!originalImage || !style || !roomType) {
      return NextResponse.json(
        { error: 'Missing required fields: originalImage, style, or roomType' },
        { status: 400 }
      );
    }

    // Helper to format parts for the new SDK
    const formatImagePart = (base64String: string | null) => {
      if (!base64String) return null;
      const base64Content = base64String.split(',')[1] || base64String;
      return {
        inlineData: {
          data: base64Content,
          mimeType: 'image/jpeg',
        },
      };
    };

    const parts: any[] = [];

    // 1. Prompt Construction
    parts.push({
      text: `You are an expert AI Interior Designer.
      Task: Generate a photo-realistic image of the provided room, STAGED with furniture.
      
      CRITICAL RULES:
      1. PRESERVE the ORIGINAL ARCHITECTURE (walls, floor, ceiling, windows) exactly as shown in the "Original Empty Room" image.
      2. REALISM: The final image must be indistinguishable from a real photograph. Lighting, shadows, and perspective must match the original room perfectly.
      3. CLEANUP: The "Layout Guide" image (Image 2) contains colored markers/lines/dots. These are for YOUR internal positioning logic only. NEVER include these colored markers, dots, or lines in the final output. The final image must be clean, containing only the room and the new furniture.
      4. INTEGRATION: Furniture must sit firmly on the floor. Do not float items. Match the lighting direction of the original room. Do not overlay 2D cutouts; generate 3D forms that fit the scene.
      5. EXACT MATCHING: The output image MUST have the EXACT SAME aspect ratio, camera angle, and field of view as the "Original Empty Room". Do not crop, zoom, or distort the view. The room geometry (corners, windows, floor bounds) must line up perfectly with the original.
      
      Room Type: ${roomType}
      Interior Style: ${style}
      ${additionalPrompt ? `Instructions: ${additionalPrompt}` : ''}`
    });

    parts.push({ text: "IMAGE 1: Original Empty Room (Base Canvas)" });
    parts.push(formatImagePart(originalImage));

    if (maskedImage && markers && markers.length > 0) {
        parts.push({ text: "IMAGE 2: Layout Guide (INTERNAL USE ONLY). Use the colored dots/lines to understand WHERE to place items. DO NOT RENDER THESE COLORED MARKS in the result." });
        parts.push(formatImagePart(maskedImage));

        for (const marker of markers) {
             const mColor = marker.color;
             const mInstr = marker.instruction || "Furniture item";
             
             let markerText = `\n--- POINT ${mColor} ---\nInstruction: "${mInstr}"`;
             parts.push({ text: markerText });
             
             if (marker.refImage) {
                 parts.push({ text: "Use this reference image for style/shape inspiration (do not copy-paste):" });
                 parts.push(formatImagePart(marker.refImage));
             }
        }
    } else {
        parts.push({ text: "Stage the room naturally with appropriate furniture." });
    }

    // Filter nulls
    const validParts = parts.filter(p => p !== null);

    // 2. Call the Model
    // STRICTLY using "Nano Banana Pro" (gemini-3-pro-image-preview) as requested
    const modelName = 'gemini-3-pro-image-preview'; 
    
    const config = {
      responseModalities: ['IMAGE', 'TEXT'], // Requesting Image!
      imageConfig: {
        imageSize: '2K', // Requesting 3K resolution
      },
    };

    console.log(`Calling Nano Banana Pro (${modelName})...`);
    
    const response = await ai.models.generateContent({
      model: modelName, 
      config: config as any,
      contents: [
        {
          role: 'user',
          parts: validParts,
        },
      ],
    });

    // 3. Process Response
    let generatedImageBase64 = null;
    let aiText = "";

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                // Found an image!
                generatedImageBase64 = part.inlineData.data;
            } else if (part.text) {
                aiText += part.text;
            }
        }
    }

    if (!generatedImageBase64) {
        console.warn("No image generated by AI, returning fallback text plan.");
    } else {
        console.log("AI successfully generated an image!");
    }
    
    // If no image, fallback to original to prevent frontend crash, but text will explain
    const finalImage = generatedImageBase64 
        ? `data:image/jpeg;base64,${generatedImageBase64}` 
        : originalImage;

    return NextResponse.json({
      success: true,
      stagedImage: finalImage,
      aiDescription: aiText,
      message: generatedImageBase64 ? "Stage generated successfully!" : "AI analysis complete (No new image generated)",
      style,
      roomType
    });

  } catch (error) {
    console.error('Google GenAI Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process with Google AI' },
      { status: 500 }
    );
  }
}
