# TuitionPlatform (Zero-Cost Self-Hosted Architecture)

TuitionPlatform operates on a **100% Zero-Cost Serverless & Self-Hosted Stack**:
- **Frontend & Static Assets**: Hosted for free on **Firebase Hosting (Spark Plan)**.
- **Authentication**: **Firebase Authentication** (Email & Password, free Spark tier).
- **Database**: **Cloud Firestore** (Free Spark tier with strict Attribute-Based Access Control and capped `limit()` queries).
- **Zero-Cost Payments**: **Direct UPI & Bharat QR** (`upi://pay?pa=<vpa>&pn=&am=&tn=`). Students submit their 12-digit UTR; fees transition to `PENDING_APPROVAL` until verified and marked `PAID` by faculty. Eliminates all Razorpay gateway fees and transaction cuts.
- **Zero-Cost File Storage**: Eliminates Firebase Storage. Resource, homework, and answer-sheet forms accept validated HTTPS links (Google Drive, YouTube, Docs, Dropbox) with direct preview and opening.
- **Zero-Cost Messaging**: Eliminates SMS/WhatsApp API charges (MSG91, WhatsApp Cloud API). Absence and fee reminders create in-app notifications and self-hosted FCM pushes, plus official 1-click WhatsApp (`wa.me`) direct chat links.
- **Backend API & Administration**: Self-hosted **Node.js/Express (`server.ts`)** utilizing `firebase-admin` to verify tokens, generate single-use 24h join codes, rate-limit verification attempts, and enforce role assignments.
- **Backend Hardening**: Security headers (`helmet`), global & file-backed persistent rate-limiting (`rateLimitData.json`), Zod request body validation, error stack-trace masking, and `/health` uptime monitoring.
- **Zero-Port Tunneling**: **Cloudflare Tunnel (`cloudflared`)** exposes the local backend to the internet with global HTTPS, DDoS protection, and zero router port forwarding or static IP requirements.

---

## 1. First-Run Admin Bootstrap Flow

When launching a new institution instance:
1. Start the backend server (`server.ts`).
2. Make a POST request to `/api/bootstrapFirstAdmin` with your configured `ADMIN_BOOTSTRAP_SECRET`:
   ```bash
   curl -X POST https://<YOUR_BACKEND_URL>/api/bootstrapFirstAdmin \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <ADMIN_FIREBASE_ID_TOKEN>" \
     -d '{
       "secret": "your_super_secret_admin_bootstrap_key",
       "fullName": "System Administrator",
       "schoolName": "Apex Academy of Excellence",
       "upiVpa": "apex@upi"
     }'
   ```
3. The server assigns the caller `ADMIN` role with `isSchoolAdmin: true`, saves the school name and UPI VPA to `school_info/sch-1`, generates initial student and teacher join codes into `school_secrets/sch-1`, and **automatically disables the `/api/bootstrapFirstAdmin` endpoint permanently**.

---

## 2. Zero-Cost Backend Deployment Guide

You can run the backend completely free on any machine:
1. **Ubuntu / Debian VPS** (e.g. Oracle Cloud Free Tier, Raspberry Pi, home server).
2. **Android Phone via Termux** (runs directly on an old phone using ~80MB RAM).

---

### Method A: Ubuntu / Debian / VPS Setup with PM2

#### 1. Install Node.js 22, Git & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo npm install -g pm2
```

#### 2. Clone Repository & Install Dependencies
```bash
git clone <YOUR_REPOSITORY_URL> /opt/tuition-server
cd /opt/tuition-server
npm install
npm run build
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

#### 5. Install & Configure Cloudflare Named Tunnel
Cloudflare Tunnel allows you to securely expose port 3000 to the public internet with a free SSL certificate.

1. Install `cloudflared`:
   ```bash
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared.deb
   ```
2. Authenticate and create a named tunnel:
   ```bash
   cloudflared tunnel login
   cloudflared tunnel create tuition-backend
   cloudflared tunnel route dns tuition-backend api.yourdomain.com
   ```
3. Run the named tunnel as a background service:
   ```bash
   cloudflared tunnel run tuition-backend &
   ```

#### 6. Manage Backend Process with PM2 (Auto-Restart on Crash & Reboot)
```bash
pm2 start server.ts --name tuition-backend -- interpreter node_modules/.bin/tsx
pm2 startup
pm2 save
```
PM2 will automatically monitor the server process and restart it on crashes or server reboot!

#### 7. Schedule Nightly Firestore Local Backups
Set up a cron job to export local state and Firestore collections daily at 2:00 AM:
```bash
crontab -e
```
Add entry:
```cron
0 2 * * * /bin/bash /opt/tuition-server/scripts/backup-firestore.sh >> /var/log/tuition-backup.log 2>&1
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
   npm install -g pm2
   ```
3. **Battery Optimization & Wake-Lock**:
   - Prevent Android from sleeping the CPU:
     ```bash
     termux-wake-lock
     ```
   - Go to Android Settings > **Apps** > **Termux** > **Battery** and select **Unrestricted / Don't optimize battery usage**.

#### 2. Setup Application
```bash
git clone <YOUR_REPOSITORY_URL> tuition-platform
cd tuition-platform
npm install
```

#### 3. Copy Firebase Service Account Key
Copy your `serviceAccountKey.json` into `~/tuition-platform/serviceAccountKey.json`.

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
cloudflared tunnel --url http://localhost:3000
```
Note the generated `https://xxxx.trycloudflare.com` URL.

#### 6. Start Server with PM2
```bash
pm2 start server.ts --name tuition-backend -- interpreter node_modules/.bin/tsx
pm2 save
```

---

## 3. Client Integration (`VITE_API_BASE_URL`)

When hosting the frontend on Firebase Hosting and running the backend via Cloudflare Tunnel:
1. Set `VITE_API_BASE_URL` in your build environment or `.env`:
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

## 4. Security Model & Resilience

1. **Authentication Token Verification**: Every endpoint strictly validates the client's Firebase Auth ID token using `admin.auth().verifyIdToken()`.
2. **Strict Firestore Rules**: Clients can self-create accounts *only* as `STUDENT`. Role upgrades to `TEACHER` or `PARENT` are performed exclusively by the server via `firebase-admin`.
3. **Single-Use 24h Join Codes**: Codes are generated using cryptographically secure random bytes, expire in 24 hours, and are invalidated immediately upon redemption.
4. **Persistent Rate Limiting**: Erroneous code submissions are rate-limited per user/IP (maximum 5 failed attempts per 15-minute window), persisted in `rateLimitData.json` so lockouts survive server restarts.
5. **Offline Resilience & Health Banner**: When the backend server is unreachable, `BackendHealthBanner` notifies users that code generation is paused while active Firestore offline cache allows continued read access to classes and progress.
