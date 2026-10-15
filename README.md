<div align="center">

# ⚡ AI Automation Platform

**Next-Generation AI Content Studio, Unified Model Explorer & Multi-Channel Auto-Publishing SaaS**

[![Next.js](https://img.shields.io/badge/Next.js-15%2B-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10%2B-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Replicate](https://img.shields.io/badge/Replicate-AI_Cloud-000000?style=for-the-badge&logo=replicate&logoColor=white)](https://replicate.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Redis_Queue-CC3534?style=for-the-badge&logo=redis&logoColor=white)](https://bullmq.io/)

<br />

[Features](#-key-features) • [AI Model Explorer](#-unified-ai-model-catalog) • [Architecture](#-architecture--tech-stack) • [How to Run (All Commands)](#-how-to-run-step-by-step) • [Environment Variables](#-environment-variables) • [Social Integrations](#-meta--social-integrations) • [Security](#-security--encryption)

</div>

---

## 📖 Overview

**AI Automation Platform** is an enterprise-ready, full-stack AI content studio and social media management SaaS. It empowers digital agencies, creators, and marketing teams to generate commercial-grade visual and video assets, write viral captions, explore cutting-edge AI models, and automatically schedule & publish content across **Instagram Business/Creator, Facebook Pages, and LinkedIn** with real-time analytics.

### 🌟 What's New
- **Unified AI Model Explorer (`/ai-models`)**: Discover, search, filter, and inspect AI models by provider, capability, and pricing tier. Clean model cards highlight model function, how it works, and target use cases.
- **ChatGPT & Google Gemini via Replicate**: Generate images using **ChatGPT (`openai/dall-e-3`)** and **Google Gemini (`google/imagen-3` & `google/imagen-3-fast`)** powered strictly through your unified Replicate API token—no separate OpenAI or Google AI Studio keys required!
- **Image Editing Suite**: Instruction-based image editing (InstructPix2Pix), 4K AI upscaling (Real-ESRGAN), and automatic background removal (Rembg).
- **Cinematic AI Video Studio**: High-motion video generation with Kling v1.6 Standard, Alibaba Wan 2.1, and MiniMax Video-01.

---

## 🚀 Key Features

### 🔍 1. Unified AI Model Explorer (`/ai-models`)
- **Central Model Discovery**: Browse curated foundation models across Image Generation, Video Generation, Image Editing, Text & Prompts, and Multimodal Understanding.
- **Detailed Card Metadata**: Each model card presents:
  - **Provider & Pricing Badges**: Replicate, OpenAI, Google Gemini, Fal.ai, Hugging Face.
  - **Description**: What the model is and its core architecture.
  - **Working**: Technical mechanics behind the model's inference.
  - **Used For**: Recommended production use cases and creative scenarios.
- **Smart Filtering**: Instant search by keywords, providers (including Replicate-hosted ChatGPT and Gemini), pricing tiers (Free, Usage-Based, Pro), and capability tags.
- **1-Click Launch**: Transfer any model directly into the Image or Video Studio with prepopulated settings.

### 🎨 2. AI Image Studio (`/ai-image`)
- **Replicate-Powered ChatGPT Image Generation**:
  - Model: `openai/dall-e-3` (ChatGPT Image)
  - Nuanced prompt comprehension, vivid/natural art styles, and clean aspect ratio adaptation (`1:1`, `16:9`, `9:16`).
- **Replicate-Powered Google Gemini Image Generation**:
  - Models: `google/imagen-3` & `google/imagen-3-fast`
  - Industry-leading photorealism, authentic physical lighting, zero artifacting, and sharp legible text/typography spelling.
- **FLUX & Diffusion Foundation Models**:
  - `black-forest-labs/flux-1.1-pro`: State-of-the-art 2K commercial photorealism.
  - `black-forest-labs/flux-schnell`: Ultra-fast (1–3s) distilled diffusion for rapid ideation.
  - `black-forest-labs/flux-dev`: Guidance-distilled artistic illustration engine.
  - `stability-ai/sdxl`: Classic dual OpenCLIP architecture with full negative prompt support.
- **Advanced Creative Tools**: Voice prompt dictation, image paste/upload reference guidance, aspect ratio switching (`1:1`, `16:9`, `9:16`, `4:3`), art style presets, Cloudinary cloud storage, and 1-click scheduling.

### 🎥 3. AI Video Studio (`/ai-video`)
- **Kling v1.6 Standard (`kwaivgi/kling-v1.6-standard`)**: Full HD 1080p cinematic video generation with dynamic camera panning and physical simulation.
- **Wan 2.1 (`wan-video/wan-2.1-t2v-480p`)**: Alibaba 14B flow-matching diffusion transformer for social reels and b-roll loops.
- **MiniMax Video-01 (`minimax/video-01`)**: High-dynamics character action and atmospheric physics.
- **Async Queue & Polling Engine**: Non-blocking background job polling with immediate processing feedback.

### ✍️ 4. AI Copywriting & Hashtags (`/ai-caption`, `/hashtag`)
- **Smart Caption Generator**: Create viral multi-platform copy tailored for Instagram, Facebook, and LinkedIn with tone customization (Professional, Viral, Casual, Urgent).
- **Multimodal Prompt Expander**: Uses Replicate-hosted `openai/gpt-4o-mini` to expand raw concepts into detailed generative prompts.
- **Hashtag Clustering**: Real-time trending hashtag generation by niche and platform.

### 📅 5. Multi-Channel Social Media Scheduler (`/scheduler`)
- **Interactive Calendar**: Visual month, week, day views and list scheduler.
- **Unified Broadcasting**: Schedule single posts or broadcast simultaneously to Instagram, Facebook Pages, and LinkedIn.
- **Instant Publishing ("Post Now")**: Direct real-time execution engine for immediate post publishing.
- **Fail-Safe Job Queue**: Delayed background jobs and auto-retry mechanics powered by Redis and BullMQ.

### 🌐 6. Social Accounts Hub & Direct Token Connect (`/social-accounts`)
- **Meta Graph API (OAuth 2.0)**: Official Instagram Professional & Facebook Page authentication.
- **Direct Access Token Connect**: Instant connection mode via Meta Graph API Explorer tokens to bypass Meta business verification barriers.
- **LinkedIn OAuth 2.0**: Official REST API integration for personal profiles and company page publishing.

### 🔐 7. Security & Session Management
- **AES-256-GCM Encryption**: All access tokens and credentials encrypted at rest.
- **Zero Plaintext Secrets**: API keys and tokens are never leaked or exposed to client browsers.
- **HttpOnly Cookies**: Secure, XSS-resistant session management.

---

## 🤖 Unified AI Model Catalog

All models below are accessible directly through the platform:

| Model Name | Provider | Category | Pricing | Description & Highlights |
| :--- | :--- | :--- | :--- | :--- |
| **ChatGPT Image (DALL-E 3)** | `replicate` | Image | Usage-Based (10 cr) | OpenAI's ChatGPT image engine via Replicate; rich conversational prompt adherence. |
| **Google Gemini Imagen 3** | `replicate` | Image | Usage-Based (8 cr) | Google DeepMind flagship image model via Replicate; industry photorealism & text rendering. |
| **Google Gemini Imagen 3 Fast** | `replicate` | Image | Usage-Based (4 cr) | High-speed distilled variant of Google Imagen 3 on Replicate; 2–4s inference. |
| **FLUX 1.1 Pro** | `replicate` | Image | Usage-Based (8 cr) | Black Forest Labs commercial flagship; 2K resolution, studio lighting, fine textures. |
| **FLUX.1 [schnell]** | `replicate` | Image | Usage-Based (5 cr) | 4-step distilled diffusion model; 1–3 second turnarounds for rapid social drafts. |
| **FLUX.1 [dev]** | `replicate` | Image | Usage-Based (6 cr) | Guidance-distilled 12B model for artistic nuance and reference image guidance. |
| **SDXL 1.0** | `replicate` | Image | Usage-Based (5 cr) | Stability AI foundation model with dual text encoders and full negative prompting. |
| **InstructPix2Pix** | `replicate` | Editing | Usage-Based (5 cr) | Natural language image editing; edit existing photos using text instructions. |
| **Real-ESRGAN Upscaler** | `replicate` | Editing | Usage-Based (4 cr) | 4x AI resolution enhancement and GFPGAN facial restoration. |
| **Rembg** | `replicate` | Editing | Usage-Based (3 cr) | Automated salient object background removal with transparent PNG output. |
| **Kling v1.6 Standard** | `replicate` | Video | Usage-Based (30 cr) | 1080p full HD cinematic motion video, camera dynamics, physical kinetics. |
| **Wan 2.1 T2V** | `replicate` | Video | Usage-Based (20 cr) | Alibaba 14B diffusion transformer for seamless social reels and clips. |
| **MiniMax Video-01** | `replicate` | Video | Usage-Based (25 cr) | Hailuo AI high-dynamics video model for character motion and cinematic b-roll. |
| **ChatGPT GPT-4o** | `replicate` | Text | Usage-Based (5 cr) | Multimodal intelligence for campaign strategy, vision inspection, and copywriting. |
| **ChatGPT GPT-4o mini** | `replicate` | Text | Usage-Based (2 cr) | Sub-second prompt rewriting, caption clustering, and hashtag generation. |
| **Gemini 1.5 Flash** | `gemini` | Text | Free Tier (0 cr) | Google AI Studio 1M token context window model for instant prompt expansion. |
| **Gemini 1.5 Pro** | `gemini` | Text | Usage-Based (4 cr) | Google AI Studio 2M token context window model for deep strategic briefs. |

---

## 🛠️ Architecture & Tech Stack

```
AI-Automation/
├── ai-automation-app/        # Next.js 15+ Frontend (App Router, Tailwind CSS, Zustand)
│   ├── src/app/
│   │   ├── (auth)/           # Login, Register, OTP Verification pages
│   │   ├── (dashboard)/
│   │   │   ├── ai-models/    # Unified AI Model Explorer
│   │   │   ├── ai-image/     # AI Image Generation & Editing Studio
│   │   │   ├── ai-video/     # AI Video Studio
│   │   │   ├── ai-caption/   # AI Copywriting & Social Captions
│   │   │   ├── hashtag/      # Hashtag Generator
│   │   │   ├── scheduler/    # Social Calendar & Unified Queue
│   │   │   ├── social-accounts/ # Meta & LinkedIn Connection Hub
│   │   │   ├── content-library/ # Generated Media Asset Library
│   │   │   ├── analytics/    # Performance & Usage Analytics
│   │   │   └── settings/     # User Profile & API Token Settings
│   │   └── api/              # Internal Next.js API Proxy routes
├── ai-automation-backend/    # NestJS Modular REST API Server (TypeScript, Prisma)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── ai/           # Replicate Provider & Model Configuration
│   │   │   ├── ai-gateway/   # Unified AI Gateway & Smart Provider Router
│   │   │   ├── models/       # Central AI Model Registry & Validation
│   │   │   ├── images/       # Image Generation Service & Storage
│   │   │   ├── videos/       # Video Generation Service & Polling
│   │   │   ├── scheduler/    # BullMQ Job Queue & Social Publishers
│   │   │   ├── social/       # Meta Graph API & LinkedIn OAuth Handlers
│   │   │   └── auth/         # JWT Authentication & OTP Security
│   │   └── database/         # Prisma Schema & PostgreSQL Client
├── docker-compose.yml        # PostgreSQL & Redis container orchestration
└── start-all.bat             # 1-Click Windows Development Runner
```

---

## 💻 How to Run (Step-by-Step)

Follow these instructions to run the entire platform locally.

### 📋 Prerequisites
1. **[Node.js](https://nodejs.org/)**: v20.x or higher installed (`node -v` to check)
2. **[Git](https://git-scm.com/)**: Installed
3. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** *(Recommended for PostgreSQL & Redis)* OR a local PostgreSQL server.
4. **[Replicate API Token](https://replicate.com/account/api-tokens)**: A single API token unlocks all image, video, and editing models.

---

### Method A: 1-Click Launch (Windows)

If you have Docker or PostgreSQL running:
```cmd
start-all.bat
```
This batch script automatically launches the NestJS backend on port `3001` and the Next.js frontend on port `3000` in separate terminal windows.

---

### Method B: Manual Setup (Step-by-Step)

#### Step 1: Clone the Repository
```bash
git clone https://github.com/vishal4848/AI-Automation.git
cd AI-Automation
```

#### Step 2: Start Database & Redis (Docker)
Run the bundled `docker-compose.yml` to start PostgreSQL and Redis:
```bash
docker-compose up -d
```
*(Verify containers are running with `docker ps`)*.

---

#### Step 3: Configure & Start the Backend

1. **Navigate to backend directory**:
   ```bash
   cd ai-automation-backend
   ```

2. **Create `.env` file**:
   ```bash
   cp .env.example .env
   ```

3. **Configure required keys in `.env`**:
   Open `.env` in your editor and ensure the following keys are set:
   ```env
   PORT=3001
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_automation"
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-32-character-jwt-secret-key-1234
   TOKEN_ENCRYPTION_KEY=your-32-character-encryption-key-12
   FRONTEND_URL=http://localhost:3000

   # Replicate Token (Powers FLUX, SDXL, ChatGPT DALL-E 3, Google Gemini Imagen 3, Kling, Wan, MiniMax)
   REPLICATE_API_TOKEN=r8_your_replicate_token_here
   ```

4. **Install backend dependencies**:
   ```bash
   npm install
   ```

5. **Generate Prisma Client & Push Database Schema**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Start Backend in Development Mode**:
   ```bash
   npm run start:dev
   ```
   *The backend will start on **`http://localhost:3001`**. Swagger documentation will be available at **`http://localhost:3001/api/docs`**.*

---

#### Step 4: Configure & Start the Frontend

1. **Open a new terminal and navigate to frontend directory**:
   ```bash
   cd ai-automation-app
   ```

2. **Create `.env.local` file**:
   ```bash
   # On Windows (PowerShell):
   New-Item .env.local -ItemType File
   # Or on macOS/Linux:
   touch .env.local
   ```
   Add the backend URL to `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Install frontend dependencies**:
   ```bash
   npm install
   ```

4. **Start Frontend in Development Mode**:
   ```bash
   npm run dev
   ```
   *The frontend will start on **`http://localhost:3000`**.*

---

#### Step 5: Access the Platform

Open your browser and navigate to:
- **Web App**: **[http://localhost:3000](http://localhost:3000)**
- **AI Model Explorer**: **[http://localhost:3000/ai-models](http://localhost:3000/ai-models)**
- **AI Image Studio**: **[http://localhost:3000/ai-image](http://localhost:3000/ai-image)**
- **AI Video Studio**: **[http://localhost:3000/ai-video](http://localhost:3000/ai-video)**
- **Backend API Docs (Swagger)**: **[http://localhost:3001/api/docs](http://localhost:3001/api/docs)**

---

### 🧪 Running Tests

To run the automated Jest test suite for the Replicate provider, models registry, and credit deduction:
```bash
cd ai-automation-backend
npx jest src/modules/ai/providers/replicate.provider.spec.ts --forceExit
```

---

### 🏗️ Production Build Commands

If you wish to create optimized production bundles:

**Build Backend**:
```bash
cd ai-automation-backend
npm run build
npm run start:prod
```

**Build Frontend**:
```bash
cd ai-automation-app
npm run build
npm run start
```

---

## ⚙️ Environment Variables

### Backend Configuration (`ai-automation-backend/.env`)

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `PORT` | Yes | NestJS API Server Port | `3001` |
| `DATABASE_URL` | Yes | PostgreSQL connection URI | `postgresql://postgres:postgres@localhost:5432/ai_automation` |
| `REDIS_URL` | Yes | Redis URL for BullMQ queue processing | `redis://localhost:6379` |
| `JWT_SECRET` | Yes | Secret key for signing authentication JWTs | `your-32-character-secret-key-1234` |
| `TOKEN_ENCRYPTION_KEY` | Yes | 32-character AES-256-GCM encryption key | `your-32-character-encryption-key-12` |
| `FRONTEND_URL` | Yes | Frontend URL for CORS authorization | `http://localhost:3000` |
| `REPLICATE_API_TOKEN` | **Yes** | **Replicate token for FLUX, ChatGPT, Gemini, Kling, etc.** | `r8_...` |
| `CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary cloud name for media hosting | `my-cloud` |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary API Key | `1234567890` |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary API Secret | `sec_...` |
| `META_APP_ID` | Optional | Meta Developer App ID for Instagram/FB | `4297720497039401` |
| `META_APP_SECRET` | Optional | Meta Developer App Secret | `your-meta-app-secret` |
| `META_REDIRECT_URI` | Optional | Instagram OAuth Callback URI | `http://localhost:3001/api/v1/social/instagram/callback` |
| `LINKEDIN_CLIENT_ID` | Optional | LinkedIn App Client ID | `your-linkedin-client-id` |
| `LINKEDIN_CLIENT_SECRET` | Optional | LinkedIn App Client Secret | `your-linkedin-client-secret` |

---

## 🌐 Meta & Social Integrations

### How to Connect Instagram & Facebook

#### Method A: Direct Token Connect (Instant — 30 Seconds)
1. Open the [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Select your App and generate a **User Token** with the following permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
3. Copy the access token.
4. In the app, go to **Social Accounts** $\rightarrow$ click **`Connect via Token (Instant)`** $\rightarrow$ paste and connect!

#### Method B: Standard OAuth 2.0 Flow
1. In the Meta Developer Dashboard, configure redirect URIs under **Facebook Login $\rightarrow$ Settings**:
   - `http://localhost:3001/api/v1/social/instagram/callback`
   - `http://localhost:3001/api/v1/social/facebook/callback`
2. Click **Connect Instagram** or **Connect Facebook Page** in the dashboard.

---

## 🔒 Security & Encryption

- **Zero Plaintext Tokens**: All third-party access tokens and refresh tokens are encrypted using **AES-256-GCM** before database storage.
- **HMAC OAuth Verification**: OAuth state parameters are cryptographically signed with HMAC-SHA256 to prevent CSRF and replay attacks.
- **HttpOnly Cookie Authentication**: Sessions are protected against XSS injection attacks.
- **Official Graph APIs**: Strictly uses official Meta Graph API and LinkedIn REST API endpoints without web scraping.

---

## 📜 License & Author

Developed with ❤️ by **[Vishal Kumar](https://github.com/vishal4848)**.

Distributed under the **MIT License**. See `LICENSE` for more information.
