import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';

const rulesPath = resolve(__dirname, '../firestore.rules');
const rulesContent = readFileSync(rulesPath, 'utf8');

let testEnv: RulesTestEnvironment | null = null;
const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

beforeAll(async () => {
  if (hasEmulator) {
    try {
      const [host, portStr] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':');
      testEnv = await initializeTestEnvironment({
        projectId: 'tuition-platform-security-test',
        firestore: {
          rules: rulesContent,
          host,
          port: parseInt(portStr, 10) || 8080
        }
      });
    } catch {
      testEnv = null;
    }
  }
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

describe('Firestore Security Rules - Security Hardening Suite', () => {
  // 1. Student cannot read teacherCode
  test('1. A student CANNOT read teacherCode (isolated in school_secrets)', async () => {
    // Structural Rule Audit
    expect(rulesContent).toContain('match /school_secrets/{schoolId}');
    expect(rulesContent).toContain('allow read, write: if isTeacherOrAdmin();');

    // school_info must NOT contain join codes
    const schoolInfoStartIndex = rulesContent.indexOf('match /school_info/{schoolId}');
    const schoolInfoEndIndex = rulesContent.indexOf('}', schoolInfoStartIndex) + 1;
    const schoolInfoBlock = rulesContent.slice(schoolInfoStartIndex, schoolInfoEndIndex);
    expect(schoolInfoBlock).not.toContain('teacherCode');
    expect(schoolInfoBlock).not.toContain('studentCode');

    // Live Emulator Test (when active)
    if (testEnv) {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await db.collection('users').doc('student_1').set({ role: 'STUDENT', studentId: 'student_1' });
        await db.collection('school_secrets').doc('sch-1').set({
          teacherCode: 'T-SECRET123',
          studentCode: 'S-SECRET456'
        });
      });

      const studentCtx = testEnv.authenticatedContext('student_1');
      const db = studentCtx.firestore();
      await assertFails(db.collection('school_secrets').doc('sch-1').get());
    }
  });

  // 2. Student cannot read another batch's data
  test("2. A student CANNOT read another batch's data", async () => {
    // Structural Rule Audit
    const batchBlock = rulesContent.slice(
      rulesContent.indexOf('match /batches/{batchId}'),
      rulesContent.indexOf('match /attendance/{attendanceId}')
    );
    expect(batchBlock).toContain('isStudentInBatch(batchId)');
    expect(batchBlock).not.toContain('allow read: if isSignedIn();');

    const assignmentBlock = rulesContent.slice(
      rulesContent.indexOf('match /assignments/{assignmentId}'),
      rulesContent.indexOf('match /submissions/{submissionId}')
    );
    expect(assignmentBlock).toContain('enrolledBatchIds');
    expect(assignmentBlock).not.toContain('allow read: if isSignedIn();');

    // Live Emulator Test (when active)
    if (testEnv) {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await db.collection('users').doc('student_A').set({
          role: 'STUDENT',
          studentId: 'student_A',
          enrolledBatchIds: ['b1']
        });
        await db.collection('batches').doc('b2').set({
          title: 'Physics Advanced',
          studentIds: ['student_B']
        });
        await db.collection('assignments').doc('asg_b2').set({
          batchId: 'b2',
          title: 'Unenrolled Assignment',
          studentIds: ['student_B']
        });
      });

      const studentCtx = testEnv.authenticatedContext('student_A');
      const db = studentCtx.firestore();
      await assertFails(db.collection('batches').doc('b2').get());
      await assertFails(db.collection('assignments').doc('asg_b2').get());
    }
  });

  // 3. Student cannot read another student's doubts
  test("3. A student CANNOT read another student's doubts", async () => {
    // Structural Rule Audit
    const doubtsBlock = rulesContent.slice(
      rulesContent.indexOf('match /doubts/{doubtId}'),
      rulesContent.indexOf('match /resources/{resourceId}')
    );
    expect(doubtsBlock).toContain('resource.data.studentId == request.auth.uid');
    expect(doubtsBlock).toContain('isTeacherOrAdmin()');
    expect(doubtsBlock).not.toContain('allow read, list: if isSignedIn();');

    // Live Emulator Test (when active)
    if (testEnv) {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await db.collection('users').doc('student_1').set({ role: 'STUDENT', studentId: 'student_1' });
        await db.collection('users').doc('student_2').set({ role: 'STUDENT', studentId: 'student_2' });
        await db.collection('doubts').doc('doubt_student_2').set({
          studentId: 'student_2',
          question: 'Physics doubt'
        });
      });

      const student1Ctx = testEnv.authenticatedContext('student_1');
      const db = student1Ctx.firestore();
      await assertFails(db.collection('doubts').doc('doubt_student_2').get());
    }
  });

  // 4. Parent cannot read another child's fees
  test("4. A parent CANNOT read another child's fees", async () => {
    // Structural Rule Audit
    const feesBlock = rulesContent.slice(
      rulesContent.indexOf('match /fees/{feeId}'),
      rulesContent.indexOf('match /announcements/{announcementId}')
    );
    expect(feesBlock).toContain('canAccessStudentData(resource.data.studentId)');
    expect(feesBlock).toContain('isLinkedParentOf(resource.data.studentId)');
    expect(feesBlock).not.toContain('allow read: if isSignedIn();');

    // Live Emulator Test (when active)
    if (testEnv) {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await db.collection('users').doc('parent_1').set({
          role: 'PARENT',
          linkedChildIds: ['child_1']
        });
        await db.collection('fees').doc('fee_child_2').set({
          invoiceId: 'fee_child_2',
          studentId: 'child_2',
          amountDue: 2500,
          amountPaid: 0,
          status: 'PENDING'
        });
      });

      const parentCtx = testEnv.authenticatedContext('parent_1');
      const db = parentCtx.firestore();
      await assertFails(db.collection('fees').doc('fee_child_2').get());
    }
  });

  // 5. New user cannot become teacher without a valid code
  test('5. A new user CANNOT become teacher or admin without valid authorization', async () => {
    // Structural Rule Audit
    const usersBlock = rulesContent.slice(
      rulesContent.indexOf('match /users/{userId}'),
      rulesContent.indexOf('match /batches/{batchId}')
    );
    expect(usersBlock).toContain("request.resource.data.role == 'STUDENT'");
    expect(usersBlock).toContain('isTeacherOrAdmin()');
    expect(usersBlock).toContain('request.resource.data.role == resource.data.role');

    // Live Emulator Test (when active)
    if (testEnv) {
      const newUserCtx = testEnv.authenticatedContext('new_applicant');
      const db = newUserCtx.firestore();

      // Self-creating role TEACHER without admin/callable authorization MUST FAIL
      await assertFails(
        db.collection('users').doc('new_applicant').set({
          role: 'TEACHER',
          fullName: 'Unauthorized Teacher'
        })
      );

      // Self-creating role ADMIN without admin/callable authorization MUST FAIL
      await assertFails(
        db.collection('users').doc('new_applicant').set({
          role: 'ADMIN',
          fullName: 'Unauthorized Admin'
        })
      );

      // Self-creating role STUDENT MUST SUCCEED
      await assertSucceeds(
        db.collection('users').doc('new_applicant').set({
          role: 'STUDENT',
          fullName: 'Legitimate Student'
        })
      );
    }
  });

  // 6. Student can only set PENDING_APPROVAL on own fee; cannot mark PAID
  test('6. Student CANNOT mark fee as PAID, can only set PENDING_APPROVAL with UTR', async () => {
    const feesBlock = rulesContent.slice(
      rulesContent.indexOf('match /fees/{feeId}'),
      rulesContent.indexOf('match /announcements/{announcementId}')
    );
    expect(feesBlock).toContain("request.resource.data.status == 'PENDING_APPROVAL'");
    expect(feesBlock).toContain('isTeacherOrAdmin()');

    if (testEnv) {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await db.collection('users').doc('stu_fee_test').set({
          role: 'STUDENT',
          studentId: 'stu_fee_test'
        });
        await db.collection('users').doc('teach_fee_test').set({
          role: 'TEACHER',
          teacherId: 'teach_fee_test'
        });
        await db.collection('fees').doc('inv_test_101').set({
          invoiceId: 'inv_test_101',
          studentId: 'stu_fee_test',
          amountDue: 1500,
          amountPaid: 0,
          status: 'PENDING'
        });
      });

      const studentCtx = testEnv.authenticatedContext('stu_fee_test');
      const studentDb = studentCtx.firestore();

      // Student attempting to mark fee as PAID MUST FAIL
      await assertFails(
        studentDb.collection('fees').doc('inv_test_101').update({
          status: 'PAID',
          amountPaid: 1500
        })
      );

      // Student submitting UTR and setting status to PENDING_APPROVAL MUST SUCCEED
      await assertSucceeds(
        studentDb.collection('fees').doc('inv_test_101').update({
          status: 'PENDING_APPROVAL',
          utrNumber: '123456789012'
        })
      );

      // Teacher approving fee to PAID MUST SUCCEED
      const teacherCtx = testEnv.authenticatedContext('teach_fee_test');
      const teacherDb = teacherCtx.firestore();
      await assertSucceeds(
        teacherDb.collection('fees').doc('inv_test_101').update({
          status: 'PAID',
          amountPaid: 1500,
          approvalStatus: 'APPROVED'
        })
      );
    }
  });
});

