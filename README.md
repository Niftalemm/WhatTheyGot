# 🍽️ What they Got? - MNSU Dining Reviews

A mobile-first web application for Minnesota State University, Mankato students to discover, rate, and review dining center food with **AI-powered content moderation** for campus safety.

## 📋 Table of Contents
- [🏗️ Architecture Overview](#️-architecture-overview)
- [🚀 Quick Start (Local Development)](#-quick-start-local-development)
- [🔧 Environment Configuration](#-environment-configuration)
- [💰 Cheap Deployment Options](#-cheap-deployment-options)
- [🤖 AI Assistant Guidelines](#-ai-assistant-guidelines)
- [🔄 Future Improvements](#-future-improvements)
- [🐛 Troubleshooting](#-troubleshooting)

## 🏗️ Architecture Overview

### Core Components
```
Frontend (React + TypeScript + Vite)
├── Mobile-first UI with bottom navigation
├── Admin dashboard with JWT authentication
├── Real-time content moderation interface
└── Shadcn/ui components with dark theme

Backend (Express + TypeScript + Drizzle ORM)
├── RESTful API with secure admin endpoints
├── AI content moderation pipeline (Google Perspective API)
├── Device-based user tracking (privacy-compliant)
├── PostgreSQL database with comprehensive audit logging
└── Automated menu scraping from Sodexo dining services

Content Moderation System
├── Real-time hate speech detection
├── Graduated response system (approve/shadow/reject+ban)
├── Device fingerprinting without PII storage
├── Admin review queue for questionable content
└── Complete audit trail for compliance
```

### Tech Stack
- **Frontend**: React, TypeScript, Vite, TanStack Query, Wouter, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Drizzle ORM
- **Database**: PostgreSQL (Neon serverless)
- **AI Moderation**: Google Perspective API
- **Authentication**: JWT tokens for admin access
- **Deployment**: Designed for serverless/edge deployment

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (local or cloud)
- Google Perspective API key (optional for development)

### 1. Clone and Install
```bash
git clone <your-repo>
cd what-they-got
npm install
```

### 2. Database Setup
```bash
# Create a PostgreSQL database
# Option A: Local PostgreSQL
createdb dining_app_dev

# Option B: Use Neon (recommended)
# Sign up at https://neon.tech and create a database
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Database (required)
DATABASE_URL="postgresql://username:password@localhost:5432/dining_app_dev"

# Admin Authentication (required for admin panel)
ADMIN_PASSWORD="your_secure_admin_password_here"
JWT_SECRET="your_jwt_secret_key_minimum_32_characters"
SESSION_SECRET="your_session_secret_key"

# Content Moderation (optional for development)
PERSPECTIVE_API_KEY="your_google_perspective_api_key"
DEVICE_HASH_SALT="random_salt_for_device_hashing_security"

# Database Connection Details (auto-populated if using DATABASE_URL)
PGHOST="your_db_host"
PGPORT="5432"
PGUSER="your_db_user"
PGPASSWORD="your_db_password"
PGDATABASE="your_db_name"
```

### 4. Database Migration
```bash
# Push schema to database
npm run db:push

# If you get conflicts, force push (safe with this setup)
npm run db:push -- --force
```

### 5. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

### 6. Admin Panel Access
1. Navigate to `http://localhost:5000/admin/login`
2. Use the password from your `ADMIN_PASSWORD` environment variable
3. Access the content moderation panel at `/admin/moderation`

## 🔧 Environment Configuration

### Required Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `ADMIN_PASSWORD` | Admin panel password | ✅ |
| `JWT_SECRET` | JWT signing secret (32+ chars) | ✅ |
| `SESSION_SECRET` | Session signing secret | ✅ |

### Optional Variables (Recommended for Production)

| Variable | Description | Default |
|----------|-------------|---------|
| `PERSPECTIVE_API_KEY` | Google Perspective API key for AI moderation | None (moderation disabled) |
| `DEVICE_HASH_SALT` | Salt for device fingerprint hashing | Required if using AI moderation |

### Getting API Keys

**Google Perspective API:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Perspective Comment Analyzer API
4. Create credentials (API Key)
5. Restrict the key to Perspective API only

## 💰 Cheap Deployment Options

### Option 1: Vercel + Neon (Recommended - $0-5/month)
```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Deploy to Vercel
npm install -g vercel
vercel --prod

# 3. Set environment variables in Vercel dashboard
# 4. Connect to Neon PostgreSQL (free tier)
```

**Cost**: Free tier, ~$5/month for usage

### Option 2: Railway ($5-10/month)
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and deploy
railway login
railway init
railway up

# 3. Add PostgreSQL service
railway add postgresql

# 4. Set environment variables in Railway dashboard
```

**Cost**: $5/month for 512MB RAM + database

### Option 3: Render + Supabase ($0-7/month)
1. Connect GitHub to Render
2. Deploy as web service with build command: `npm run build`
3. Set up PostgreSQL on Supabase (free tier)
4. Configure environment variables

**Cost**: Free tier available, ~$7/month for paid tiers

### Option 4: DigitalOcean App Platform ($5-12/month)
1. Create app from GitHub
2. Add managed PostgreSQL database
3. Configure environment variables
4. Deploy with auto-scaling

**Cost**: $5/month for basic app + $15/month for managed DB

## 🤖 AI Assistant Guidelines

### Key Architecture Patterns to Understand

**1. Content Moderation Pipeline:**
```typescript
// Location: server/routes.ts - POST /api/reviews
User submits review → AI analysis → Automatic action:
- Score <60%: Auto-approve
- Score 60-85%: Shadow ban (admin review)
- Score >85%: Auto-reject + 24h device ban
```

**2. Device-Based User Tracking:**
```typescript
// Location: server/routes.ts - generateDeviceId()
// Privacy-compliant fingerprinting without PII storage
deviceFingerprint = hash(userAgent + acceptLanguage) // NO IP stored
deviceIdHash = SHA256(deviceFingerprint + salt) // Stored in database
```

**3. Database Schema Critical Points:**
```typescript
// reviews.moderationStatus: 'approved' | 'pending' | 'rejected'
// reviews.deviceId: Contains hashed identifier (NOT raw device data)
// bannedDevices.expiresAt: NULL = permanent ban, Date = temporary ban
```

### What to Watch Out For

**🚨 Security Critical:**
- Never store raw IP addresses or personal identifiable information
- Always use `deviceIdHash` for database storage, never raw `deviceId`
- Admin endpoints MUST use `requireAdmin` middleware
- Environment secrets MUST be set: `JWT_SECRET`, `DEVICE_HASH_SALT`

**⚠️ Common Pitfalls:**
- `getReviewsForMenuItem()` MUST filter to approved content only
- Ban checking logic MUST handle `NULL expiresAt` (permanent bans)
- Moderation scores stored as JSON objects, not stringified JSON
- Admin UI expects `menuItem.name` but DB has `itemName` (aliased in queries)

**🔍 Code Patterns to Maintain:**
- Use `apiRequest` with JWT tokens for admin API calls
- Always validate request bodies with Zod schemas
- Database operations use Drizzle ORM with proper typing
- UI components follow Shadcn patterns with proper `data-testid` attributes

### File Structure Guide
```
server/
├── routes.ts          # API endpoints + moderation pipeline
├── storage.ts         # Database operations + safety filters
├── moderation.ts      # AI content analysis + device hashing
├── db.ts             # Database connection
└── scraper.ts        # Menu data collection

client/src/
├── pages/            # Route components
├── components/       # Reusable UI components  
├── lib/             # Utilities + API client
└── hooks/           # Custom React hooks

shared/
└── schema.ts        # Database schema + validation
```

### Testing AI Moderation Locally
```bash
# Without Perspective API (development)
PERSPECTIVE_API_KEY="" npm run dev
# Reviews will auto-approve without AI analysis

# With Perspective API (production-like)
PERSPECTIVE_API_KEY="your_key" npm run dev
# Full AI moderation pipeline active
```

## 🔄 Future Improvements

### High Priority Enhancements

**📱 Mobile Experience:**
- [ ] Progressive Web App (PWA) with offline menu caching
- [ ] Push notifications for dining specials and alerts
- [ ] Camera integration for photo reviews with image moderation
- [ ] Location-based dining center detection

**🛡️ Enhanced Moderation:**
- [ ] Image content moderation for photo reviews
- [ ] Sentiment analysis for review quality scoring
- [ ] Machine learning model training on campus-specific data
- [ ] Automated spam detection beyond toxicity
- [ ] Integration with campus conduct policies

**👥 Social Features:**
- [ ] Anonymous user profiles with streak tracking
- [ ] "Helpful review" voting system
- [ ] Dining buddy matching for meal times
- [ ] Review sharing to social media

### Medium Priority Features

**📊 Analytics & Insights:**
- [ ] Dining center popularity analytics
- [ ] Menu item rating trends over time
- [ ] Peak dining times and crowd predictions
- [ ] Nutritional information integration

**🔧 Admin Improvements:**
- [ ] Bulk moderation actions for efficiency
- [ ] Automated reporting dashboard
- [ ] Integration with campus dining management
- [ ] A/B testing framework for app features

**🚀 Technical Enhancements:**
- [ ] Real-time updates using WebSocket connections
- [ ] Redis caching for improved performance
- [ ] CDN integration for image optimization
- [ ] Comprehensive API rate limiting

### Low Priority Nice-to-Haves

- [ ] Multi-language support for international students
- [ ] Integration with campus meal plan systems
- [ ] Dietary restriction filtering and alerts
- [ ] Gamification with achievement system
- [ ] Voice-to-text review submission
- [ ] Integration with campus events calendar

## 🐛 Troubleshooting

### Common Issues

**❌ "Module not found" errors**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**❌ Database connection failures**
```bash
# Check DATABASE_URL format
DATABASE_URL="postgresql://user:pass@host:port/dbname"

# Test connection
npm run db:push
```

**❌ "PERSPECTIVE_API_KEY required" crashes**
```bash
# For development without AI moderation
unset PERSPECTIVE_API_KEY
# Or set empty string in .env
PERSPECTIVE_API_KEY=""
```

**❌ Admin login "Invalid password" errors**
```bash
# Verify environment variable is set correctly
echo $ADMIN_PASSWORD
# Check JWT_SECRET is 32+ characters
```

**❌ Reviews not showing up**
```bash
# Check moderation status in database
# Only approved reviews show to users
# Check admin panel at /admin/moderation for pending reviews
```

**❌ TypeScript errors in development**
```bash
# Restart TypeScript server
# In VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Performance Optimization

**Database Queries:**
- Add indexes on frequently queried columns (`date`, `moderationStatus`)
- Use connection pooling for high traffic
- Consider read replicas for analytics queries

**API Response Times:**
- Implement Redis caching for menu data
- Use CDN for static assets
- Enable gzip compression

**Frontend Optimization:**
- Implement lazy loading for admin components
- Use React.memo for expensive components
- Add service worker for offline functionality

### Monitoring in Production

**Essential Metrics:**
- API response times (especially Perspective API calls)
- Database connection pool usage
- Review submission success rates
- Admin moderation queue length
- Device ban rates and appeals

**Alerting Triggers:**
- High error rates on review submission
- Perspective API quota exhaustion
- Database connection failures
- Unusual spike in content flagging

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `npm test` 
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 Support

For support and questions:
- Check the [Troubleshooting](#-troubleshooting) section
- Open an issue on GitHub
- Contact campus IT support for deployment assistance

---

**Built with ❤️ for MNSU students by students**