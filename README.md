# AI Content Orchestrator - 2026 Marketing Automation Platform

A professional-grade AI Agent platform that automates content marketing for businesses, featuring multi-tenant architecture, AI-powered content generation, and human-in-the-loop review workflows.

## 🚀 Features

- **🤖 AI Content Generation**: Multi-channel content creation (Instagram, LinkedIn, Email)
- **🔐 Multi-Tenant Security**: Isolated data per institution with NextAuth authentication
- **🎨 2026 UI/UX**: Glassmorphism design with dark theme and micro-animations
- **🔄 Automated Workflows**: Observer monitoring RSS/Shopify/CSV sources
- **💰 Revenue Model**: Paystack-powered subscription tiers
- **📱 Responsive Design**: Mobile-first professional interface

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM, MySQL
- **AI**: OpenAI GPT-4, Vercel AI SDK, Zod validation
- **Auth**: NextAuth.js, Google OAuth
- **Payments**: Paystack SDK

## 📋 Prerequisites

- Node.js 18+
- MySQL 8.0+
- OpenAI API Key
- Google OAuth credentials
- Paystack account

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <repository-url>
cd ai-content-marker
npm install
```

### 2. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 3. Environment Configuration
Create `.env` file:
```env
DATABASE_URL="mysql://user:password@localhost:3306/ai_content_marker"
OPENAI_API_KEY="sk-your-openai-api-key"
NEXTAUTH_SECRET="your-random-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
PAYSTACK_SECRET_KEY="sk_test_your-paystack-secret-key"
```

### 4. Development Server
```bash
npm run dev
```

### 5. Observer Worker (separate terminal)
```bash
node src/scripts/observer.ts
```

## 🏗️ Architecture

### Database Schema
- **Institution**: Business entities with subscription tiers
- **User**: Authentication linked to institutions
- **BrandGuide**: Brand voice, audience, and restrictions
- **ContentSource**: RSS, Shopify, CSV input sources
- **AgentTask**: AI processing jobs
- **GeneratedPost**: AI-generated content for review

### AI Workflow
1. **Observer** monitors content sources every 30 minutes
2. **AgentTask** created for new content
3. **AI Engine** generates multi-channel content
4. **Editor Agent** validates against brand guidelines
5. **Human Review** dashboard for approval/editing
6. **Auto-Publish** to social platforms

### API Endpoints
- `POST /api/generate` - Trigger content generation
- `POST /api/publish` - Publish approved content
- `GET /api/posts` - Fetch content for review
- `PATCH /api/posts` - Update post status/feedback
- `POST /api/payments/initialize` - Start subscription payment
- `GET /api/payments/verify` - Confirm payment success

## 🎨 UI Components

### Dashboard Pages
- `/` - Landing with status overview
- `/dashboard` - Content review queue
- `/dashboard/settings` - Institution configuration
- `/auth/signin` - Google OAuth login

### Design System
- **Colors**: Cyber-blue (#00D4FF), Vivid-purple (#B026FF)
- **Effects**: Glassmorphism with backdrop blur
- **Animations**: Framer Motion micro-interactions
- **Typography**: Inter font family

## 💰 Subscription Tiers

| Tier | Price (₦) | Posts/Month | Features |
|------|-----------|-------------|----------|
| Starter | 2,500 | 50 | Basic analytics |
| Pro | 7,500 | 200 | All platforms, advanced analytics |
| Enterprise | 25,000 | Unlimited | Custom integrations, dedicated support |

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

### Manual Deployment
```bash
npm run build
npm start
```

### Database Production
- Use PlanetScale for serverless MySQL
- Or AWS RDS for traditional hosting
- Set `DATABASE_URL` to production connection string

## 🔧 Development

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checking
```

### Database Management
```bash
npx prisma studio    # Database GUI
npx prisma migrate   # Create migrations
npx prisma generate  # Update client
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🎯 Success Metrics

- **AI Brand Understanding**: Human owners feel AI "gets their brand"
- **Content Quality**: <10% edits needed on AI drafts
- **Platform Coverage**: Instagram, LinkedIn, Email automation
- **Revenue Generation**: Subscription-based SaaS model

---

Built for the future of marketing automation in 2026 🚀
