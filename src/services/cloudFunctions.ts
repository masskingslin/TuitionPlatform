import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { ParentLinkCode, ChildProfile } from '../types';

export interface CreateParentLinkCodeResult {
  success: boolean;
  parentLinkCode: ParentLinkCode;
}

export interface LinkChildWithCodeResult {
  success: boolean;
  message: string;
  child?: ChildProfile;
}

export interface RegenerateSchoolCodesResult {
  success: boolean;
  studentCode: string;
  teacherCode: string;
}

/**
 * Cloud Function Caller: createParentLinkCode
 * Generates single-use parent access code server-side only with strict 24-hour expiration.
 */
export async function callCreateParentLinkCode(
  studentId: string,
  studentName: string
): Promise<ParentLinkCode> {
  // 1. Attempt standard Firebase Cloud Functions HTTPS Callable
  try {
    const cloudFn = httpsCallable<{ studentId: string; studentName: string }, CreateParentLinkCodeResult>(
      functions,
      'createParentLinkCode'
    );
    const result = await cloudFn({ studentId, studentName });
    if (result.data?.parentLinkCode) {
      return result.data.parentLinkCode;
    }
  } catch (err) {
    console.warn('Firebase Cloud Function createParentLinkCode call note:', err);
  }

  // 2. Attempt local full-stack server API endpoint
  try {
    const res = await fetch('/api/createParentLinkCode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, studentName })
    });
    if (res.ok) {
      const data = await res.json();
      const codeRecord = data.parentLinkCode || data.data?.parentLinkCode;
      if (codeRecord) {
        return codeRecord;
      }
    }
  } catch (err) {
    console.warn('Server API createParentLinkCode error:', err);
  }

  throw new Error('Failed to generate parent link code. Server unavailable.');
}

/**
 * Cloud Function Caller: linkChildWithCode
 * Validates existence, single-use state, and 24-hour expiration server-side before linking.
 */
export async function callLinkChildWithCode(
  code: string,
  parentId: string,
  _schoolName = 'Apex Academy of Excellence'
): Promise<LinkChildWithCodeResult> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, message: 'Please enter a valid 6-character parent link code.' };
  }

  // 1. Attempt Firebase Cloud Functions HTTPS Callable
  try {
    const cloudFn = httpsCallable<{ code: string; parentId: string }, LinkChildWithCodeResult>(
      functions,
      'linkChildWithCode'
    );
    const result = await cloudFn({ code: cleanCode, parentId });
    if (result.data) {
      return result.data;
    }
  } catch (err) {
    console.warn('Firebase Cloud Function linkChildWithCode call note:', err);
  }

  // 2. Attempt local full-stack server API endpoint
  try {
    const res = await fetch('/api/linkChildWithCode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: cleanCode, parentId })
    });
    if (res.ok) {
      const data = await res.json();
      const payload = data.data || data;
      return payload;
    }
  } catch (err) {
    console.warn('Server API linkChildWithCode error:', err);
  }

  return {
    success: false,
    message: 'Unable to validate parent link code. Server connection failed.'
  };
}

/**
 * Cloud Function Caller: regenerateSchoolCodes
 * Generates fresh student and faculty join codes server-side only.
 */
export async function callRegenerateSchoolCodes(
  which: 'student' | 'teacher' | 'both' = 'both',
  _currentCodes = { studentCode: '', teacherCode: '' }
): Promise<RegenerateSchoolCodesResult> {
  // 1. Attempt Firebase Cloud Functions HTTPS Callable
  try {
    const cloudFn = httpsCallable<{ which: string }, RegenerateSchoolCodesResult>(
      functions,
      'regenerateSchoolCodes'
    );
    const result = await cloudFn({ which });
    if (result.data?.studentCode && result.data?.teacherCode) {
      return result.data;
    }
  } catch (err) {
    console.warn('Firebase Cloud Function regenerateSchoolCodes note:', err);
  }

  // 2. Attempt local full-stack server API endpoint
  try {
    const res = await fetch('/api/regenerateSchoolCodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ which })
    });
    if (res.ok) {
      const data = await res.json();
      const payload = data.data || data;
      if (payload.studentCode && payload.teacherCode) {
        return payload;
      }
    }
  } catch (err) {
    console.warn('Server API regenerateSchoolCodes error:', err);
  }

  throw new Error('Failed to regenerate school codes. Server unavailable.');
}
