# LinkedIn Integration & Auto-Publishing Guide

This document details the configuration and architecture for connecting LinkedIn Personal Profiles (and LinkedIn Organizations) and publishing scheduled image & video posts using the official LinkedIn REST APIs (Posts API `/rest/posts`, Images API `/rest/images`, Videos API `/rest/videos`).

---

## 1. Creating & Configuring Your LinkedIn Developer App

1. Visit the [LinkedIn Developer Portal](https://www.linkedin.com/developers/) and log in.
2. Click **Create App** and provide:
   - **App name**: `AI Automation` (or your application name)
   - **LinkedIn Page**: Associate with your company or personal verified LinkedIn page.
   - **App logo**: Upload your app logo.
3. Under the **Products** tab, request access to:
   - **Sign In with LinkedIn using OpenID Connect** (Immediate access) — provides `openid`, `profile`, `email` scopes for authenticating members and retrieving member URN and profile data.
   - **Share on LinkedIn** (Immediate access) — provides `w_member_social` scope for creating posts, uploading photos/videos, and sharing content to member profiles.
   - *(Optional for Organization/Company Page Publishing)* **Community Management API** — provides `r_organization_social`, `w_organization_social`, and `rw_organization_admin` scopes for managing and publishing to LinkedIn Company Pages.
     > [!NOTE]
     > Personal profile publishing with `w_member_social` is supported immediately. Organization publishing requires LinkedIn's approval for the Community Management API product.

---

## 2. Configuring Authorized Redirect URLs

1. In your LinkedIn App dashboard, navigate to **Auth** $\rightarrow$ **OAuth 2.0 settings**.
2. Under **Authorized redirect URLs for your app**, add your HTTPS callback URL:
   ```text
   https://<your-domain-or-tunnel>/api/v1/social/linkedin/callback
   ```
3. For local development with Cloudflare tunnel:
   ```text
   https://both-hunt-street-keys.trycloudflare.com/api/v1/social/linkedin/callback
   ```
4. Click **Update**.

---

## 3. Environment Configuration

In `ai-automation-backend/.env`:
```env
# LinkedIn OAuth & REST API
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=https://<your-domain-or-tunnel>/api/v1/social/linkedin/callback
LINKEDIN_API_VERSION=202401

# AES-256 Encryption Key (reused from social security)
TOKEN_ENCRYPTION_KEY=dev-encryption-key-change-in-production
```

---

## 4. API Endpoints & Publishing Flow

### A. OAuth 2.0 Authentication & Discovery
1. `GET /api/v1/social/linkedin/connect-url`: Generates a cryptographically signed HMAC-SHA256 OAuth URL (`https://www.linkedin.com/oauth/v2/authorization?response_type=code&scope=openid profile email w_member_social&...`).
2. User authorizes permissions on LinkedIn.
3. LinkedIn redirects to `GET /api/v1/social/linkedin/callback?code=...&state=...`.
4. Backend verifies signed state, exchanges code for access token via `POST https://www.linkedin.com/oauth/v2/accessToken`.
5. Retrieves member identity via `GET https://api.linkedin.com/v2/userinfo` (`sub`, `name`, `picture`).
6. Discovers authorized organizations via `GET https://api.linkedin.com/v2/organizationalEntityAcls` (if authorized).
7. Encrypts tokens with AES-256 and persists records to PostgreSQL `social_accounts` with `platform: 'LinkedIn'`.

### B. Image Publishing (`LinkedInPublisher`)
- **Step 1 (Initialize)**:
  `POST https://api.linkedin.com/rest/images?action=initializeUpload`
  Body: `{ "initializeUploadRequest": { "owner": "urn:li:person:{id}" } }`
  Returns: `uploadUrl` and `image` URN (e.g. `urn:li:image:...`).
- **Step 2 (Binary Upload)**:
  Fetches image from Cloudinary HTTPS URL and sends raw binary to `uploadUrl` via HTTP `PUT` with `Content-Type: image/jpeg` or `image/png`.
- **Step 3 (Post Creation)**:
  `POST https://api.linkedin.com/rest/posts`
  Body:
  ```json
  {
    "author": "urn:li:person:{id}",
    "commentary": "Caption text",
    "visibility": "PUBLIC",
    "distribution": { "feedDistribution": "MAIN_FEED" },
    "content": { "media": { "id": "urn:li:image:...", "title": "AI Generated Media" } },
    "lifecycleState": "PUBLISHED"
  }
  ```
  Returns: Real post URN in response header `x-restli-id`.

### C. Video Publishing (`LinkedInPublisher`)
- **Step 1 (Initialize)**:
  `POST https://api.linkedin.com/rest/videos?action=initializeUpload`
  Body: `{ "initializeUploadRequest": { "owner": "urn:li:person:{id}", "fileSizeBytes": <size> } }`
  Returns: `uploadUrl` and `video` URN (e.g. `urn:li:video:...`).
- **Step 2 (Binary Upload)**:
  Sends video binary to `uploadUrl` via HTTP `PUT` with `Content-Type: video/mp4`.
- **Step 3 (Processing Polling)**:
  Polls `GET https://api.linkedin.com/rest/videos/{video_urn}` until `status === 'AVAILABLE'`.
- **Step 4 (Post Creation)**:
  `POST https://api.linkedin.com/rest/posts` referencing the video URN.
  Returns: Real post URN in response header `x-restli-id`.

---

## 5. Multi-Platform Scheduling Architecture

- In the **Scheduler**, users can target:
  - **Instagram**: Professional account publishing.
  - **Facebook**: Page feed publishing.
  - **LinkedIn**: Personal Profile or Organization publishing.
  - **✨ All Channels (Instagram + Facebook + LinkedIn)**: Creates independent `ScheduledPost` records with shared media & captions.
- BullMQ worker dispatches each post independently with exponential backoff and stores real external post IDs (`externalPostId`).
- Failures on one platform (e.g. LinkedIn rate limit) never affect successful posts on another platform (e.g. Instagram/Facebook).
