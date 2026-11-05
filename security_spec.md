# Security Specification

## 1. Data Invariants
- Users can create and manage their own profile under `/users/{userId}`. Their `role` must be one of `STUDENT`, `TEACHER`, `PARENT`, `ADMIN`.
- Students can only view their own attendance, submissions, fees, test results, doubts, and personal notifications.
- Parents can only view records for their linked children (`studentId` matching the parent's linked child ID).
- Teachers can create and manage course batches, assignments, schedule slots, resources, and grade submissions.
- Admins can manage school info and members.
- Documents must have valid IDs (`isValidId`) and conform to data integrity constraints.

## 2. Dirty Dozen Attack Payloads
1. Student attempts to read another student's fee invoice (`/fees/inv-02`). Expected: PERMISSION_DENIED.
2. Student attempts to update or overwrite another student's submission score (`/submissions/sub-1`). Expected: PERMISSION_DENIED.
3. Unauthenticated client attempts to query `/users` or `/school_members`. Expected: PERMISSION_DENIED.
4. Parent attempts to read attendance for an unlinked student. Expected: PERMISSION_DENIED.
5. Student attempts to create or delete course batches (`/batches/b1`). Expected: PERMISSION_DENIED.
6. User attempts to inject a 10MB payload into an assignment description. Expected: PERMISSION_DENIED.
7. Student attempts to mark attendance for a batch. Expected: PERMISSION_DENIED.
8. Parent attempts to modify school information or school codes. Expected: PERMISSION_DENIED.
9. Malicious user attempts to inject path traversal characters into document ID (`/users/../../`). Expected: PERMISSION_DENIED.
10. Student attempts to delete educational resources uploaded by a faculty member. Expected: PERMISSION_DENIED.
11. Attacker attempts to forge teacher feedback on a submission without teacher authentication. Expected: PERMISSION_DENIED.
12. Attacker attempts to list all private parent link codes. Expected: PERMISSION_DENIED.
