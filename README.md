# D-Connect — Official Multi-Account Discord Hub

A modern, high-performance SaaS dashboard for connecting, synchronizing, and managing unlimited user-owned Discord accounts using **strictly official Discord OAuth2 and REST APIs (Discord API v10)** with **MongoDB** and **AES-256-GCM** credential encryption.

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

### 3. Setup MongoDB Database & Migrations
```bash
npx prisma db push
node prisma/seed.js
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security Summary
- Authentication: JWT in HTTP-only, `SameSite=Lax` cookies.
- Account Isolation: Multi-tenant user scoping on all database records.
- Encryption: AES-256-GCM symmetric encryption for all Discord OAuth credentials.
