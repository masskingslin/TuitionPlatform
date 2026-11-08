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

## ⚡ Deploy in 30 Minutes Guide

Follow this step-by-step checklist to deploy your tuition center platform in under 30 minutes at 100% zero cost:

### Step 1: Firebase Project Setup (5 mins)
1. Go to [Firebase Console](https://console.firebase.google.com/) and click **Add Project**.
2. Enable **Authentication** > **Sign-in method** > **Email/Password** provider.
3. Enable **Cloud Firestore** in production mode.
4. Go to **Project Settings** > **Service Accounts** > click **Generate new private key** to download `serviceAccountKey.json`.

### Step 2: Configure GitHub Secrets (5 mins)
In your repository under **Settings** > **Secrets and variables** > **Actions**, add:
- `FIREBASE_PROJECT_ID`: Your Firebase Project ID (e.g. `my-tuition-app`).
- `FIREBASE_TOKEN`: Generated via `npx firebase login:ci`.
- `FIREBASE_SERVICE_ACCOUNT`: Contents of your downloaded `serviceAccountKey.json`.
- `VITE_API_BASE_URL`: Your backend Cloudflare Tunnel URL (e.g. `https://api.tuitioncenter.com`).

### Step 3: Self-Host Backend with PM2 & Tunnel (10 mins)
On your Ubuntu server or spare Android phone (Termux):
```bash
# 1. Clone & install
git clone <YOUR_REPO_URL> /opt/tuition-server
cd /opt/tuition-server
npm install
npm run build

# 2. Add service account key & environment variables
cp serviceAccountKey.json /opt/tuition-server/serviceAccountKey.json
cp .env.example .env
nano .env  # set ALLOWED_ORIGIN, ADMIN_BOOTSTRAP_SECRET, FIREBASE_SERVICE_ACCOUNT_PATH

# 3. Start background tunnel
cloudflared tunnel run tuition-backend &

# 4. Start PM2 ecosystem server
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### Step 4: First-Run Admin Bootstrap (5 mins)
Initialize your first system administrator account:
```bash
curl -X POST https://<YOUR_BACKEND_URL>/api/bootstrapFirstAdmin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_FIREBASE_ID_TOKEN>" \
  -d '{
    "secret": "<YOUR_ADMIN_BOOTSTRAP_SECRET>",
    "fullName": "System Principal",
    "schoolName": "Apex Academy of Excellence",
    "upiVpa": "apex@upi"
  }'
```
*(The bootstrap endpoint automatically permanently disables itself after first initialization).*

### Step 5: Install Desktop & Mobile Apps (5 mins)
- **Web PWA**: Open your deployed Firebase Hosting URL (`https://<project-id>.web.app`) on your smartphone or desktop and click **Install PWA**.
- **Android APK**: Install `app-release.apk` compiled with `npm run android:apk` (see `docs/ANDROID.md`).
- **Windows Desktop App**: Download the NSIS Installer (`Apex Academy Setup 1.0.0.exe`) or Portable Version (`Apex Academy 1.0.0.exe`) compiled with `npm run desktop:build` (see `docs/DESKTOP.md`).
  > **Note for Unsigned Windows Apps**: When running the `.exe` for the first time, Windows SmartScreen may show *"Windows protected your PC"*. Click **"More info"** and then **"Run anyway"** to launch.

---

## 👩‍🏫 Teacher User Guide

1. **Faculty Account Sign Up**: Choose **Teacher** during sign-up and enter the institution's active **Teacher Join Code** (`T-XXXXXX`).
2. **Managing Batches & Schedule**:
   - Navigate to **Batches / Classes** to create new subject batches, assign rooms, and update syllabus progress.
   - View weekly timetable automatically generated in **Schedule Calendar**.
3. **Daily Attendance Tracking**:
   - Select batch date in **Mark Attendance**, toggle `PRESENT`/`ABSENT`, and click **Save Attendance**.
   - Send 1-click absent alerts via **Send on WhatsApp** (`wa.me`) or FCM Push.
4. **Fee Management & Approvals**:
   - Generate fee invoices under **Fee Tracker**.
   - Review pending student claims in **Fee Approvals**, verify submitted 12-digit UTR transaction numbers, and click **Approve Payment**.
5. **Homework & Educational Resources**:
   - Post assignments and share Google Drive / YouTube links in **Homework & Resources**.
   - Grade student answer sheets and provide feedback directly in the app.
6. **Data Exports**:
   - In **School Management** > **Data Backups & CSV**, download client-side CSV files for Student Rosters, Attendance Ledgers, and Fee Invoices.

---

## 👨‍👩‍👧 Parent User Guide

1. **Parent Registration & Child Linking**:
   - Sign up as **Parent** and enter the 6-character **Parent Access Code** (`P-XXXXXX`) generated by your student.
   - Once redeemed, your child's profile is securely linked to your account.
2. **Multi-Child Progress View**:
   - Switch between linked children using the active child selector in the top bar.
3. **Attendance & Academic Reports**:
   - Review daily attendance percentage, present/absent logs, and test score reports in real time.
4. **Direct Zero-Cost UPI Fee Payment**:
   - View outstanding tuition fees in **Fees & Invoices**.
   - Click **Pay via UPI** to launch Google Pay, PhonePe, Paytm, or BHIM with pre-filled tuition VPA, or scan the QR code.
   - Enter your 12-digit transaction UTR number to submit a payment claim for instant teacher approval.
5. **Instant Communication**:
   - Receive immediate in-app and push notifications for homework announcements, attendance alerts, and fee receipts.

---

## ⚙️ Process Management & Cron Backups

### PM2 Commands
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### Nightly Automated Firestore Backups
Schedule daily local state backups at 2:00 AM via crontab:
```bash
crontab -e
```
Add:
```cron
0 2 * * * /bin/bash /opt/tuition-server/scripts/backup-firestore.sh >> /var/log/tuition-backup.log 2>&1
```

---

## 🔒 Security Model & Resilience

1. **Authentication Token Verification**: Every endpoint strictly validates the client's Firebase Auth ID token using `admin.auth().verifyIdToken()`.
2. **Strict Firestore Rules**: Clients can self-create accounts *only* as `STUDENT`. Role upgrades to `TEACHER` or `PARENT` are performed exclusively by the server via `firebase-admin`.
3. **Single-Use 24h Join Codes**: Codes are generated using cryptographically secure random bytes, expire in 24 hours, and are invalidated immediately upon redemption.
4. **Persistent Rate Limiting**: Erroneous code submissions are rate-limited per user/IP (maximum 5 failed attempts per 15-minute window), persisted in `rateLimitData.json` (gitignored) so lockouts survive server restarts.
5. **Offline Resilience & Health Banner**: When the backend server is unreachable, `BackendHealthBanner` notifies users that code generation is paused while active Firestore offline cache allows continued read access to classes and progress.
