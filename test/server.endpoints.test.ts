import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { app, resetRateLimit } from '../server';

let server: http.Server;
let baseUrl = '';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.ADMIN_BOOTSTRAP_SECRET = 'test_bootstrap_secret_123';

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      resolve();
    });
  });
});

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

describe('Zero-Cost Backend Endpoints Suite (server.ts)', () => {
  const studentToken = 'Bearer test_token_stu_99:student99@apex.edu:STUDENT:Test Student';
  const teacherToken = 'Bearer test_token_teach_88:teacher88@apex.edu:TEACHER:Dr. Wilson';
  const parentToken = 'Bearer test_token_parent_77:parent77@apex.edu:PARENT:Parent User';
  const adminToken = 'Bearer test_token_admin_00:admin00@apex.edu:ADMIN:Administrator';

  // 1. Authentication Middleware Enforcement
  test('1. Every endpoint rejects requests with missing or invalid Authorization header', async () => {
    const endpoints = [
      '/api/createParentLinkCode',
      '/api/linkChildWithCode',
      '/api/regenerateSchoolCodes',
      '/api/joinSchoolAsTeacher',
      '/api/joinSchoolAsStudent',
      '/api/bootstrapFirstAdmin',
      '/api/promoteMember'
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Unauthorized');
    }
  });

  // 2. createParentLinkCode
  let generatedParentCode = '';
  test('2. createParentLinkCode generates single-use code with 24-hour expiration', async () => {
    const res = await fetch(`${baseUrl}/api/createParentLinkCode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: studentToken
      },
      body: JSON.stringify({
        studentId: 'stu_99',
        studentName: 'Test Student'
      })
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.parentLinkCode).toBeDefined();
    expect(json.parentLinkCode.code).toMatch(/^P-[A-Z0-9]{6}$/);
    expect(json.parentLinkCode.studentId).toBe('stu_99');
    expect(json.parentLinkCode.used).toBe(false);

    // Verify 24-hour expiration window
    const nowMs = Date.now();
    const expiresAtMs = json.parentLinkCode.expiresAtMs;
    const diffHours = (expiresAtMs - nowMs) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(23.9);
    expect(diffHours).toBeLessThanOrEqual(24.1);

    generatedParentCode = json.parentLinkCode.code;
  });

  // 3. linkChildWithCode & Single-Use Enforcement
  test('3. linkChildWithCode validates code, marks single-use, and rate-limits invalid attempts', async () => {
    const parentUid = 'parent_77';
    resetRateLimit(`linkCode:${parentUid}`);

    // Test: Invalid code
    const invalidRes = await fetch(`${baseUrl}/api/linkChildWithCode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: parentToken
      },
      body: JSON.stringify({ code: 'P-INVALID' })
    });
    expect(invalidRes.status).toBe(400);
    const invalidJson = await invalidRes.json();
    expect(invalidJson.success).toBe(false);

    // Test: Rate Limiting after repeated wrong attempts (5 attempts)
    for (let i = 0; i < 4; i++) {
      await fetch(`${baseUrl}/api/linkChildWithCode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: parentToken
        },
        body: JSON.stringify({ code: `P-WRONG${i}` })
      });
    }

    const rateLimitedRes = await fetch(`${baseUrl}/api/linkChildWithCode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: parentToken
      },
      body: JSON.stringify({ code: 'P-WRONG5' })
    });
    expect(rateLimitedRes.status).toBe(429);
    const rateLimitedJson = await rateLimitedRes.json();
    expect(rateLimitedJson.error).toBe('RATE_LIMITED');

    // Reset rate limit for the parent to test successful redemption
    resetRateLimit(`linkCode:${parentUid}`);

    // Test: Successful Redemption
    expect(generatedParentCode).toBeTruthy();
    const successRes = await fetch(`${baseUrl}/api/linkChildWithCode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: parentToken
      },
      body: JSON.stringify({ code: generatedParentCode })
    });
    expect(successRes.status).toBe(200);
    const successJson = await successRes.json();
    expect(successJson.success).toBe(true);
    expect(successJson.child).toBeDefined();
    expect(successJson.child.id).toBe('stu_99');

    // Test: Second Redemption MUST FAIL (single-use enforcement)
    resetRateLimit(`linkCode:${parentUid}`);
    const reusedRes = await fetch(`${baseUrl}/api/linkChildWithCode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: parentToken
      },
      body: JSON.stringify({ code: generatedParentCode })
    });
    expect(reusedRes.status).toBe(400);
    const reusedJson = await reusedRes.json();
    expect(reusedJson.success).toBe(false);
    expect(reusedJson.message).toContain('already been redeemed');
  });

  // 4. regenerateSchoolCodes
  let activeTeacherCode = '';
  test('4. regenerateSchoolCodes rotates studentCode and teacherCode', async () => {
    const res = await fetch(`${baseUrl}/api/regenerateSchoolCodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: teacherToken
      },
      body: JSON.stringify({ which: 'both' })
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.studentCode).toMatch(/^S-[A-Z0-9]{6}$/);
    expect(json.teacherCode).toMatch(/^T-[A-Z0-9]{6}$/);

    activeTeacherCode = json.teacherCode;
  });

  // 5. joinSchoolAsTeacher
  test('5. joinSchoolAsTeacher validates teacher code and upgrades role', async () => {
    const newTeacherToken = 'Bearer test_token_applicant_1:applicant1@apex.edu:STUDENT:New Teacher';
    resetRateLimit('joinTeacher:applicant_1');

    // Invalid code attempt
    const invalidRes = await fetch(`${baseUrl}/api/joinSchoolAsTeacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: newTeacherToken
      },
      body: JSON.stringify({ teacherCode: 'T-WRONGCODE' })
    });
    expect(invalidRes.status).toBe(400);

    // Valid code attempt
    const validRes = await fetch(`${baseUrl}/api/joinSchoolAsTeacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: newTeacherToken
      },
      body: JSON.stringify({
        teacherCode: activeTeacherCode,
        fullName: 'New Verified Teacher'
      })
    });
    expect(validRes.status).toBe(200);
    const validJson = await validRes.json();
    expect(validJson.success).toBe(true);
    expect(validJson.role).toBe('TEACHER');
  });

  // 6. bootstrapFirstAdmin & promoteMember
  test('6. bootstrapFirstAdmin and promoteMember manage administrator privileges safely', async () => {
    const applicantToken = 'Bearer test_token_applicant_admin:app_admin@apex.edu:STUDENT:App Admin';

    // Bootstrap with valid secret
    const bootstrapRes = await fetch(`${baseUrl}/api/bootstrapFirstAdmin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: applicantToken
      },
      body: JSON.stringify({
        secret: 'test_bootstrap_secret_123',
        fullName: 'First System Admin'
      })
    });
    expect(bootstrapRes.status).toBe(200);
    const bootstrapJson = await bootstrapRes.json();
    expect(bootstrapJson.success).toBe(true);

    // promoteMember by Admin
    const promoteRes = await fetch(`${baseUrl}/api/promoteMember`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: adminToken
      },
      body: JSON.stringify({
        targetUid: 'applicant_1',
        role: 'ADMIN',
        isSchoolAdmin: true
      })
    });
    expect(promoteRes.status).toBe(200);
    const promoteJson = await promoteRes.json();
    expect(promoteJson.success).toBe(true);
  });

  // 7. sendParentMessage (zero-cost in-app notification & push dispatcher)
  test('7. sendParentMessage accepts in-app / push notification dispatch without paid gateways', async () => {
    const res = await fetch(`${baseUrl}/api/sendParentMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: teacherToken
      },
      body: JSON.stringify({
        recipientPhone: '+919876543210',
        recipientName: 'Kumar Raman',
        studentId: 's1',
        studentName: 'Aravind Kumar',
        messageType: 'FEE_REMINDER',
        title: 'Tuition Fee Alert',
        content: 'Your fee is due.'
      })
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.channel).toBe('IN_APP');
  });
});

