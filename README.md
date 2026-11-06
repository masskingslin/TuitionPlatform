# TuitionPlatform (Zero-Cost Self-Hosted Architecture)

TuitionPlatform operates on a **100% Zero-Cost Serverless & Self-Hosted Stack**:
- **Frontend & Static Assets**: Hosted for free on **Firebase Hosting (Spark Plan)**.
- **Authentication**: **Firebase Authentication** (Email & Password, free Spark tier).
- **Database**: **Cloud Firestore** (Free Spark tier with strict Attribute-Based Access Control and capped `limit()` queries).
- **Zero-Cost Payments**: **Direct UPI & Bharat QR** (`upi://pay?pa=<vpa>&pn=&am=&tn=`). Students submit their 12-digit UTR; fees transition to `PENDING_APPROVAL` until verified and marked `PAID` by faculty. Eliminates all Razorpay gateway fees and transaction cuts.
- **Zero-Cost File Storage**: Eliminates Firebase Storage. Resource, homework, and answer-sheet forms accept validated HTTPS links (Google Drive, YouTube, Docs, Dropbox) with direct preview and opening.
- **Zero-Cost Messaging**: Eliminates SMS/WhatsApp API charges (MSG91, WhatsApp Cloud API). Absence and fee reminders create in-app notifications and self-hosted FCM pushes, plus official 1-click WhatsApp (`wa.me`) direct chat links.
- **Backend API & Administration**: Self-hosted **Node.js/Express (`server.ts`)** utilizing `firebase-admin` to verify tokens, generate single-use 24h join codes, and rate-limit verification attempts.
- **Zero-Port Tunneling**: **Cloudflare Tunnel (`cloudflared`)** exposes the local backend to the internet with global HTTPS, DDoS protection, and zero router port forwarding or static IP requirements.

---

## Zero-Cost Backend Deployment Guide

You can run the backend completely free on any machine:
1. **Ubuntu / Debian VPS** (e.g. Oracle Cloud Free Tier, Raspberry Pi, home server).
2. **Android Phone via Termux** (runs directly on an old phone using ~80MB RAM).

---

### Method A: Ubuntu / Debian / VPS Setup

#### 1. Install Node.js 20+ and Git
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
```

#### 2. Clone Repository & Install Dependencies
```bash
git clone <YOUR_REPOSITORY_URL> /opt/tuition-server
cd /opt/tuition-server
npm install
```

#### 3. Download Firebase Service Account Key
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Navigate to **Project Settings** > **Service Accounts**.
3. Click **Generate new private key** and download the `.json` file.
4. Place the file securely on your server (e.g., `/opt/tuition-server/serviceAccountKey.json`).
5. Restrict permissions:
   ```bash
   chmod 600 /opt/tuition-server/serviceAccountKey.json
   ```
   *(Important: NEVER commit `serviceAccountKey.json` to Git).*

#### 4. Configure Environment Variables
Copy the template and edit your configuration:
```bash
cp .env.example .env
nano .env
```

Ensure the following variables are configured:
```ini
PORT=3000
NODE_ENV=production
ALLOWED_ORIGIN=https://<your-firebase-app>.web.app,https://<your-firebase-app>.firebaseapp.com
FIREBASE_SERVICE_ACCOUNT_PATH=/opt/tuition-server/serviceAccountKey.json
ADMIN_BOOTSTRAP_SECRET=your_super_secret_admin_bootstrap_key
```

#### 5. Install & Configure Cloudflare Tunnel
Cloudflare Tunnel allows you to securely expose port 3000 to the public internet with a free SSL certificate.

1. Download and install `cloudflared`:
   ```bash
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared.deb
   ```
2. Start a tunnel:
   - **Quick Tunnel (instant random URL)**:
     ```bash
     cloudflared tunnel --url http://localhost:3000
     ```
     This outputs a public URL like: `https://xxxx.trycloudflare.com`.
   - **Custom Domain Tunnel (recommended for permanent setup)**:
     ```bash
     cloudflared tunnel login
     cloudflared tunnel create tuition-backend
     cloudflared tunnel route dns tuition-backend api.yourdomain.com
     cloudflared tunnel run tuition-backend
     ```

#### 6. Run Continuously with Systemd
Create a systemd service file `/etc/systemd/system/tuition-backend.service`:
```ini
[Unit]
Description=TuitionPlatform Self-Hosted Zero-Cost Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/tuition-server
ExecStart=/usr/bin/node /opt/tuition-server/server.ts
Restart=always
RestartSec=5
EnvironmentFile=/opt/tuition-server/.env

[Install]
WantedBy=multi-user.target
```
Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now tuition-backend
```

---

### Method B: Android Phone Setup (Termux)

Turn any spare Android smartphone into a 24/7 tuition server:

#### 1. Install Termux & Dependencies
1. Install **Termux** from [F-Droid](https://f-droid.org/packages/com.termux/).
2. Open Termux and update packages:
   ```bash
   pkg update && pkg upgrade -y
   pkg install nodejs-lts git wget -y
   ```
3. Prevent Android battery optimization from sleeping the server:
   ```bash
   termux-wake-lock
   ```

#### 2. Setup Application
```bash
git clone <YOUR_REPOSITORY_URL> tuition-platform
cd tuition-platform
npm install
```

#### 3. Copy Firebase Service Account Key
Copy your `serviceAccountKey.json` into `~/tuition-platform/serviceAccountKey.json` using Termux storage access (`termux-setup-storage`) or `scp`/`curl`.

#### 4. Configure `.env`
```bash
cat << 'EOF' > .env
PORT=3000
NODE_ENV=production
ALLOWED_ORIGIN=*
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
ADMIN_BOOTSTRAP_SECRET=my_secure_admin_pass
EOF
```

#### 5. Install & Run Cloudflare Tunnel on Termux
```bash
pkg install cloudflared -y
```
Run the tunnel in a background session or tmux:
```bash
cloudflared tunnel --url http://localhost:3000
```
Note the generated `https://xxxx.trycloudflare.com` URL.

#### 6. Start the Backend
```bash
node server.ts
```

---

## Client Integration (`VITE_API_BASE_URL`)

When hosting the frontend on Firebase Hosting and running the backend via Cloudflare Tunnel:
1. Set `VITE_API_BASE_URL` in your frontend environment:
   ```ini
   VITE_API_BASE_URL=https://api.yourdomain.com
   # or the TryCloudflare URL:
   # VITE_API_BASE_URL=https://xxxx.trycloudflare.com
   ```
2. Build and deploy the client to Firebase Hosting:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```
Every client API request will automatically attach the user's Firebase ID token in the `Authorization: Bearer <token>` header, verified server-side by the self-hosted Express backend!

---

## Security Model

1. **Authentication Token Verification**: Every endpoint strictly validates the client's Firebase Auth ID token using `admin.auth().verifyIdToken()`.
2. **Strict Firestore Rules**: Clients can self-create accounts *only* as `STUDENT`. Role upgrades to `TEACHER` or `PARENT` are performed exclusively by the server via `firebase-admin`.
3. **Single-Use 24h Join Codes**: Codes are generated using cryptographically secure random bytes, expire in 24 hours, and are invalidated immediately upon redemption.
4. **Rate Limiting**: Erroneous code submissions are automatically rate-limited per user/IP (maximum 5 failed attempts per 15-minute window).
5. **No Orphaned Accounts**: If teacher or parent join code verification fails during signup, users are provided an in-place retry flow and an account cleanup button to prevent orphaned database records.
