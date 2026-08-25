<div align="center">

# ⚡ AI Automation Platform

**Next-Generation Social Media Marketing, AI Content Studio & Multi-Channel Auto-Publishing Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15%2B-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10%2B-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Redis_Queue-CC3534?style=for-the-badge&logo=redis&logoColor=white)](https://bullmq.io/)

<br />

[Features](#-key-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Environment Variables](#-environment-variables) • [Social Integrations](#-meta--social-integrations) • [Security](#-security--encryption)

</div>

---

## 📖 Overview

**AI Automation Platform** is a full-stack SaaS solution built for digital agencies, creators, and growth marketers. It combines multi-modal AI generation (images, captions, hashtags, videos) with social media scheduling, multi-channel direct publishing (Instagram Business/Creator, Facebook Pages, LinkedIn), and real-time analytics sync.

---

## 🚀 Key Features

### 🎨 1. AI Image & Video Studio
- **Multi-Model Inference**: Generate photorealistic images with Hugging Face (Flux.1 Schnell, Stable Diffusion), OpenAI, Replicate, and FAL.
- **Custom Prompts & Styles**: Aspect ratio control (1:1, 16:9, 9:16), artistic presets, AI prompt enhancer, and high-resolution downloads.
- **Content Library**: Manage, favorite, organize, and directly schedule generated media with one click.

### ✍️ 2. AI Copywriting & Hashtags
- **Smart Caption Generator**: Create high-converting copy tailored for Instagram, Facebook, and LinkedIn with tone customization (Professional, Viral, Casual, Urgent).
- **Hashtag Research**: Real-time trending hashtag generation by niche and category.

### 📅 3. Multi-Channel Social Media Scheduler
- **Visual Calendar & Queue**: Interactive month/week/day calendar view and list scheduler.
- **Unified Publishing**: Schedule single posts or broadcast simultaneously to Instagram, Facebook Pages, and LinkedIn.
- **Instant Publishing ("Post Now")**: Direct real-time execution engine for immediate post publishing.
- **Fail-Safe Processing**: Delayed background jobs and auto-retry mechanics powered by Redis and BullMQ.

### 🌐 4. Social Accounts Hub & Direct Token Mode
- **Meta Graph API (OAuth 2.0)**: Official Instagram Professional & Facebook Page authentication.
- **Direct Access Token Connect**: Instant connection mode via Meta Graph API Explorer tokens to bypass Meta business verification barriers.
- **LinkedIn OAuth 2.0**: Official REST API integration for LinkedIn personal and company page publishing.

### 🔐 5. Security & Session Management
- **AES-256-GCM Encryption**: All access tokens and credentials encrypted at rest.
- **HttpOnly Cookies**: Secure, XSS-resistant session management.
- **User Profile Hub**: Interactive profile card showing account status, subscription plan, member history, quick settings, and secure 1-click logout.

---

## 🛠️ Architecture & Tech Stack

```
AI-Automation/
├── ai-automation-app/        # Next.js 15+ Frontend (App Router, Turbopack, Tailwind)
├── ai-automation-backend/    # NestJS REST API Server (TypeScript, Prisma, BullMQ)
├── ai-automation-client/     # Lightweight client assets
├── ai-server/                # AI Gateway & Microservices
├── docker-compose.yml        # PostgreSQL & Redis container orchestration
└── start-all.bat             # 1-Click development runner
```

### Frontend (`ai-automation-app`)
- **Framework**: Next.js 16 (App Router with Turbopack)
- **Styling**: Tailwind CSS v4, Glassmorphic Dark Design System
- **State & Store**: Zustand with persistent storage
- **Animations**: Lucide Icons, Smooth Transitions, Framer Motion
- **Components**: Radix UI / Accessible UI primitives

### Backend (`ai-automation-backend`)
- **Framework**: NestJS (Modular Architecture)
- **ORM & Database**: Prisma ORM with PostgreSQL
- **Background Jobs**: BullMQ with Redis
- **Security**: Passport JWT, AES-256-GCM Token Encryption, CORS & Helmet security headers
- **Compliance Endpoints**: Public Privacy Policy (`/privacy`) and Data Deletion (`/deletion`)

---

## ⚡ Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v20.x or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) (v14+)
- [Redis](https://redis.io/) (v6+) *(optional for local development - fallback direct publisher included)*
- Git

---

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/vishal4848/AI-Automation.git
   cd AI-Automation
   ```

2. **Start Database & Services (Docker)**:
   ```bash
   docker-compose up -d
   ```

3. **Configure Backend Environment**:
   ```bash
   cd ai-automation-backend
   cp .env.example .env
   # Edit .env with your PostgreSQL database URL and API keys
   ```

4. **Install Dependencies & Initialize Database**:
   ```bash
   # In ai-automation-backend
   npm install
   npx prisma generate
   npx prisma db push
   ```

5. **Install Frontend Dependencies**:
   ```bash
   cd ../ai-automation-app
   npm install
   ```

---

### Running the Application

You can launch all services in 1-click on Windows:
```cmd
start-all.bat
```

Or run each service individually:

**Backend Server (Port 3001)**:
```bash
cd ai-automation-backend
npm run start:dev
```

**Frontend App (Port 3000)**:
```bash
cd ai-automation-app
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## ⚙️ Environment Variables

### Backend Configuration (`ai-automation-backend/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | API Server Port | `3001` |
| `DATABASE_URL` | PostgreSQL Connection URI | `postgresql://postgres:postgres@localhost:5432/ai_automation` |
| `REDIS_URL` | Redis URL for BullMQ | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for JWT signing | `your-32-char-secret-key` |
| `TOKEN_ENCRYPTION_KEY` | AES-256 Key for access tokens | `your-32-char-encryption-key` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `HUGGINGFACE_API_TOKEN` | Hugging Face API key | `hf_...` |
| `META_APP_ID` | Meta Developer App ID | `4297720497039401` |
| `META_APP_SECRET` | Meta Developer App Secret | `your-app-secret` |
| `META_REDIRECT_URI` | Instagram OAuth Callback URI | `https://your-domain.com/api/v1/social/instagram/callback` |
| `META_FACEBOOK_REDIRECT_URI` | Facebook OAuth Callback URI | `https://your-domain.com/api/v1/social/facebook/callback` |

---

## 🌐 Meta & Social Integrations

### How to Connect Instagram & Facebook

#### Method A: Direct Token Connect (Instant — 30 Seconds)
1. Open [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Select your App and choose **User Token** (or select your Facebook Page).
3. Add permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
4. Click **Generate Access Token** and copy the token.
5. In the app, go to **Social Accounts** $\rightarrow$ click **`Connect via Token (Instant)`** $\rightarrow$ paste and connect!

#### Method B: Standard OAuth 2.0 Login
1. In Meta Developer Dashboard, add your redirect URIs under **Facebook Login $\rightarrow$ Settings**.
2. Click **Connect Instagram** or **Connect Facebook Page** in the dashboard.

---

## 🔒 Security & Encryption

- **Zero Plaintext Tokens**: Social account tokens and refresh tokens are encrypted using **AES-256-GCM** before database storage.
- **HMAC OAuth Verification**: OAuth state parameters are cryptographically signed with HMAC-SHA256 to prevent CSRF and replay attacks.
- **HttpOnly Cookie Authentication**: Sessions are protected against XSS injection attacks.
- **Official Graph APIs**: Strictly uses official Meta Graph API and LinkedIn REST API endpoints without web scraping.

---

## 📜 License & Author

Developed by **[Vishal Kumar](https://github.com/vishal4848)**.

Distributed under the **MIT License**. See `LICENSE` for more information.
