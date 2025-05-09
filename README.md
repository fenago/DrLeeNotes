<a href="https://usenotesgpt.com/">
  <img alt="AgenticNotes – AI-powered voice note taking in seconds." src="/public/images/og-image.png">
  <h1 align="center">AgenticNotes</h1>
</a>

<p align="center">
  Generate action items from your notes in seconds. Powered by Convex, Together.ai, and Whisper.
</p>

<p align="center">
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#documentation"><strong>Documentation</strong></a> ·
  <a href="#future-tasks"><strong>Future Tasks</strong></a>
</p>
<br/>

## Tech Stack

- [Convex](https://convex.dev/) for the database and cloud functions
- Next.js [App Router](https://nextjs.org/docs/app) for the framework
- [Together Inference](https://togetherai.link) for the LLM (Mixtral)
- [Together Embeddings](https://togetherai.link) for the embeddings for search
- [Convex File Storage](https://docs.convex.dev/file-storage) for storing voice notes
- [Convex Vector search](https://docs.convex.dev/vector-search) for vector search
- [Replicate](https://replicate.com/) for Whisper transcriptions
- [Clerk](https://clerk.dev/) for user authentication
- [Tailwind CSS](https://tailwindcss.com/) for styling

## Deploy Your Own: Complete Step-by-Step Guide

### Prerequisites
- Node.js (recommend LTS v18.17.0 for best compatibility with Convex)
- If using newer Node.js versions (e.g., v23+), see the troubleshooting section below

### Step 1: Initial Setup
1. Clone the repository
2. Create a `.env.local` file in the root directory
3. Run `npm install` to install dependencies (based on package.json with Next.js v14.0.4)

### Step 2: Authentication Setup
1. Create a [Clerk](https://clerk.dev) account
2. From the Clerk dashboard, copy these API keys:
   - `CLERK_SECRET_KEY` 
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. Add them to your `.env.local` file:
   ```
   # Auth
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   CLERK_SECRET_KEY=sk_test_your_key_here
   ```
4. In Clerk JWT Templates, create a template named `convex` with:
   - Audience: `convex`
   - Make note of your Clerk Issuer URL (e.g., `https://mighty-chicken-17.clerk.accounts.dev`)

### Step 3: Backend Setup
1. Create a [Convex](https://convex.dev) account
2. Create a new project in Convex
3. Note both your development and production deployment IDs:
   - Development ID format: `dev:project-name-123`
   - Production ID format: `prod:project-name-123`
4. Add to your `.env.local` file:
   ```
   # Convex
   CONVEX_DEPLOYMENT=prod:your-project-id
   NEXT_PUBLIC_CONVEX_URL=https://your-project-id.convex.cloud
   ```
5. **CRITICAL STEP:** In the Convex dashboard, add ALL these environment variables:
   - `CLERK_ISSUER_URL`: Your Clerk issuer URL (from Step 2.4)
   - `TOGETHER_API_KEY`: Your Together API key (from Step 4.2)
   - `REPLICATE_API_KEY`: Your Replicate API key (from Step 4.4)
   
   Without all three of these variables set in the Convex environment, the application will not function properly.

### Step 4: API Keys Setup
1. Create a [Together](https://togetherai.link) account
2. Get your Together API key from [settings](https://api.together.xyz/settings/api-keys)
3. Create a [Replicate](https://replicate.com) account
4. Get your Replicate API key from [account/api-tokens](https://replicate.com/account/api-tokens)
5. Add to your `.env.local` file:
   ```
   TOGETHER_API_KEY=your_together_key_here
   REPLICATE_API_KEY=your_replicate_key_here
   ```
6. Add these same keys to your Convex environment variables in the dashboard

### Step 5: Deploy Convex Functions
**Important**: If using Node.js v23+, you need to temporarily use Node.js v18 for deployment:

```bash
# This command uses Node.js v18.17.0 just for this deployment without affecting your system
npx -p node@18.17.0 npx convex deploy --yes
```

For Node.js v18 or lower:
```bash
npx convex deploy
```

### Step 6: Run the Application
1. Start the frontend:
   ```bash
   npm run dev:frontend
   ```
2. Access your application at `http://localhost:3000`

### Troubleshooting

#### For "spawn EINVAL" errors with Convex CLI:
- This is a known issue with Convex CLI on Windows with newer Node.js versions (v23+)
- **THE KEY SOLUTION:** Always use Node.js v18.17.0 for Convex CLI operations:
  ```bash
  npx -p node@18.17.0 npx convex deploy --yes
  ```
- This approach temporarily uses v18.17.0 for just the deployment without affecting your system Node.js version

#### If authentication issues occur:
- Double-check that `CLERK_ISSUER_URL` is set correctly in Convex environment variables
- Ensure your Clerk JWT template named 'convex' has the correct audience setting
- Make sure all environment variables are correctly set in both `.env.local` and the Convex dashboard

#### If recordings get stuck at 'Generating Title...':
- Verify both `REPLICATE_API_KEY` and `TOGETHER_API_KEY` are correctly set in BOTH:
  1. Your `.env.local` file
  2. The Convex dashboard environment variables
- Make sure Convex functions were properly deployed (see Step 5)
- Check the console for any specific error messages
- Try refreshing the page or making a new recording
- If issues persist, try redeploying the Convex functions:
  ```bash
  npx -p node@18.17.0 npx convex deploy --yes
  ```

## Future tasks:

- [ ] Keep recording for future playback and display it on the page somewhere
- [ ] Animate the purple microphone to be in sync with your voice
- [ ] Store completed action items for the future instead of fully deleting them
- [ ] Make text/images in the landing page smaller to account for multiple screen sizes.
- [ ] Make the search experience a little smoother overall by searching automatically on entering text
- [ ] Be able to have this as a PWA if there's an easy step to do that
- [ ] Prompt engineer the summary a little more to be more useful than what's currently displaying
- [ ] Add a Notion integration to be able to get the transcript + summary + action items on there
- [ ] UI updates to make it look a little nicer based on Youssef's redesign
- [ ] Be able to edit action items after the fact and set a due date for them
- [ ] Account for layout shift on the dashboard page when refreshing – show a loading state on content?
- [ ] Make action items animate out + make checkbox rounded + add a little check icon on hover
- [ ] Migrate to incredibly fast whisper
