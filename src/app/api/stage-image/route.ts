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
    const prompt = `Take the uploaded image of an empty room and add realistic, photo-quality furniture appropriate for its function: ${roomType}. 

                    ⚠️ Do not change or modify the existing architecture, flooring, ceiling, windows, wall color, or lighting in any way. Preserve all original structural and visual elements exactly as they are.

                    Only add carefully selected, well-composed furniture and decor elements that naturally fit the space. Ensure all additions reflect the chosen interior style: ${style}. Use appropriate textures, materials, and color tones that harmonize with the room’s existing lighting and color palette.

                    Maintain consistent perspective, shadows, lighting direction, and scale, so that the furniture appears fully integrated into the scene. Avoid distortions, clutter, or unrealistic placements.

                    Room Type: ${roomType}  
                    Interior Style: ${style}  
                    ${additionalPrompt ? `Additional Guidelines: ${additionalPrompt}` : ''}

                    🎯 Objective: Produce a visually cohesive, professionally staged image that would appeal to real estate buyers or renters. The result should look like a real photo of the same room after expert virtual staging — with all architecture and lighting untouched, and only high-quality furnishings added.`;

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
