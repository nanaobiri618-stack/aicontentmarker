# Deploy to Render

## Quick Deploy

### Option 1: Using Render Blueprint (Recommended)

1. Push your code to GitHub:
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

2. Go to [Render Dashboard](https://dashboard.render.com/)

3. Click **"New"** → **"Blueprint"**

4. Connect your GitHub repository

5. Render will automatically detect `render.yaml` and create:
   - Web Service (Next.js app)
   - PostgreSQL database

6. Click **"Apply"**

### Option 2: Manual Setup

1. **Create Web Service:**
   - Go to Render Dashboard → New → Web Service
   - Connect your GitHub repo
   - Name: `ai-content-marker`
   - Runtime: `Node`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`

2. **Create PostgreSQL Database:**
   - New → PostgreSQL
   - Name: `ai-content-marker-db`
   - Plan: Free

3. **Add Environment Variables:**
   ```
   DATABASE_URL=<from your PostgreSQL database>
   NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
   NEXTAUTH_URL=https://your-service-name.onrender.com
   OPENAI_API_KEY=sk-...
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   PAYSTACK_SECRET_KEY=sk_test_...
   ```

## After Deployment

### Run Database Migrations

Once deployed, open Render Shell for your web service and run:
```bash
npx prisma migrate deploy
```

Or add this to your build command:
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

### Verify Deployment

1. Visit your app URL (e.g., `https://ai-content-marker.onrender.com`)
2. Check the health endpoint: `/api/health`
3. Sign up and test the authentication flow

## Troubleshooting

### Build Fails
- Check that `DATABASE_URL` is set correctly
- Ensure `NEXTAUTH_SECRET` is at least 32 characters
- Verify all API keys are valid

### Database Connection Issues
- Make sure PostgreSQL database is in the same region as web service
- Check that `DATABASE_URL` format is correct
- Run `npx prisma db push` manually in Render Shell

### Static Files Not Loading
- Ensure `output: 'standalone'` is set in `next.config.js`
- Check that images use `unoptimized: true` for external hosting

## Production Checklist

- [ ] All environment variables configured in Render Dashboard
- [ ] Database migrations run successfully
- [ ] Google OAuth callback URL updated to production domain
- [ ] Paystack webhook URL configured (if using payments)
- [ ] Custom domain added (optional)
- [ ] SSL certificate active (automatic on Render)
