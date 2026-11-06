import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const rulesPath = resolve(__dirname, '../firestore.rules');
  const rules = readFileSync(rulesPath, 'utf8');

  testEnv = await initializeTestEnvironment({
    projectId: 'tuition-platform-security-test',
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 8080
    }
  });
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
  test("1. A student CANNOT read another student's fees", async () => {
    // Seed database with fee records for student 'student_A' and 'student_B'
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('users').doc('student_A').set({ role: 'STUDENT', studentId: 'student_A' });
      await db.collection('users').doc('student_B').set({ role: 'STUDENT', studentId: 'student_B' });
      await db.collection('fees').doc('fee_student_B').set({
        invoiceId: 'fee_student_B',
        studentId: 'student_B',
        amountDue: 1500,
        amountPaid: 0,
        status: 'PENDING'
      });
    });

    const studentAContext = testEnv.authenticatedContext('student_A');
    const dbStudentA = studentAContext.firestore();

    // Attempting to read student_B's fee as student_A MUST FAIL
    await assertFails(dbStudentA.collection('fees').doc('fee_student_B').get());
  });

  test('2. A student CANNOT change their own role or elevate privileges', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('users').doc('student_X').set({
        role: 'STUDENT',
        isSchoolAdmin: false,
        fullName: 'Student X'
      });
    });

    const studentXContext = testEnv.authenticatedContext('student_X');
    const dbStudentX = studentXContext.firestore();

    // Attempting to change role to ADMIN MUST FAIL
    await assertFails(
      dbStudentX.collection('users').doc('student_X').update({
        role: 'ADMIN'
      })
    );

    // Attempting to set isSchoolAdmin to true MUST FAIL
    await assertFails(
      dbStudentX.collection('users').doc('student_X').update({
        isSchoolAdmin: true
      })
    );

    // Updating allowable profile fields (e.g. fullName) WITHOUT changing role MUST SUCCEED
    await assertSucceeds(
      dbStudentX.collection('users').doc('student_X').update({
        role: 'STUDENT',
        fullName: 'Student X Updated'
      })
    );
  });

  test('3. A student CANNOT mark a fee paid or change amountPaid', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('users').doc('student_Y').set({ role: 'STUDENT', studentId: 'student_Y' });
      await db.collection('fees').doc('fee_student_Y').set({
        invoiceId: 'fee_student_Y',
        studentId: 'student_Y',
        amountDue: 2000,
        amountPaid: 0,
        status: 'PENDING'
      });
    });

    const studentYContext = testEnv.authenticatedContext('student_Y');
    const dbStudentY = studentYContext.firestore();

    // Attempting to set status to 'PAID' or update amountPaid as a student MUST FAIL
    await assertFails(
      dbStudentY.collection('fees').doc('fee_student_Y').update({
        status: 'PAID',
        amountPaid: 2000
      })
    );
  });
});
