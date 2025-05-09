# Deployment Guide

## Prerequisites

- Node.js (recommend LTS v18.17.0 for best compatibility with Convex)
- npm or yarn package manager
- Git for version control
- Accounts with the following services:
  - [Clerk](https://clerk.dev/) for authentication
  - [Convex](https://convex.dev/) for backend services
  - [Together.ai](https://www.together.ai/) for LLM processing
  - [Replicate](https://replicate.com/) for audio transcription

## Environment Setup

### Local Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# Convex
CONVEX_DEPLOYMENT=prod:your-project-id
NEXT_PUBLIC_CONVEX_URL=https://your-project-id.convex.cloud

# API Keys
TOGETHER_API_KEY=your_together_key_here
REPLICATE_API_KEY=your_replicate_key_here
```

### Clerk Setup

1. Create a [Clerk](https://clerk.dev) account
2. Create a new application in the Clerk dashboard
3. Copy the publishable and secret keys to your `.env.local` file
4. In Clerk JWT Templates, create a template named `convex` with:
   - Audience: `convex`
   - Make note of your Clerk Issuer URL (e.g., `https://mighty-chicken-17.clerk.accounts.dev`)

### Convex Setup

1. Create a [Convex](https://convex.dev) account
2. Create a new project in the Convex dashboard
3. Note your development and production deployment IDs
4. Add these environment variables in the Convex dashboard:
   - `CLERK_ISSUER_URL`: Your Clerk issuer URL
   - `TOGETHER_API_KEY`: Your Together.ai API key
   - `REPLICATE_API_KEY`: Your Replicate API key

### AI Service Setup

1. **Together.ai**:
   - Create an account and obtain an API key
   - Add credit to your account if necessary

2. **Replicate**:
   - Create an account and obtain an API key
   - **Critical**: Add billing information to your Replicate account
   - Add credit to your account for usage

## Deployment Steps

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Access the application at `http://localhost:3000`

### Deploying Convex Functions

For Node.js v18 or lower:

```bash
npx convex deploy
```

For Node.js v23+ (to avoid "spawn EINVAL" errors):

```bash
npx -p node@18.17.0 npx convex deploy --yes
```

### Production Deployment

1. Build the application:

```bash
npm run build
```

2. Deploy the application to your preferred hosting provider (Vercel, Netlify, etc.)

3. Set the same environment variables in your hosting provider's dashboard

## Deployment Configuration Options

### Convex Deployment Options

- `--only`: Deploy only specific functions
- `--typecheck=disable`: Skip typecheck (use with caution)
- `--help`: Show all available options

### Environment Variable Configurations

- Development: Use `dev:your-project-id` for `CONVEX_DEPLOYMENT`
- Production: Use `prod:your-project-id` for `CONVEX_DEPLOYMENT`

## Troubleshooting

### Common Deployment Issues

#### "spawn EINVAL" errors with Convex CLI

**Issue**: When deploying Convex functions with Node.js v23+, you may encounter "spawn EINVAL" errors.

**Solution**: Use Node.js v18.17.0 temporarily for deployment:

```bash
npx -p node@18.17.0 npx convex deploy --yes
```

#### Authentication Issues

**Issue**: "NoAuthProvider" errors when accessing protected routes.

**Solution**:
- Verify `CLERK_ISSUER_URL` is set correctly in Convex environment variables
- Ensure your Clerk JWT template has the correct audience setting (`convex`)

#### Transcription Stuck at "Generating Title..."

**Issue**: Recording appears to upload but gets stuck at "Generating Title...".

**Solution**:
- Check Convex logs for errors
- Verify Replicate API key and billing are set up correctly
- Verify Together.ai API key is valid
- Ensure all environment variables are set in both `.env.local` and Convex dashboard

#### Payment Required Error from Replicate

**Issue**: Error message indicating "Billing required" from Replicate.

**Solution**: 
- Add billing information to your Replicate account
- Visit https://replicate.com/account/billing#billing to set up billing
- Wait a few minutes after setting up billing before trying again
