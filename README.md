# Discord Account Dashboard (Official OAuth2 Multi-Account SaaS)

An enterprise-grade, secure dashboard for connecting, synchronizing, and managing 4–5 user-owned Discord accounts using **strictly official Discord OAuth2 and REST APIs (Discord API v10)**.

---

## 🛡️ Security Architecture & Policy Compliance

This application strictly enforces Discord's Developer Terms of Service and official API policies:
- **Zero Self-Bots**: No user-token bots, automated client actions, or browser automation.
- **Zero Password Storage**: User passwords for Discord are never requested or stored.
- **Zero Client Token Exposure**: Discord OAuth `access_token` and `refresh_token` are encrypted at rest using **AES-256-GCM** and are **never** returned in API responses or stored in browser storage.
- **CSRF & Account-Linking Protection**: Every OAuth2 flow uses cryptographically secure state parameters and strict user session ownership checks.
- **Accuracy Over Appearance (Nitro Policy)**: Nitro status is determined **only** when officially exposed by the Discord API (`premium_type` field). If omitted or restricted by Discord without partner approval, the dashboard transparently marks the status as **API Restricted** rather than guessing or scraping.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default keys for local development and AES-256-GCM encryption are already configured in `.env`.

### 3. Setup SQLite Database & Migrations
```bash
npx prisma db push
node prisma/seed.js
```
*A default demo user will be created: `demo@example.com` / `password123`.*

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Discord Developer Portal Configuration

To connect real Discord accounts:
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** and give it a name (e.g. *My Account Hub*).
3. In the left menu, click **OAuth2**.
4. In the **Redirects** section, add your redirect URI:
   ```
   http://localhost:3000/api/auth/discord/callback
   ```
5. Copy the **Client ID** and **Client Secret**.
6. Paste them into your `.env` file:
   ```env
   DISCORD_CLIENT_ID=your_client_id_here
   DISCORD_CLIENT_SECRET=your_client_secret_here
   DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback
   ```

*Tip: You can also use the built-in **Demo Mode** on the dashboard to test adding sample accounts and previewing cards before setting up developer portal keys.*

---

## 🧪 Testing & Verification

Run the AES-256-GCM encryption and decryption unit tests:
```bash
npm test
```

---

## 📋 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new dashboard user |
| `POST` | `/api/auth/login` | Login and obtain HTTP-only session cookie |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/me` | Current authenticated dashboard user |
| `POST` | `/api/auth/discord/connect` | Initialize Discord OAuth2 flow with CSRF state |
| `GET` | `/api/auth/discord/callback` | OAuth2 callback, code exchange & credential encryption |
| `GET` | `/api/dashboard/summary` | Metrics: connected count, nitro statuses, reauth count |
| `GET` | `/api/discord/accounts` | List user's connected Discord accounts (sanitized) |
| `GET` | `/api/discord/accounts/:id` | Detailed account metadata and sync logs |
| `POST` | `/api/discord/accounts/:id/refresh` | Manual sync with official Discord API |
| `POST` | `/api/discord/accounts/:id/reconnect` | Reauthorize expired/invalid OAuth token |
| `DELETE` | `/api/discord/accounts/:id` | Disconnect account securely |
| `GET` | `/api/discord/accounts/:id/history` | Synchronization logs & event history |
| `GET` | `/api/notifications` | User notification feed |
| `GET` | `/api/sync/cron` | Background sync worker endpoint |
| `GET` | `/api/health` | System health and configuration check |
