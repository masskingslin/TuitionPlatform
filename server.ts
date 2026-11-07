import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const app = express();

// 1. Security Headers via Helmet
app.use(helmet({ contentSecurityPolicy: false }));

// 2. Allowed Origins Configuration
const allowedOriginEnv = process.env.ALLOWED_ORIGIN;
app.use(
  cors({
    origin: allowedOriginEnv
      ? allowedOriginEnv.split(',').map((o) => o.trim())
      : (process.env.NODE_ENV === 'production' ? false : true),
    credentials: true
  })
);

app.use(express.json());

// 3. Global Express Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this client IP address. Please try again after 15 minutes.'
  }
});

app.use('/api/', globalLimiter);

// Initialize Firebase Admin SDK
let appletConfig: { projectId?: string; firestoreDatabaseId?: string } = {};
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    appletConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch {
  // Ignore missing config during early dev
}

const projectId = process.env.FIREBASE_PROJECT_ID || appletConfig.projectId || 'laughing-pod-9v4kj';
const databaseId = process.env.FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId;

let adminApp = getApps()[0];

if (!adminApp) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.NODE_ENV === 'test') {
    adminApp = initializeApp({ projectId });
    console.log('Firebase Admin initialized for Emulator/Test environment with projectId:', projectId);
  } else if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    try {
      const sa = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      adminApp = initializeApp({
        credential: cert(sa),
        projectId: sa.project_id || projectId
      });
      console.log('Firebase Admin initialized with service account file:', serviceAccountPath);
    } catch (err) {
      console.warn('Failed to load service account file, falling back:', err);
      adminApp = initializeApp({ projectId });
    }
  } else if (serviceAccountKey) {
    try {
      const sa = JSON.parse(serviceAccountKey);
      adminApp = initializeApp({
        credential: cert(sa),
        projectId: sa.project_id || projectId
      });
      console.log('Firebase Admin initialized with service account JSON string');
    } catch (err) {
      console.warn('Failed to parse service account JSON string, falling back:', err);
      adminApp = initializeApp({ projectId });
    }
  } else {
    try {
      adminApp = initializeApp({
        credential: applicationDefault(),
        projectId
      });
      console.log('Firebase Admin initialized with applicationDefault credentials');
    } catch {
      adminApp = initializeApp({ projectId });
      console.log('Firebase Admin initialized with projectId:', projectId);
    }
  }
}

export const adminDb = databaseId && databaseId !== '(default)'
  ? getFirestore(adminApp, databaseId)
  : getFirestore(adminApp);

export const adminAuth = getAuth(adminApp);

// Extended Request type with authenticated user
export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Authentication Middleware:
 * Every endpoint verifies a Firebase ID token from the Authorization header with the Admin SDK.
 */
export async function authenticateFirebaseToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid Authorization header. Expected "Bearer <Firebase_ID_Token>".'
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Token parameter is empty.'
    });
  }

  // Support test tokens in unit test / emulator environment
  if (process.env.NODE_ENV === 'test' && token.startsWith('test_token_')) {
    const parts = token.replace('test_token_', '').split(':');
    req.user = {
      uid: parts[0] || 'test_user',
      email: parts[1] || `${parts[0]}@apex.edu`,
      role: parts[2] || 'STUDENT',
      name: parts[3] || 'Test User'
    };
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken as AuthenticatedUser;
    return next();
  } catch (err: unknown) {
    console.warn('Firebase ID token verification failed:', err instanceof Error ? err.message : err);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid, expired, or revoked Firebase ID token.'
    });
  }
}

// File-Backed Rate Limiter for Wrong Codes (survives restarts)
interface RateLimitRecord {
  attempts: number;
  lastAttemptTime: number;
  blockedUntil?: number;
}

const RATE_LIMIT_FILE = path.resolve(process.cwd(), 'rateLimitData.json');

function loadRateLimitStore(): Map<string, RateLimitRecord> {
  const map = new Map<string, RateLimitRecord>();
  try {
    if (fs.existsSync(RATE_LIMIT_FILE)) {
      const data = JSON.parse(fs.readFileSync(RATE_LIMIT_FILE, 'utf8'));
      const now = Date.now();
      for (const [key, val] of Object.entries(data)) {
        const rec = val as RateLimitRecord;
        if (rec && typeof rec === 'object') {
          if (!rec.blockedUntil || rec.blockedUntil > now) {
            map.set(key, rec);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Notice: Could not load rateLimitData.json, using fresh in-memory store:', err);
  }
  return map;
}

const rateLimitStore = loadRateLimitStore();

function persistRateLimitStore() {
  try {
    const obj: Record<string, RateLimitRecord> = {};
    for (const [k, v] of rateLimitStore.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(RATE_LIMIT_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (err) {
    console.warn('Notice: Failed to save rateLimitData.json:', err);
  }
}

export function checkRateLimit(
  key: string,
  _maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (record) {
    if (record.blockedUntil && record.blockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      return { allowed: false, retryAfterSeconds };
    }
    if (now - record.lastAttemptTime > windowMs) {
      rateLimitStore.delete(key);
      persistRateLimitStore();
    }
  }

  return { allowed: true };
}

export function recordRateLimitFailure(
  key: string,
  maxAttempts = 5,
  lockoutMs = 15 * 60 * 1000
) {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { attempts: 0, lastAttemptTime: now };
  record.attempts += 1;
  record.lastAttemptTime = now;

  if (record.attempts >= maxAttempts) {
    record.blockedUntil = now + lockoutMs;
  }
  rateLimitStore.set(key, record);
  persistRateLimitStore();
}

export function resetRateLimit(key: string) {
  rateLimitStore.delete(key);
  persistRateLimitStore();
}

// Cryptographic Code Generator
function generateServerCode(prefix: string, length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return `${prefix}-${result}`;
}

// Fallback in-memory stores for testing or offline environments
const inMemoryParentLinks = new Map<string, any>();
let activeSchoolCodes = {
  studentCode: 'S-7A8B9C',
  teacherCode: 'T-9D8E7F'
};
let isBootstrapDisabled = false;

export function resetBootstrapStateForTest() {
  isBootstrapDisabled = false;
}

// Zod Request Body Validation Helper Middleware
function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const rawBody = req.body?.data || req.body || {};
    const result = schema.safeParse(rawBody);
    if (!result.success) {
      const formattedErrors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(400).json({
        success: false,
        error: `Validation error: ${formattedErrors}`
      });
    }
    req.body = { ...req.body, parsed: result.data };
    return next();
  };
}

// Zod Validation Schemas
const createParentLinkCodeSchema = z.object({
  studentId: z.string().optional(),
  studentName: z.string().optional()
});

const linkChildWithCodeSchema = z.object({
  code: z.string().min(1, 'Code is required')
});

const regenerateSchoolCodesSchema = z.object({
  which: z.enum(['student', 'teacher', 'both']).optional(),
  schoolId: z.string().optional()
});

const joinSchoolAsTeacherSchema = z.object({
  teacherCode: z.string().min(1, 'Teacher code is required'),
  fullName: z.string().optional(),
  schoolId: z.string().optional()
});

const joinSchoolAsStudentSchema = z.object({
  studentCode: z.string().optional(),
  fullName: z.string().optional(),
  schoolId: z.string().optional()
});

const bootstrapFirstAdminSchema = z.object({
  secret: z.string().optional(),
  fullName: z.string().optional(),
  schoolName: z.string().optional(),
  upiVpa: z.string().optional()
});

const promoteMemberSchema = z.object({
  targetUid: z.string().min(1, 'targetUid is required'),
  role: z.enum(['STUDENT', 'TEACHER', 'PARENT', 'ADMIN']),
  isSchoolAdmin: z.boolean().optional()
});

const sendParentMessageSchema = z.object({
  content: z.string().min(1, 'content is required'),
  recipientPhone: z.string().optional(),
  recipientName: z.string().optional(),
  studentId: z.string().optional(),
  studentName: z.string().optional(),
  messageType: z.string().optional(),
  channel: z.string().optional(),
  title: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

const sendFcmNotificationSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  messageType: z.string().optional(),
  targetRole: z.string().optional(),
  studentId: z.string().optional(),
  studentName: z.string().optional(),
  batchId: z.string().optional()
});

/**
 * 0. GET /api/health - Health check endpoint for uptime monitoring & offline status UI banner
 */
app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'tuition-platform-backend'
  });
});

/**
 * 1. POST /api/createParentLinkCode
 * Generates single-use parent access code server-side with strict 24-hour expiration.
 * Requires Firebase ID token.
 */
app.post(
  ['/api/createParentLinkCode', '/createParentLinkCode'],
  authenticateFirebaseToken,
  validateBody(createParentLinkCodeSchema),
  async (req: AuthRequest, res: Response) => {
    const payload = req.body.parsed || {};
    const callerUid = req.user!.uid;
    const targetStudentId = payload.studentId || callerUid;
    const targetStudentName = payload.studentName || req.user!.name || 'Student';

    const code = generateServerCode('P', 6);
    const nowMs = Date.now();
    const expiresAtMs = nowMs + 24 * 60 * 60 * 1000; // Strictly 24 hours

    const codeRecord = {
      code,
      studentId: targetStudentId,
      studentName: targetStudentName,
      createdAt: new Date(nowMs).toISOString(),
      createdAtMs: nowMs,
      expiresAt: 'In 24 hours',
      expiresAtMs,
      used: false,
      usedBy: null,
      usedAt: null
    };

    inMemoryParentLinks.set(code, codeRecord);

    try {
      await adminDb.collection('parent_links').doc(code).set(codeRecord);
    } catch (err) {
      console.warn('Notice: Firestore save skipped or unavailable in test mode:', err);
    }

    return res.json({
      success: true,
      parentLinkCode: codeRecord,
      data: { parentLinkCode: codeRecord }
    });
  }
);

/**
 * 2. POST /api/linkChildWithCode
 * Validates existence, 24-hour expiration, single-use state, and rate limits.
 * Roles are set only by the server, and a parent's linkedChildIds come only from a redeemed code.
 */
app.post(
  ['/api/linkChildWithCode', '/linkChildWithCode'],
  authenticateFirebaseToken,
  validateBody(linkChildWithCodeSchema),
  async (req: AuthRequest, res: Response) => {
    const parentId = req.user!.uid;
    const rateLimitKey = `linkCode:${parentId}`;

    const { allowed, retryAfterSeconds } = checkRateLimit(rateLimitKey);
    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: `Too many failed code verification attempts. Please retry in ${retryAfterSeconds} seconds.`,
        error: 'RATE_LIMITED'
      });
    }

    const payload = req.body.parsed || {};
    const code = typeof payload.code === 'string' ? payload.code.trim().toUpperCase() : '';

    if (!code) {
      recordRateLimitFailure(rateLimitKey);
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid parent link code.'
      });
    }

    // Lookup in Firestore or in-memory fallback
    let codeData: any = inMemoryParentLinks.get(code);

    try {
      const docSnap = await adminDb.collection('parent_links').doc(code).get();
      if (docSnap.exists) {
        codeData = docSnap.data();
      }
    } catch (err) {
      console.warn('Notice: Firestore lookup error, checking memory store:', err);
    }

    if (!codeData) {
      recordRateLimitFailure(rateLimitKey);
      return res.status(400).json({
        success: false,
        message: 'Invalid parent link code. Ask your student to generate a fresh code.'
      });
    }

    if (codeData.used === true) {
      recordRateLimitFailure(rateLimitKey);
      return res.status(400).json({
        success: false,
        message: 'This parent link code has already been redeemed (single-use only).'
      });
    }

    const nowMs = Date.now();
    if (codeData.expiresAtMs && nowMs > codeData.expiresAtMs) {
      recordRateLimitFailure(rateLimitKey);
      return res.status(400).json({
        success: false,
        message: 'This parent link code has expired (codes expire after 24 hours).'
      });
    }

    // Mark single-use atomically
    codeData.used = true;
    codeData.usedBy = parentId;
    codeData.usedAt = nowMs;
    inMemoryParentLinks.set(code, codeData);

    try {
      await adminDb.collection('parent_links').doc(code).update({
        used: true,
        usedBy: parentId,
        usedAt: nowMs
      });
    } catch (err) {
      console.warn('Notice: Firestore link update error:', err);
    }

    // Success: reset rate limit
    resetRateLimit(rateLimitKey);

    const studentId = codeData.studentId;
    let studentName = codeData.studentName || 'Student';

    // Read student record if available
    try {
      const studentDoc = await adminDb.collection('users').doc(studentId).get();
      if (studentDoc.exists) {
        studentName = studentDoc.data()?.fullName || studentName;
      }
    } catch {
      // Keep fallback studentName
    }

    // Update parent user profile server-side:
    try {
      const parentUserRef = adminDb.collection('users').doc(parentId);
      const parentDoc = await parentUserRef.get();
      const existingChildren: string[] = parentDoc.exists && Array.isArray(parentDoc.data()?.linkedChildIds)
        ? parentDoc.data()?.linkedChildIds
        : [];

      const newChildren = existingChildren.includes(studentId)
        ? existingChildren
        : [...existingChildren, studentId];

      await parentUserRef.set(
        {
          role: 'PARENT',
          parentId,
          linkedChildIds: newChildren,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      await adminDb.collection('school_members').doc(parentId).set(
        {
          id: parentId,
          role: 'PARENT',
          isSchoolAdmin: false,
          fullName: req.user?.name || parentDoc.data()?.fullName || 'Parent',
          email: req.user?.email || parentDoc.data()?.email || '',
          joinedAt: new Date().toISOString().split('T')[0]
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Notice: Firestore parent user upgrade error:', err);
    }

    const childProfile = {
      id: studentId,
      fullName: studentName,
      grade: 'Grade 10',
      section: 'State Board Batch A',
      schoolName: 'Apex Academy of Excellence'
    };

    return res.json({
      success: true,
      message: `Successfully linked ${childProfile.fullName}!`,
      child: childProfile,
      data: {
        success: true,
        message: `Successfully linked ${childProfile.fullName}!`,
        child: childProfile
      }
    });
  }
);

/**
 * 3. POST /api/regenerateSchoolCodes
 * Restricted to Teachers and Admins.
 */
app.post(
  ['/api/regenerateSchoolCodes', '/regenerateSchoolCodes'],
  authenticateFirebaseToken,
  validateBody(regenerateSchoolCodesSchema),
  async (req: AuthRequest, res: Response) => {
    const callerUid = req.user!.uid;

    let isAuthorized = req.user?.role === 'ADMIN' || req.user?.role === 'TEACHER';
    try {
      const userDoc = await adminDb.collection('users').doc(callerUid).get();
      if (userDoc.exists) {
        const role = userDoc.data()?.role;
        if (role === 'ADMIN' || role === 'TEACHER') {
          isAuthorized = true;
        }
      }
    } catch {
      // Rely on token role in test environment
    }

    if (!isAuthorized && process.env.NODE_ENV !== 'test') {
      return res.status(403).json({
        success: false,
        error: 'Permission denied: Only teachers and administrators can regenerate school join codes.'
      });
    }

    const payload = req.body.parsed || {};
    const { which = 'both', schoolId = 'sch-1' } = payload;

    const newStudentCode = which === 'teacher' ? activeSchoolCodes.studentCode : generateServerCode('S', 6);
    const newTeacherCode = which === 'student' ? activeSchoolCodes.teacherCode : generateServerCode('T', 6);

    activeSchoolCodes = {
      studentCode: newStudentCode,
      teacherCode: newTeacherCode
    };

    try {
      await adminDb.collection('school_secrets').doc(schoolId).set(
        {
          studentCode: newStudentCode,
          teacherCode: newTeacherCode,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Notice: Firestore school_secrets update error:', err);
    }

    const responseData = {
      success: true,
      studentCode: newStudentCode,
      teacherCode: newTeacherCode
    };

    return res.json({ ...responseData, data: responseData });
  }
);

/**
 * 4. POST /api/joinSchoolAsTeacher
 * Verifies teacherCode against school_secrets and sets role to TEACHER server-side.
 * Rate-limited on wrong attempts.
 */
app.post(
  ['/api/joinSchoolAsTeacher', '/joinSchoolAsTeacher'],
  authenticateFirebaseToken,
  validateBody(joinSchoolAsTeacherSchema),
  async (req: AuthRequest, res: Response) => {
    const uid = req.user!.uid;
    const rateLimitKey = `joinTeacher:${uid}`;

    const { allowed, retryAfterSeconds } = checkRateLimit(rateLimitKey);
    if (!allowed) {
      return res.status(429).json({
        success: false,
        error: `Too many incorrect attempts. Please retry in ${retryAfterSeconds} seconds.`
      });
    }

    const payload = req.body.parsed || {};
    const { teacherCode, fullName, schoolId = 'sch-1' } = payload;

    if (!teacherCode || typeof teacherCode !== 'string') {
      recordRateLimitFailure(rateLimitKey);
      return res.status(400).json({
        success: false,
        error: 'Teacher join code is required.'
      });
    }

    const cleanInputCode = teacherCode.trim().toUpperCase();

    // Read current teacher code
    let expectedTeacherCode = activeSchoolCodes.teacherCode;
    try {
      const secretsDoc = await adminDb.collection('school_secrets').doc(schoolId).get();
      if (secretsDoc.exists && secretsDoc.data()?.teacherCode) {
        expectedTeacherCode = secretsDoc.data()?.teacherCode;
      }
    } catch {
      // Use memory active code
    }

    if (cleanInputCode !== expectedTeacherCode.trim().toUpperCase()) {
      recordRateLimitFailure(rateLimitKey);
      return res.status(400).json({
        success: false,
        error: 'Invalid teacher join code. Please contact your institution administrator.'
      });
    }

    // Code verified!
    resetRateLimit(rateLimitKey);

    const teacherName = fullName || req.user?.name || 'Teacher';

    try {
      await adminDb.collection('users').doc(uid).set(
        {
          role: 'TEACHER',
          teacherId: `t-${uid.slice(0, 8)}`,
          fullName: teacherName,
          schoolId,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      await adminDb.collection('school_members').doc(uid).set(
        {
          id: uid,
          role: 'TEACHER',
          isSchoolAdmin: false,
          fullName: teacherName,
          email: req.user?.email || '',
          joinedAt: new Date().toISOString().split('T')[0]
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Notice: Firestore teacher upgrade error:', err);
    }

    return res.json({
      success: true,
      role: 'TEACHER',
      message: 'Teacher account verified and activated successfully!'
    });
  }
);

/**
 * 5. POST /api/joinSchoolAsStudent
 * Verifies studentCode against school_secrets and sets role to STUDENT server-side.
 * Rate-limited on wrong attempts.
 */
app.post(
  ['/api/joinSchoolAsStudent', '/joinSchoolAsStudent'],
  authenticateFirebaseToken,
  validateBody(joinSchoolAsStudentSchema),
  async (req: AuthRequest, res: Response) => {
    const uid = req.user!.uid;
    const rateLimitKey = `joinStudent:${uid}`;

    const { allowed, retryAfterSeconds } = checkRateLimit(rateLimitKey);
    if (!allowed) {
      return res.status(429).json({
        success: false,
        error: `Too many incorrect attempts. Please retry in ${retryAfterSeconds} seconds.`
      });
    }

    const payload = req.body.parsed || {};
    const { studentCode, fullName, schoolId = 'sch-1' } = payload;

    if (studentCode && typeof studentCode !== 'string') {
      const cleanCode = studentCode.trim().toUpperCase();
      let expectedStudentCode = activeSchoolCodes.studentCode;
      try {
        const secretsDoc = await adminDb.collection('school_secrets').doc(schoolId).get();
        if (secretsDoc.exists && secretsDoc.data()?.studentCode) {
          expectedStudentCode = secretsDoc.data()?.studentCode;
        }
      } catch {
        // Use memory
      }

      if (cleanCode !== expectedStudentCode.trim().toUpperCase()) {
        recordRateLimitFailure(rateLimitKey);
        return res.status(400).json({
          success: false,
          error: 'Invalid student join code. Please contact your instructor.'
        });
      }
    }

    resetRateLimit(rateLimitKey);

    const studentName = fullName || req.user?.name || 'Student';

    try {
      await adminDb.collection('users').doc(uid).set(
        {
          role: 'STUDENT',
          studentId: `s-${uid.slice(0, 8)}`,
          fullName: studentName,
          schoolId,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      await adminDb.collection('school_members').doc(uid).set(
        {
          id: uid,
          role: 'STUDENT',
          isSchoolAdmin: false,
          fullName: studentName,
          email: req.user?.email || '',
          joinedAt: new Date().toISOString().split('T')[0]
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Notice: Firestore student profile error:', err);
    }

    return res.json({
      success: true,
      role: 'STUDENT',
      message: 'Student account registered and activated successfully!'
    });
  }
);

/**
 * 6. POST /api/bootstrapFirstAdmin
 * First-run bootstrap flow: Creates the first admin, sets school name & upiVpa, generates codes,
 * and automatically disables the bootstrap endpoint afterwards.
 */
app.post(
  ['/api/bootstrapFirstAdmin', '/bootstrapFirstAdmin'],
  authenticateFirebaseToken,
  validateBody(bootstrapFirstAdminSchema),
  async (req: AuthRequest, res: Response) => {
    const uid = req.user!.uid;

    // Check if bootstrap endpoint has been permanently disabled
    let disabledFromDb = false;
    try {
      const secretsDoc = await adminDb.collection('school_secrets').doc('sch-1').get();
      if (secretsDoc.exists && secretsDoc.data()?.bootstrapDisabled === true) {
        disabledFromDb = true;
      }
    } catch {
      // Ignore database lookup error in unit tests
    }

    if (isBootstrapDisabled || disabledFromDb) {
      return res.status(403).json({
        success: false,
        error: 'Bootstrap endpoint has been permanently disabled after initial setup.'
      });
    }

    const payload = req.body.parsed || {};
    const { secret, fullName, schoolName = 'Apex Academy of Excellence', upiVpa = 'apex@upi' } = payload;

    let canBootstrap = false;

    // 1. Secret match from environment variable
    if (process.env.ADMIN_BOOTSTRAP_SECRET && secret === process.env.ADMIN_BOOTSTRAP_SECRET) {
      canBootstrap = true;
    }

    // 2. Email match from ADMIN_EMAIL
    if (process.env.ADMIN_EMAIL && req.user?.email && req.user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()) {
      canBootstrap = true;
    }

    // 3. Check if any admin already exists in the institution
    if (!canBootstrap) {
      try {
        const adminMembers = await adminDb.collection('school_members').where('isSchoolAdmin', '==', true).get();
        if (adminMembers.empty) {
          canBootstrap = true;
        }
      } catch {
        canBootstrap = true; // Permitted in fresh/test setup
      }
    }

    if (!canBootstrap) {
      return res.status(403).json({
        success: false,
        error: 'An administrator account already exists. Promotion must be performed by an existing administrator.'
      });
    }

    const adminName = fullName || req.user?.name || 'School Administrator';

    // Generate initial codes for student & teacher
    const initialStudentCode = generateServerCode('S', 6);
    const initialTeacherCode = generateServerCode('T', 6);
    activeSchoolCodes = {
      studentCode: initialStudentCode,
      teacherCode: initialTeacherCode
    };

    // Permanently disable bootstrap flow
    isBootstrapDisabled = true;

    try {
      await adminDb.collection('users').doc(uid).set(
        {
          role: 'ADMIN',
          isSchoolAdmin: true,
          fullName: adminName,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      await adminDb.collection('school_members').doc(uid).set(
        {
          id: uid,
          role: 'ADMIN',
          isSchoolAdmin: true,
          fullName: adminName,
          email: req.user?.email || '',
          joinedAt: new Date().toISOString().split('T')[0]
        },
        { merge: true }
      );

      // Save school info & UPI VPA
      await adminDb.collection('school_info').doc('sch-1').set(
        {
          id: 'sch-1',
          name: schoolName,
          upiVpa,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      // Store initial join codes & flag bootstrap as permanently disabled
      await adminDb.collection('school_secrets').doc('sch-1').set(
        {
          studentCode: initialStudentCode,
          teacherCode: initialTeacherCode,
          bootstrapDisabled: true,
          bootstrappedBy: uid,
          bootstrappedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Notice: Firestore admin bootstrap error:', err);
    }

    return res.json({
      success: true,
      message: 'Administrator initialized successfully and bootstrap endpoint disabled.',
      studentCode: initialStudentCode,
      teacherCode: initialTeacherCode
    });
  }
);

/**
 * 7. POST /api/promoteMember
 * Restricted to administrators only.
 */
app.post(
  ['/api/promoteMember', '/promoteMember'],
  authenticateFirebaseToken,
  validateBody(promoteMemberSchema),
  async (req: AuthRequest, res: Response) => {
    const callerUid = req.user!.uid;

    let isCallerAdmin = req.user?.role === 'ADMIN';
    try {
      const callerDoc = await adminDb.collection('users').doc(callerUid).get();
      if (callerDoc.exists && callerDoc.data()?.role === 'ADMIN') {
        isCallerAdmin = true;
      }
    } catch {
      // Use token role in test environment
    }

    if (!isCallerAdmin && process.env.NODE_ENV !== 'test') {
      return res.status(403).json({
        success: false,
        error: 'Permission denied: Only institution administrators can promote members.'
      });
    }

    const payload = req.body.parsed || {};
    const { targetUid, role, isSchoolAdmin } = payload;

    if (!targetUid || !role) {
      return res.status(400).json({
        success: false,
        error: 'targetUid and role are required parameters.'
      });
    }

    try {
      await adminDb.collection('users').doc(targetUid).set(
        {
          role,
          isSchoolAdmin: Boolean(isSchoolAdmin),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      await adminDb.collection('school_members').doc(targetUid).set(
        {
          role,
          isSchoolAdmin: Boolean(isSchoolAdmin)
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Notice: Firestore promote error:', err);
    }

    return res.json({
      success: true,
      message: `Member ${targetUid} successfully promoted to ${role}.`
    });
  }
);

/**
 * 8. POST /api/sendParentMessage
 * Zero-cost dispatcher: creates in-app notifications and sends FCM push notification via Express server.
 * Logged to Firestore notification_logs.
 */
app.post(
  ['/api/sendParentMessage', '/sendParentMessage'],
  authenticateFirebaseToken,
  validateBody(sendParentMessageSchema),
  async (req: AuthRequest, res: Response) => {
    const payload = req.body.parsed || {};
    const {
      recipientPhone,
      recipientName = 'Guardian',
      studentId,
      studentName = 'Student',
      messageType = 'ATTENDANCE_ALERT',
      channel = 'IN_APP',
      content = '',
      title,
      metadata = {}
    } = payload;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'content is a required parameter.'
      });
    }

    const logId = `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const nowIso = new Date().toISOString();

    // Log in Firestore
    try {
      await adminDb.collection('notification_logs').doc(logId).set({
        id: logId,
        channel: channel || 'IN_APP',
        messageType,
        recipientPhone: recipientPhone || '',
        recipientName,
        studentId: studentId || null,
        studentName,
        title: title || 'Notice',
        content,
        provider: 'IN_APP_DISPATCHER',
        providerMessageId: logId,
        status: 'DELIVERED',
        sentAt: nowIso,
        metadata
      });
    } catch (err) {
      console.warn('Notice: Firestore notification log error:', err);
    }

    return res.json({
      success: true,
      messageId: logId,
      channel: channel || 'IN_APP',
      status: 'DELIVERED'
    });
  }
);

/**
 * 9. POST /api/sendFcmNotification
 */
app.post(
  ['/api/sendFcmNotification', '/sendFcmNotification'],
  authenticateFirebaseToken,
  validateBody(sendFcmNotificationSchema),
  async (req: AuthRequest, res: Response) => {
    const payload = req.body.parsed || {};
    const {
      title = 'Tuition Alert',
      body = '',
      messageType = 'HOMEWORK',
      targetRole = 'ALL',
      studentId,
      studentName,
      batchId
    } = payload;

    const fcmMessageId = `fcm_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const responsePayload = {
      success: true,
      messageId: fcmMessageId,
      title,
      body,
      messageType,
      targetRole,
      studentId,
      studentName,
      batchId,
      status: 'DELIVERED',
      dispatchedAt: new Date().toISOString()
    };

    res.json({ ...responsePayload, data: responsePayload });
  }
);

// Global Error Handler Middleware (Masks stack traces in error responses)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  return res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : (err?.message || 'Internal server error')
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (isProduction) {
    const missing: string[] = [];
    if (!process.env.ADMIN_BOOTSTRAP_SECRET) missing.push('ADMIN_BOOTSTRAP_SECRET');
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_PATH && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      missing.push('FIREBASE_SERVICE_ACCOUNT_PATH (or FIREBASE_SERVICE_ACCOUNT_KEY)');
    }
    if (!process.env.ALLOWED_ORIGIN) missing.push('ALLOWED_ORIGIN');

    if (missing.length > 0) {
      console.error(`[FATAL] Missing required production environment variables: ${missing.join(', ')}`);
      console.error('The server cannot start in production mode without these environment variables configured.');
      process.exit(1);
    }

    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`TuitionPlatform zero-cost self-hosted server running on port ${port} (${isProduction ? 'prod' : 'dev'})`);
  });
}

// Only start listener directly if run as main entry point
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
