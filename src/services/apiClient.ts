import { auth } from '../firebase';
import { ParentLinkCode, ChildProfile, UserRole } from '../types';

export interface ApiSuccessResponse<T = Record<string, unknown>> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  [key: string]: unknown;
}

export interface CreateParentLinkCodeResult {
  success: boolean;
  parentLinkCode: ParentLinkCode;
}

export interface LinkChildWithCodeResult {
  success: boolean;
  message: string;
  child?: ChildProfile;
  error?: string;
}

export interface RegenerateSchoolCodesResult {
  success: boolean;
  studentCode: string;
  teacherCode: string;
  error?: string;
}

export interface JoinSchoolResult {
  success: boolean;
  role?: UserRole;
  message?: string;
  error?: string;
}

/**
 * Returns the configured backend API base URL from VITE_API_BASE_URL.
 * If not set or empty, defaults to same-origin relative paths (e.g. for self-hosted dev/prod).
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.trim().replace(/\/$/, '');
  }
  return '';
}

/**
 * Makes an authenticated HTTP request to the self-hosted Express backend.
 * Automatically injects the Firebase ID token in the Authorization header.
 */
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (err) {
      console.warn('Failed to retrieve Firebase ID token for request:', err);
    }
  }

  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * API: createParentLinkCode
 * Generates single-use parent access code server-side with strict 24-hour expiration.
 */
export async function apiCreateParentLinkCode(
  studentId: string,
  studentName: string
): Promise<ParentLinkCode> {
  const res = await fetchWithAuth('/api/createParentLinkCode', {
    method: 'POST',
    body: JSON.stringify({ studentId, studentName })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || data.message || `Failed to create parent link code (${res.status})`);
  }

  const codeRecord = data.parentLinkCode || data.data?.parentLinkCode;
  if (!codeRecord) {
    throw new Error('Invalid response received from server.');
  }

  return codeRecord;
}

/**
 * API: linkChildWithCode
 * Validates existence, 24-hour expiration, rate limits, and single-use status before linking child.
 */
export async function apiLinkChildWithCode(
  code: string,
  parentId?: string
): Promise<LinkChildWithCodeResult> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, message: 'Please enter a valid 6-character parent link code.' };
  }

  const res = await fetchWithAuth('/api/linkChildWithCode', {
    method: 'POST',
    body: JSON.stringify({ code: cleanCode, parentId })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    return {
      success: false,
      message: data.message || data.error || `Unable to link child (${res.status}).`,
      error: data.error || data.message
    };
  }

  return {
    success: true,
    message: data.message || `Successfully linked child!`,
    child: data.child || data.data?.child
  };
}

/**
 * API: regenerateSchoolCodes
 * Restricted to Teachers and Admins.
 */
export async function apiRegenerateSchoolCodes(
  which: 'student' | 'teacher' | 'both' = 'both',
  schoolId = 'sch-1'
): Promise<RegenerateSchoolCodesResult> {
  const res = await fetchWithAuth('/api/regenerateSchoolCodes', {
    method: 'POST',
    body: JSON.stringify({ which, schoolId })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || data.message || `Failed to regenerate codes (${res.status})`);
  }

  return {
    success: true,
    studentCode: data.studentCode || data.data?.studentCode,
    teacherCode: data.teacherCode || data.data?.teacherCode
  };
}

/**
 * API: joinSchoolAsTeacher
 * Upgrades user role to TEACHER server-side upon verifying teacherCode against school_secrets.
 */
export async function apiJoinSchoolAsTeacher(
  teacherCode: string,
  fullName: string,
  schoolId = 'sch-1'
): Promise<JoinSchoolResult> {
  const res = await fetchWithAuth('/api/joinSchoolAsTeacher', {
    method: 'POST',
    body: JSON.stringify({ teacherCode: teacherCode.trim().toUpperCase(), fullName, schoolId })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    return {
      success: false,
      error: data.error || data.message || `Teacher verification failed (${res.status})`
    };
  }

  return {
    success: true,
    role: 'TEACHER',
    message: data.message || 'Teacher account verified successfully!'
  };
}

/**
 * API: joinSchoolAsStudent
 * Registers user role as STUDENT with verified studentCode against school_secrets.
 */
export async function apiJoinSchoolAsStudent(
  studentCode: string,
  fullName: string,
  schoolId = 'sch-1'
): Promise<JoinSchoolResult> {
  const res = await fetchWithAuth('/api/joinSchoolAsStudent', {
    method: 'POST',
    body: JSON.stringify({ studentCode: studentCode.trim().toUpperCase(), fullName, schoolId })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    return {
      success: false,
      error: data.error || data.message || `Student verification failed (${res.status})`
    };
  }

  return {
    success: true,
    role: 'STUDENT',
    message: data.message || 'Student account verified successfully!'
  };
}

/**
 * API: bootstrapFirstAdmin
 * Enables the initial admin bootstrap safely without open client writes.
 */
export async function apiBootstrapFirstAdmin(
  secret?: string,
  fullName?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetchWithAuth('/api/bootstrapFirstAdmin', {
    method: 'POST',
    body: JSON.stringify({ secret, fullName })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    return {
      success: false,
      error: data.error || data.message || `Bootstrap failed (${res.status})`
    };
  }

  return {
    success: true,
    message: data.message || 'Administrator account bootstrapped successfully!'
  };
}

/**
 * API: promoteMember
 * Restricted to School Administrators.
 */
export async function apiPromoteMember(
  targetUid: string,
  role: UserRole,
  isSchoolAdmin = false
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetchWithAuth('/api/promoteMember', {
    method: 'POST',
    body: JSON.stringify({ targetUid, role, isSchoolAdmin })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    return {
      success: false,
      error: data.error || data.message || `Promote failed (${res.status})`
    };
  }

  return {
    success: true,
    message: data.message || `Member promoted to ${role} successfully!`
  };
}
