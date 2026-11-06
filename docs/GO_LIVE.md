# Production Go-Live Smoke-Test Checklist

Use this checklist to verify end-to-end functionality of the Tuition Platform before going live in production.

---

## 1. Initial Setup & Admin Bootstrap
- [ ] **First-Run Bootstrap**:
  - Send POST request to `/api/bootstrapFirstAdmin` with `{ "secret": "<YOUR_ADMIN_SECRET>", "schoolName": "Apex Academy", "upiVpa": "apex@upi" }`.
  - Verify HTTP 200 response returning generated initial `studentCode` and `teacherCode`.
  - Re-send request to `/api/bootstrapFirstAdmin` and verify it returns HTTP 403 Forbidden (*"Bootstrap endpoint has been permanently disabled after initial setup"*).

---

## 2. Student Sign-Up & Code Verification
- [ ] **Student Account Creation**:
  - Navigate to Auth screen and choose **Student** sign up.
  - Register with email and password.
  - Enter student join code (e.g. `S-XXXXXX`).
  - Verify account is created with role `STUDENT` and redirected to Student Dashboard.

---

## 3. Teacher Account Creation & Code Verification
- [ ] **Teacher Account Verification**:
  - Navigate to Auth screen and choose **Teacher** sign up.
  - Register with email and password.
  - Enter active teacher join code (e.g. `T-XXXXXX`).
  - Verify backend validates code, sets user role to `TEACHER`, and redirects to Teacher Dashboard.

---

## 4. Batch & Class Management
- [ ] **Batch Creation**:
  - Log in as Teacher/Admin.
  - Navigate to **Batches / Classes** tab.
  - Create a new batch (e.g., *"Grade 10 Mathematics - Batch A"*).
  - Verify batch appears in schedule and student batch selector.

---

## 5. Daily Attendance Tracking
- [ ] **Mark Attendance**:
  - Open **Mark Attendance** screen as Teacher.
  - Select batch and today's date.
  - Mark student status as **PRESENT** or **ABSENT**.
  - Click **Save Attendance**.
  - Verify attendance record updates in student progress view.

---

## 6. Fee Generation & UPI Payment Claim Flow
- [ ] **Create Fee Invoice**:
  - As Teacher/Admin, navigate to **Fee Management**.
  - Generate fee invoice for student (e.g., ₹2,500 for Monthly Tuition).
- [ ] **Student Pay via UPI Claim**:
  - Switch to Student account.
  - Navigate to **Fees & Payments**.
  - Click **Pay via UPI**. Verify UPI deep link opens native UPI app or displays QR code with VPA.
  - Enter transaction UTR (e.g., `UTR987654321`) and click **Submit Payment Claim**.
  - Verify invoice status changes to `PENDING_APPROVAL`.
- [ ] **Teacher Fee Approval**:
  - Switch to Teacher account.
  - Go to **Fee Approvals**.
  - Verify claim displays student name and submitted UTR.
  - Click **Approve Payment**.
  - Verify invoice status changes to `PAID` with approval timestamp.

---

## 7. Parent Account & Child Link Code Flow
- [ ] **Generate Parent Code**:
  - As Student, open settings/profile modal and click **Generate Parent Access Code**.
  - Note single-use 6-character code (e.g. `P-XXXXXX`) expiring in 24 hours.
- [ ] **Parent Account Linking**:
  - Sign up or log in as **Parent**.
  - Enter parent link code.
  - Verify child is linked to parent account and active child selection updates dashboard view.
  - Attempt to re-enter same code and verify it is rejected (*"already been redeemed"*).

---

## 8. In-App & FCM Push Notifications
- [ ] **Notification Dispatch**:
  - As Teacher, send attendance alert or homework announcement.
  - Verify notification is logged in Firestore `notification_logs`.
  - Verify FCM push payload is dispatched from server.
  - Click **Send on WhatsApp** button to verify pre-filled `wa.me` message opens correctly.

---

## 9. PWA & Offline Resilience Verification
- [ ] **Offline Cache & Health Banner**:
  - Disconnect network or stop backend server (`server.ts`).
  - Observe `BackendHealthBanner` displaying *"Backend server unreachable — Join codes & parent linking temporarily unavailable."*
  - Verify existing student/teacher cached data remains accessible offline via Firestore offline persistence.
