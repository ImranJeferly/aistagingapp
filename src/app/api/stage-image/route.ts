import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageData, style, roomType, additionalPrompt } = await request.json();

    if (!imageData || !style || !roomType) {
      return NextResponse.json(
        { error: 'Missing required fields: imageData, style, or roomType' },
        { status: 400 }
      );
    }

    // Create a detailed prompt for home staging with image generation
    const prompt = `Take the uploaded image of an empty room and add realistic furniture appropriate for the room's function (${roomType}). Do not change or alter the existing architecture, floor, ceiling, windows, walls, or lighting. Only add furniture in a natural, well-composed way. 
                    Make sure the furniture matches the ${style} style and fits naturally into the scene. Keep shadows, perspective, and lighting consistent with the original image.
                    Room Type: ${roomType}
                    Style: ${style}
                    ${additionalPrompt ? `Additional Requirements: ${additionalPrompt}` : ''}
                    Focus on creating a cohesive, professionally staged space that would appeal to potential buyers or renters while maintaining the original room's architectural integrity.
                    Generate a new image showing this room with appropriate furniture added.`;

    // Use the new Responses API with GPT Image 1 for both analysis and generation
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt
            },
            {
              type: "input_image",
              image_url: imageData,
              detail: "high"
            }
          ]
        }
      ],
      tools: [{ type: "image_generation" }]
    });    // Extract the generated image from the response
    const imageOutput = response.output
      .filter((output) => output.type === "image_generation_call")
      .map((output) => output.result);

    if (imageOutput.length === 0) {
      throw new Error('No staged image generated');
    }

    const stagedImageBase64 = imageOutput[0];
    
    return NextResponse.json({
      success: true,
      stagedImage: `data:image/png;base64,${stagedImageBase64}`, // Properly formatted data URL
      style,
      roomType,
      additionalPrompt
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        );
      }
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded' },
          { status: 429 }
        );
      }
      if (error.message.includes('model')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process image with AI' },
      { status: 500 }
    );
  }
}
