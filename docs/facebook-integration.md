# Facebook Page Integration & Publishing Guide

This document details the configuration and architecture for connecting Facebook Pages and publishing scheduled image & video posts using the official Meta Graph API (v20.0).

---

## 1. Creating & Configuring Your Meta Developer App

1. Visit [Meta for Developers](https://developers.facebook.com/) and log in.
2. Select your Meta App (e.g. `AI Automation` with App ID `4297720497039401`).
3. Under **Add Use Cases** or **Products**, add:
   - **Facebook Login for Business** (or **Facebook Login**)
   - **Manage and Access Page Content** (Pages API)

---

## 2. Required Meta Scopes & Permissions

For discovering Pages and auto-publishing photos/videos to Page feeds, our OAuth request includes the following standard permissions:

| Permission | Purpose |
|------------|---------|
| `pages_show_list` | Discovers the Facebook Pages managed by the user (`/me/accounts`). |
| `pages_read_engagement` | Reads post status, engagement data, and Page metadata. |
| `pages_manage_posts` | Publishes photos, videos, and feed posts directly to the Facebook Page. |
| `pages_manage_metadata` | Manages Page webhook subscriptions and configuration. |
| `public_profile` | Retrieves user identification to establish the session. |

---

## 3. Configuring Valid OAuth Redirect URIs

In **Meta Developer Dashboard** $\rightarrow$ **Facebook Login** $\rightarrow$ **Settings**:
1. Add your HTTPS Redirect URI under **Valid OAuth Redirect URIs**:
   ```text
   https://<your-domain-or-tunnel>/api/v1/social/facebook/callback
   ```
2. For local development, use your active Cloudflare tunnel URL:
   ```text
   https://both-hunt-street-keys.trycloudflare.com/api/v1/social/facebook/callback
   ```
3. Click **Save Changes**.

---

## 4. Environment Configuration

In `ai-automation-backend/.env`:
```env
# Meta Facebook Page API
FACEBOOK_APP_ID=4297720497039401
FACEBOOK_APP_SECRET=2c3ee26f272832cdf17273223df095be
META_FACEBOOK_REDIRECT_URI=https://<your-tunnel>/api/v1/social/facebook/callback
META_API_VERSION=v20.0

# AES-256 Encryption Key (for Page Access Tokens)
TOKEN_ENCRYPTION_KEY=dev-encryption-key-change-in-production
```

---

## 5. Publishing Architecture & Endpoints

### Discovery & Token Exchange:
1. `GET /api/v1/social/facebook/connect-url` generates a cryptographically signed HMAC-SHA256 OAuth URL.
2. User authorizes permissions on Facebook.
3. Meta redirects to `GET /api/v1/social/facebook/callback`.
4. Backend exchanges authorization code for a long-lived user token and queries `https://graph.facebook.com/v20.0/me/accounts`.
5. The permanent Page Access Token is encrypted with AES-256 and stored in PostgreSQL `social_accounts`.

### Photo Publishing:
- Endpoint: `POST https://graph.facebook.com/v20.0/{page_id}/photos`
- Payload: `{ url: "<Cloudinary_HTTPS_URL>", caption: "<Caption>", access_token: "<Decrypted_Page_Token>" }`
- Returns: `{ id: "<Photo_ID>", post_id: "<Page_Post_ID>" }`

### Video Publishing:
- Endpoint: `POST https://graph.facebook.com/v20.0/{page_id}/videos`
- Payload: `{ file_url: "<Cloudinary_HTTPS_URL>", description: "<Caption>", access_token: "<Decrypted_Page_Token>" }`
- Returns: `{ id: "<Video_ID>" }`

---

## 6. Multi-Platform Scheduling

- In the **Scheduler**, users can select:
  - **Instagram**: Publishes exclusively to Instagram Professional account.
  - **Facebook**: Publishes exclusively to Facebook Page feed.
  - **✨ All Channels (Instagram + Facebook Page)**: Creates two independent `ScheduledPost` jobs sharing the same media & caption.
- BullMQ processes each post independently with exponential backoff and tracks statuses (`SCHEDULED`, `PROCESSING`, `PUBLISHED`, `FAILED`).
