# AI Home Staging App

A modern web application that uses AI to stage home photos for real estate listings.

## Features

- **AI-Powered Staging**: Transform empty rooms into beautifully staged spaces
- **Multiple Styles**: Modern, Traditional, Scandinavian, and more
- **Subscription Plans**: Free, Basic ($15/mo), and Pro ($30/mo)
- **User Authentication**: Google Sign-in and email/password
- **Upload Limits**: Daily/monthly limits based on subscription tier
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Payments**: Stripe with Payment Links
- **AI**: OpenAI DALL-E API
- **Hosting**: Vercel (or similar)

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project
- Stripe account
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (copy `.env.example` to `.env.local`):
   ```bash
   cp .env.example .env.local
   ```

4. Configure your environment variables in `.env.local`

5. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to your hosting platform (Vercel recommended)

3. Set up Stripe webhooks pointing to your production URL

## Environment Variables

See `.env.example` for all required environment variables.

## License

Private project - All rights reserved.
