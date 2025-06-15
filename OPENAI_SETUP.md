# OpenAI API Setup Guide

This staging app uses OpenAI's APIs to analyze room images and generate professionally staged versions with appropriate furniture.

## API Integration Overview

The app uses a two-step process to create staged room images:

1. **Room Analysis**: GPT-4o Vision API analyzes the uploaded room image to understand architectural features, lighting, colors, and layout
2. **Staged Image Generation**: DALL-E 3 generates a new staged image using the detailed room analysis to ensure consistency with the original space

## Setup Instructions

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-...`)

### 2. Configure Environment Variables

Add your OpenAI API key to your `.env.local` file:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. Required API Access

Make sure your OpenAI account has access to:

- **GPT-4o** (for vision/image analysis)
- **DALL-E 3** (for image generation)

### 4. Billing Setup

- Ensure your OpenAI account has billing configured
- Monitor usage at [OpenAI Usage Dashboard](https://platform.openai.com/usage)

## API Costs (Approximate)

- **GPT-4o Vision**: ~$0.01-0.03 per image analysis
- **DALL-E 3**: ~$0.04 per generated image (1024x1024)
- **Total per staging**: ~$0.05-0.07

## Implementation Details

### GPT-4o Vision Analysis

```typescript
const analysisResponse = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: analysisPrompt },
        {
          type: "image_url",
          image_url: { url: imageData, detail: "high" }
        }
      ]
    }
  ],
  max_tokens: 500
});
```

### DALL-E 3 Image Generation

```typescript
const imageResponse = await openai.images.generate({
  model: "dall-e-3",
  prompt: generationPrompt,
  size: "1024x1024",
  quality: "standard",
  response_format: "b64_json",
  n: 1
});
```

## Error Handling

The API includes comprehensive error handling for:

- Missing API key
- Rate limiting/quota exceeded
- Billing issues
- Content policy violations
- Network/API errors

## Testing

To test the integration:

1. Start your development server: `npm run dev`
2. Upload a room image through the upload page
3. Select style and room type
4. Click "Stage" to process
5. View the generated staged image and recommendations

## Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**
   - Check your `.env.local` file
   - Ensure the key starts with `sk-`
   - Restart your development server

2. **"API quota exceeded"**
   - Check your OpenAI usage dashboard
   - Add billing to your account
   - Wait for rate limits to reset

3. **"Content policy violation"**
   - Try a different image
   - Ensure the image is appropriate
   - Modify the styling prompt

4. **"No staged image generated"**
   - Check your internet connection
   - Verify API key permissions
   - Try again with a simpler prompt

### Support

For OpenAI API issues, visit:
- [OpenAI Documentation](https://platform.openai.com/docs)
- [OpenAI Help Center](https://help.openai.com)
- [OpenAI Community](https://community.openai.com)
