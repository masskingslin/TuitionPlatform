/**
 * Re-exports from self-hosted apiClient for backward compatibility.
 * All Firebase Cloud Functions calls have been fully replaced with zero-cost
 * self-hosted Node/Express endpoints using Firebase Admin SDK.
 */

import {
  apiCreateParentLinkCode,
  apiLinkChildWithCode,
  apiRegenerateSchoolCodes,
  apiJoinSchoolAsTeacher,
  apiJoinSchoolAsStudent,
  apiBootstrapFirstAdmin,
  apiPromoteMember,
  CreateParentLinkCodeResult as ApiCreateParentLinkCodeResult,
  LinkChildWithCodeResult as ApiLinkChildWithCodeResult,
  RegenerateSchoolCodesResult as ApiRegenerateSchoolCodesResult
} from './apiClient';
import { ParentLinkCode, ChildProfile } from '../types';

export type CreateParentLinkCodeResult = ApiCreateParentLinkCodeResult;
export type LinkChildWithCodeResult = ApiLinkChildWithCodeResult;
export type RegenerateSchoolCodesResult = ApiRegenerateSchoolCodesResult;

export async function callCreateParentLinkCode(
  studentId: string,
  studentName: string
): Promise<ParentLinkCode> {
  return apiCreateParentLinkCode(studentId, studentName);
}

export async function callLinkChildWithCode(
  code: string,
  parentId?: string,
  _schoolName = 'Apex Academy of Excellence'
): Promise<{ success: boolean; message: string; child?: ChildProfile; error?: string }> {
  return apiLinkChildWithCode(code, parentId);
}

export async function callRegenerateSchoolCodes(
  which: 'student' | 'teacher' | 'both' = 'both',
  _currentCodes = { studentCode: '', teacherCode: '' }
): Promise<{ success: boolean; studentCode: string; teacherCode: string; error?: string }> {
  return apiRegenerateSchoolCodes(which);
}

export {
  apiJoinSchoolAsTeacher,
  apiJoinSchoolAsStudent,
  apiBootstrapFirstAdmin,
  apiPromoteMember
};
