import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  UserRole,
  UserProfile,
  StudentProfile,
  TeacherProfile,
  CourseBatch,
  AttendanceRecord,
  Assignment,
  FeeRecord,
  Announcement,
  StudentSubmission,
  TestResult,
  StudentDoubt,
  EducationalResource,
  StudentNotification,
  ClassroomRoom,
  ScheduleSlot,
  DayOfWeek,
  MarkAttendanceRequest,
  ParentLinkCode,
  LinkedParent,
  ChildProfile,
  SchoolInfo,
  SchoolMember,
  NotificationLog
} from '../types';
import {
  sendGuardianMessage,
  SendGuardianMessageParams,
  SendMessageResult
} from '../services/messagingService';
import {
  dispatchFcmPush,
  FcmPushParams,
  FcmPushResult,
  requestFcmToken
} from '../services/fcmService';
import {
  callCreateParentLinkCode,
  callLinkChildWithCode,
  callRegenerateSchoolCodes
} from '../services/cloudFunctions';
import {
  apiJoinSchoolAsTeacher,
  apiJoinSchoolAsStudent,
  apiLinkChildWithCode
} from '../services/apiClient';
import {
  auth,
  db,
  OperationType,
  handleFirestoreError
} from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword as firebaseUpdatePassword,
  deleteUser,
  User as FirebaseUser
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  where,
  limit
} from 'firebase/firestore';

interface TuitionContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmail: (
    email: string,
    pass: string,
    fullName: string,
    role: UserRole,
    joinCode?: string
  ) => Promise<{ success: boolean; error?: string; requiresRetry?: boolean; pendingRole?: UserRole }>;
  retryRoleVerification: (
    role: UserRole,
    code: string,
    fullName: string
  ) => Promise<{ success: boolean; error?: string }>;
  cancelSignupAndCleanup: () => Promise<void>;
  quickDemoLogin: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  currentStudent: StudentProfile;
  currentTeacher: TeacherProfile;
  currentParent: { id: string; fullName: string; email: string };
  batches: CourseBatch[];
  addBatch: (batch: Omit<CourseBatch, 'id'>) => Promise<void> | void;
  rooms: ClassroomRoom[];
  scheduleSlots: ScheduleSlot[];
  attendanceRecords: AttendanceRecord[];
  assignments: Assignment[];
  submissions: StudentSubmission[];
  feeRecords: FeeRecord[];
  announcements: Announcement[];
  testResults: TestResult[];
  addTestResult: (result: Omit<TestResult, 'id'>) => Promise<void> | void;
  saveBatchTestMarks: (
    testMeta: { batchId: string; testTitle: string; subject: string; date: string; maxMarks: number },
    marks: Array<{ studentId: string; studentName?: string; marksScored: number; remarks?: string }>
  ) => Promise<void>;
  doubts: StudentDoubt[];
  resources: EducationalResource[];
  notifications: StudentNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notification: Omit<StudentNotification, 'id' | 'timestamp' | 'read'>) => void;
  latestNotificationToast: StudentNotification | null;
  dismissToast: () => void;
  addScheduleSlot: (slot: Omit<ScheduleSlot, 'id'>) => void;
  updateScheduleSlot: (id: string, updates: Partial<ScheduleSlot>) => void;
  deleteScheduleSlot: (id: string) => void;
  checkRoomAvailability: (
    roomId: string,
    day: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeSlotId?: string
  ) => { isAvailable: boolean; conflictingSlot?: ScheduleSlot };
  markAttendance: (request: MarkAttendanceRequest) => void;
  addAssignment: (assignment: Omit<Assignment, 'id'>) => void;
  submitAssignment: (
    assignmentId: string,
    note?: string,
    answerSheetFile?: string,
    answerSheetSize?: string,
    answerSheetUrl?: string
  ) => void;
  gradeSubmission: (submissionId: string, score: number, feedback: string) => void;
  payFee: (invoiceId: string, paymentMethod?: string, paymentId?: string) => Promise<void> | void;
  submitManualPayment: (invoiceId: string, utr: string) => Promise<void> | void;
  approveManualPayment: (invoiceId: string) => Promise<void> | void;
  rejectManualPayment: (invoiceId: string) => Promise<void> | void;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'timestamp'>) => void;
  askDoubt: (doubt: Omit<StudentDoubt, 'id' | 'askedAt' | 'isResolved'>) => void;
  replyDoubt: (doubtId: string, reply: string) => void;
  addResource: (resource: Omit<EducationalResource, 'id' | 'uploadedAt'>) => void;
  deleteResource: (resourceId: string) => void;
  parentLinkCode: ParentLinkCode | null;
  createParentLinkCode: () => Promise<ParentLinkCode> | ParentLinkCode;
  linkedParents: LinkedParent[];
  revokeParent: (parentId: string) => void;
  linkedChildren: ChildProfile[];
  activeChildId: string;
  setActiveChildId: (id: string) => void;
  linkChildWithCode: (code: string) => Promise<{ success: boolean; message: string; child?: ChildProfile }> | { success: boolean; message: string; child?: ChildProfile };
  unlinkChild: (childId: string) => void;
  schoolInfo: SchoolInfo;
  updateSchoolName: (name: string) => void;
  updateSchoolSettings: (updates: Partial<SchoolInfo>) => Promise<void>;
  regenerateSchoolCodes: (which?: 'student' | 'teacher' | 'both') => Promise<void> | void;
  schoolMembers: SchoolMember[];
  updateSchoolMemberRole: (memberId: string, role: UserRole, isSchoolAdmin?: boolean) => Promise<void>;
  deleteSchoolMember: (memberId: string) => Promise<void>;
  addSchoolMember: (member: Omit<SchoolMember, 'id' | 'joinedAt'>) => Promise<void>;
  notificationLogs: NotificationLog[];
  sendGuardianSmsOrWhatsApp: (params: SendGuardianMessageParams) => Promise<SendMessageResult>;
  sendPushNotification: (params: FcmPushParams) => Promise<FcmPushResult>;
  requestPushPermissions: () => Promise<string | null>;
  updateUserProfileData: (updates: { fullName?: string; phone?: string; guardianName?: string; guardianPhone?: string }) => Promise<{ success: boolean; error?: string }>;
  updateUserPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resetToDefaults: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

import {
  initialBatches,
  initialAttendanceRecords,
  initialAssignments,
  initialSubmissions,
  initialFeeRecords,
  initialAnnouncements,
  initialTestResults,
  initialDoubts,
  initialResources,
  initialNotifications,
  initialRooms,
  initialScheduleSlots,
  initialParentLinkCode,
  initialLinkedParents,
  initialLinkedChildren,
  initialSchoolInfo,
  initialSchoolMembers
} from '../data/devSeedData';


const TuitionContext = createContext<TuitionContextType | undefined>(undefined);

export const TuitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state: detect system preferences using window.matchMedia('(prefers-color-scheme: dark)') on initial application load
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tuition_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return isSystemDark ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('tuition_theme', theme);
  }, [theme]);

  // Listen for system theme preference updates dynamically when no manual override exists
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('tuition_theme');
      if (!saved) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener?.('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener?.('change', handleSystemThemeChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Auth state
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [role, setRoleState] = useState<UserRole>('STUDENT');

  // Firestore live collections state
  const [batches, setBatches] = useState<CourseBatch[]>(import.meta.env.DEV ? initialBatches : []);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(import.meta.env.DEV ? initialAttendanceRecords : []);
  const [assignments, setAssignments] = useState<Assignment[]>(import.meta.env.DEV ? initialAssignments : []);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(import.meta.env.DEV ? initialSubmissions : []);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>(import.meta.env.DEV ? initialFeeRecords : []);
  const [announcements, setAnnouncements] = useState<Announcement[]>(import.meta.env.DEV ? initialAnnouncements : []);
  const [testResults, setTestResults] = useState<TestResult[]>(import.meta.env.DEV ? initialTestResults : []);
  const [doubts, setDoubts] = useState<StudentDoubt[]>(import.meta.env.DEV ? initialDoubts : []);
  const [resources, setResources] = useState<EducationalResource[]>(import.meta.env.DEV ? initialResources : []);
  const [notifications, setNotifications] = useState<StudentNotification[]>(import.meta.env.DEV ? initialNotifications : []);
  const [rooms, setRooms] = useState<ClassroomRoom[]>(import.meta.env.DEV ? initialRooms : []);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>(import.meta.env.DEV ? initialScheduleSlots : []);
  const [parentLinkCode, setParentLinkCode] = useState<ParentLinkCode | null>(initialParentLinkCode);
  const [linkedParents, setLinkedParents] = useState<LinkedParent[]>(initialLinkedParents);
  const [linkedChildren, setLinkedChildren] = useState<ChildProfile[]>(initialLinkedChildren);
  const [activeChildId, setActiveChildId] = useState<string>('s1');
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(initialSchoolInfo);
  const [schoolMembers, setSchoolMembers] = useState<SchoolMember[]>(initialSchoolMembers);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);

  const [latestNotificationToast, setLatestNotificationToast] = useState<StudentNotification | null>(null);
  const seedingInProgress = useRef(false);

  // Set role wrapper
  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (currentUser && userProfile) {
      setUserProfile((prev) => (prev ? { ...prev, role: newRole } : prev));
      updateDoc(doc(db, 'users', currentUser.uid), { role: newRole }).catch((err) => {
        console.warn('Could not persist updated role to Firestore user doc:', err);
      });
    }
  };

  // Seed initial demo data once to Firestore if school_info/sch-1 does not exist (DEV mode only)
  const seedDemoDataOnce = async () => {
    if (!import.meta.env.DEV) return;
    if (seedingInProgress.current) return;
    seedingInProgress.current = true;
    try {
      const schoolRef = doc(db, 'school_info', 'sch-1');
      const schoolSnap = await getDoc(schoolRef);

      if (!schoolSnap.exists()) {
        console.log('Seeding initial demo data to Firestore for Apex Academy...');
        const batch = writeBatch(db);

        // 1. School Info
        batch.set(schoolRef, initialSchoolInfo);

        // 2. Batches
        initialBatches.forEach((b) => {
          batch.set(doc(db, 'batches', b.id), b);
        });

        // 3. Rooms
        initialRooms.forEach((r) => {
          batch.set(doc(db, 'rooms', r.id), r);
        });

        // 4. Schedule Slots
        initialScheduleSlots.forEach((s) => {
          batch.set(doc(db, 'schedule_slots', s.id), s);
        });

        // 5. School Members
        initialSchoolMembers.forEach((m) => {
          batch.set(doc(db, 'school_members', m.id), m);
        });

        await batch.commit();

        // Secondary batches for larger sets
        const batch2 = writeBatch(db);
        initialAttendanceRecords.forEach((a) => {
          batch2.set(doc(db, 'attendance', a.id), a);
        });
        initialAssignments.forEach((asg) => {
          batch2.set(doc(db, 'assignments', asg.id), asg);
        });
        initialSubmissions.forEach((sub) => {
          batch2.set(doc(db, 'submissions', sub.id), sub);
        });
        initialFeeRecords.forEach((f) => {
          batch2.set(doc(db, 'fees', f.invoiceId), f);
        });
        await batch2.commit();

        const batch3 = writeBatch(db);
        initialAnnouncements.forEach((ann) => {
          batch3.set(doc(db, 'announcements', ann.id), ann);
        });
        initialDoubts.forEach((d) => {
          batch3.set(doc(db, 'doubts', d.id), d);
        });
        initialResources.forEach((res) => {
          batch3.set(doc(db, 'resources', res.id), res);
        });
        initialNotifications.forEach((n) => {
          batch3.set(doc(db, 'notifications', n.id), n);
        });
        initialTestResults.forEach((t) => {
          batch3.set(doc(db, 'test_results', t.id), t);
        });
        await batch3.commit();
        console.log('Demo data successfully seeded to Firestore.');

        // Generate school join codes server-side on creation and store in school_secrets
        try {
          const generated = await callRegenerateSchoolCodes('both');
          if (generated?.studentCode && generated?.teacherCode) {
            await setDoc(doc(db, 'school_secrets', 'sch-1'), {
              studentCode: generated.studentCode,
              teacherCode: generated.teacherCode,
              updatedAt: new Date().toISOString()
            });
            setSchoolInfo((prev) => ({
              ...prev,
              studentCode: generated.studentCode,
              teacherCode: generated.teacherCode
            }));
          }
        } catch (codeErr) {
          console.warn('Initial school codes generation note:', codeErr);
        }
      }
    } catch (err) {
      console.warn('Initial demo seeding skipped or handled:', err);
    } finally {
      seedingInProgress.current = false;
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Fetch user profile from Firestore doc
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile(data);
            if (data.role) {
              setRoleState(data.role);
            }
          } else {
            // First time user document setup
            const fallbackRole: UserRole = user.email?.includes('teacher')
              ? 'TEACHER'
              : user.email?.includes('parent')
              ? 'PARENT'
              : user.email?.includes('admin')
              ? 'ADMIN'
              : 'STUDENT';

            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              fullName: user.displayName || user.email?.split('@')[0] || 'User',
              role: fallbackRole,
              schoolId: 'sch-1',
              studentId: fallbackRole === 'STUDENT' ? 's1' : undefined,
              teacherId: fallbackRole === 'TEACHER' ? 't1' : undefined,
              parentId: fallbackRole === 'PARENT' ? 'p1' : undefined,
              linkedChildIds: fallbackRole === 'PARENT' ? ['s1', 's2'] : [],
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
            setRoleState(fallbackRole);
          }
        } catch (err) {
          console.error('Error fetching/creating user doc in Firestore:', err);
        }

        // Seed initial school demo data if in DEV mode
        if (import.meta.env.DEV) {
          seedDemoDataOnce();
        }
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Set up Real-time Listeners across scoped Firestore collections
  useEffect(() => {
    if (!currentUser) return;

    const unsubs: (() => void)[] = [];
    const isTeacherOrAdmin = userProfile?.role === 'TEACHER' || userProfile?.role === 'ADMIN';
    const isParent = userProfile?.role === 'PARENT';
    const currentStudentId = userProfile?.studentId || currentUser.uid;
    const targetStudentId = isParent ? activeChildId : currentStudentId;

    const enrolledBatchIds = userProfile?.enrolledBatchIds || ['b1'];
    const batchChunk = enrolledBatchIds.slice(0, 10);

    // 1. User doc listener
    const userDocRef = doc(db, 'users', currentUser.uid);
    unsubs.push(
      onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile(data);
            if (data.role) {
              setRoleState(data.role);
            }
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`)
      )
    );

    // 2. Batches
    if (isTeacherOrAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'batches'),
          (snap) => {
            setBatches(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CourseBatch)));
          },
          (err) => handleFirestoreError(err, OperationType.GET, 'batches')
        )
      );
    } else {
      if (batchChunk.length > 0) {
        unsubs.push(
          onSnapshot(
            query(collection(db, 'batches'), where('__name__', 'in', batchChunk)),
            (snap) => {
              setBatches(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CourseBatch)));
            },
            (err) => handleFirestoreError(err, OperationType.GET, 'batches')
          )
        );
      } else {
        setBatches([]);
      }
    }

    // 3. Attendance - Scoped to student/child with limit(50) for students/parents; limit(100) for faculty
    const attQuery = isTeacherOrAdmin
      ? query(collection(db, 'attendance'), limit(100))
      : query(collection(db, 'attendance'), where('studentId', '==', targetStudentId), limit(50));
    unsubs.push(
      onSnapshot(
        attQuery,
        (snap) => {
          setAttendanceRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord)));
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'attendance')
      )
    );

    // 4. Assignments - Scoped to enrolled batch for students/parents
    if (isTeacherOrAdmin) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'assignments'), limit(100)),
          (snap) => {
            setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment)));
          },
          (err) => handleFirestoreError(err, OperationType.GET, 'assignments')
        )
      );
    } else {
      if (batchChunk.length > 0) {
        unsubs.push(
          onSnapshot(
            query(collection(db, 'assignments'), where('batchId', 'in', batchChunk)),
            (snap) => {
              setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment)));
            },
            (err) => handleFirestoreError(err, OperationType.GET, 'assignments')
          )
        );
      } else {
        setAssignments([]);
      }
    }

    // 5. Submissions - Scoped to student/child for students/parents; all for faculty
    const subQuery = isTeacherOrAdmin
      ? collection(db, 'submissions')
      : query(collection(db, 'submissions'), where('studentId', '==', targetStudentId));
    unsubs.push(
      onSnapshot(
        subQuery,
        (snap) => {
          setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudentSubmission)));
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'submissions')
      )
    );

    // 6. Fees - Scoped to student/child for students/parents; all for faculty
    const feesQuery = isTeacherOrAdmin
      ? collection(db, 'fees')
      : query(collection(db, 'fees'), where('studentId', '==', targetStudentId));
    unsubs.push(
      onSnapshot(
        feesQuery,
        (snap) => {
          setFeeRecords(snap.docs.map((d) => ({ invoiceId: d.id, ...d.data() } as FeeRecord)));
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'fees')
      )
    );

    // 7. Announcements - Scoped to ALL or enrolled batch
    if (isTeacherOrAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'announcements'),
          (snap) => {
            setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement)));
          },
          (err) => handleFirestoreError(err, OperationType.GET, 'announcements')
        )
      );
    } else {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'announcements'), where('batchId', '==', 'ALL')),
          (snap) => {
            setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement)));
          },
          (err) => handleFirestoreError(err, OperationType.GET, 'announcements')
        )
      );
    }

    // 8. Doubts - Scoped: students read only their own; teachers/admins all
    const doubtsQuery = isTeacherOrAdmin
      ? collection(db, 'doubts')
      : query(collection(db, 'doubts'), where('studentId', '==', currentStudentId));
    unsubs.push(
      onSnapshot(
        doubtsQuery,
        (snap) => {
          setDoubts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudentDoubt)));
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'doubts')
      )
    );

    // 9. Resources - Scoped to ALL or enrolled batch
    if (isTeacherOrAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'resources'),
          (snap) => {
            setResources(snap.docs.map((d) => ({ id: d.id, ...d.data() } as EducationalResource)));
          },
          (err) => handleFirestoreError(err, OperationType.GET, 'resources')
        )
      );
    } else {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'resources'), where('batchId', '==', 'ALL')),
          (snap) => {
            setResources(snap.docs.map((d) => ({ id: d.id, ...d.data() } as EducationalResource)));
          },
          (err) => handleFirestoreError(err, OperationType.GET, 'resources')
        )
      );
    }

    // 10. Notifications - Query with recipient/role constraints + limit(30)
    if (isTeacherOrAdmin) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'notifications'), limit(30)),
          (snap) => {
            setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudentNotification)));
          },
          (err) => handleFirestoreError(err, OperationType.GET, 'notifications')
        )
      );
    } else {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'notifications'), where('targetRole', 'in', ['ALL', userProfile?.role || 'STUDENT']), limit(30)),
          (snap) => {
            setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudentNotification)));
          },
          (err) => handleFirestoreError(err, OperationType.GET, 'notifications')
        )
      );
    }

    // 11. Rooms - Static infrastructure
    if (isTeacherOrAdmin) {
      getDocs(collection(db, 'rooms'))
        .then((snap) => {
          setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassroomRoom)));
        })
        .catch((err) => console.warn('Rooms getDocs notice:', err));
    } else {
      if (batchChunk.length > 0) {
        unsubs.push(
          onSnapshot(
            query(collection(db, 'rooms'), where('batchIds', 'array-contains-any', batchChunk)),
            (snap) => {
              setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassroomRoom)));
            },
            (err) => handleFirestoreError(err, OperationType.GET, 'rooms')
          )
        );
      } else {
        setRooms([]);
      }
    }

    // 12. Schedule slots
    if (isTeacherOrAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'schedule_slots'),
          (snap) => {
            setScheduleSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScheduleSlot)));
          },
          (err) => handleFirestoreError(err, OperationType.GET, 'schedule_slots')
        )
      );
    } else {
      if (batchChunk.length > 0) {
        unsubs.push(
          onSnapshot(
            query(collection(db, 'schedule_slots'), where('batchId', 'in', batchChunk)),
            (snap) => {
              setScheduleSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScheduleSlot)));
            },
            (err) => handleFirestoreError(err, OperationType.GET, 'schedule_slots')
          )
        );
      } else {
        setScheduleSlots([]);
      }
    }

    // 13. Test Results - Scoped to student/child for students/parents; all for faculty
    const testQuery = isTeacherOrAdmin
      ? collection(db, 'test_results')
      : query(collection(db, 'test_results'), where('studentId', '==', targetStudentId));
    unsubs.push(
      onSnapshot(
        testQuery,
        (snap) => {
          setTestResults(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TestResult)));
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'test_results')
      )
    );

    // 14. School Info - Institutional public name and counts
    unsubs.push(
      onSnapshot(
        doc(db, 'school_info', 'sch-1'),
        (snap) => {
          if (snap.exists()) {
            setSchoolInfo((prev) => ({
              ...prev,
              ...(snap.data() as Partial<SchoolInfo>)
            }));
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'school_info/sch-1')
      )
    );

    // 14b. School Secrets - Join codes (studentCode, teacherCode) readable ONLY by faculty
    if (isTeacherOrAdmin) {
      unsubs.push(
        onSnapshot(
          doc(db, 'school_secrets', 'sch-1'),
          (snap) => {
            if (snap.exists()) {
              const sec = snap.data();
              setSchoolInfo((prev) => ({
                ...prev,
                studentCode: sec.studentCode,
                teacherCode: sec.teacherCode
              }));
            }
          },
          (err) => console.warn('school_secrets listener warning:', err)
        )
      );
    }

    // 15. School Members - Teachers and admins read all; non-faculty do not list
    if (isTeacherOrAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'school_members'),
          (snap) => {
            setSchoolMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SchoolMember)));
          },
          (err) => handleFirestoreError(err, OperationType.GET, 'school_members')
        )
      );
    }

    // 16. Parent Links - Students read only their own codes; faculty all; parents do not list
    if (isTeacherOrAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'parent_links'),
          (snap) => {
            const firstActive = snap.docs.find((d) => !d.data().used);
            if (firstActive) {
              setParentLinkCode(firstActive.data() as ParentLinkCode);
            } else {
              setParentLinkCode(null);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, 'parent_links')
        )
      );
    } else if (userProfile?.role === 'STUDENT') {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'parent_links'), where('studentId', '==', currentStudentId)),
          (snap) => {
            const firstActive = snap.docs.find((d) => !d.data().used);
            if (firstActive) {
              setParentLinkCode(firstActive.data() as ParentLinkCode);
            } else {
              setParentLinkCode(null);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, 'parent_links')
        )
      );
    }

    // 17. Notification & Message Logs - Faculty only, capped to latest 50
    if (isTeacherOrAdmin) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'notification_logs'), limit(50)),
          (snap) => {
            const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationLog));
            logs.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
            setNotificationLogs(logs);
          },
          (err) => console.warn('notification_logs listener warning:', err)
        )
      );
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [currentUser, userProfile?.role, userProfile?.enrolledBatchIds, activeChildId]);

  // Dynamic user profiles based on authenticated user
  const currentStudent: StudentProfile = {
    id: userProfile?.studentId || 's1',
    name: userProfile?.role === 'STUDENT' && userProfile.fullName ? userProfile.fullName : 'Aravind Kumar',
    grade: 'Grade 10',
    section: 'State Board Batch A',
    guardianName: userProfile?.guardianName || 'Kumar Raman',
    guardianPhone: userProfile?.guardianPhone || '+91 98765 43210',
    enrolledCourses: ['Grade 10 Mathematics', 'Physics Fundamentals', 'Chemistry & Reactions', 'Biology & Life Systems'],
    overallAttendancePercent: 91.4
  };

  const currentTeacher: TeacherProfile = {
    id: userProfile?.teacherId || 't1',
    name:
      (userProfile?.role === 'TEACHER' || userProfile?.role === 'ADMIN') && userProfile.fullName
        ? userProfile.fullName
        : 'Mr. Kingslin',
    subjects: ['Mathematics', 'Advanced Calculus', 'Science Foundation'],
    assignedBatches: ['Grade 10 Mathematics', 'Physics Fundamentals', 'Chemistry & Reactions', 'Biology & Life Systems'],
    email: userProfile?.email || 'teacher@apex.edu',
    phone: userProfile?.phone || '+91 98765 12345'
  };

  const currentParent = {
    id: userProfile?.parentId || 'p1',
    fullName: userProfile?.role === 'PARENT' && userProfile.fullName ? userProfile.fullName : 'Kumar Raman (Parent)',
    email: userProfile?.email || 'parent@apex.edu'
  };

  // Auth Operations
  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return { success: true };
    } catch (err: unknown) {
      const code = (err as any)?.code || '';
      const rawMsg = err instanceof Error ? err.message : 'Login failed.';
      let msg = rawMsg;
      if (code === 'auth/operation-not-allowed' || rawMsg.includes('operation-not-allowed')) {
        msg = 'Firebase Email/Password Sign-In is disabled in your Firebase Console. Please go to Firebase Console > Authentication > Sign-in method and enable Email/Password.';
      } else if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please verify your credentials or sign up.';
      }
      return { success: false, error: msg };
    }
  };

  const signupWithEmail = async (
    email: string,
    pass: string,
    fullName: string,
    signupRole: UserRole,
    joinCode?: string
  ): Promise<{ success: boolean; error?: string; requiresRetry?: boolean; pendingRole?: UserRole }> => {
    let createdUser: FirebaseUser | null = null;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      createdUser = cred.user;

      // Self-create in Firestore strictly as STUDENT to conform to firestore.rules
      const initialProfile: UserProfile = {
        uid: createdUser.uid,
        email: createdUser.email || email,
        fullName,
        role: 'STUDENT',
        schoolId: 'sch-1',
        studentId: `s-${createdUser.uid.slice(0, 8)}`,
        linkedChildIds: [],
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', createdUser.uid), initialProfile);
      setUserProfile(initialProfile);
      setRoleState('STUDENT');

      // Finish role setup via server endpoints with verified ID token
      if (signupRole === 'TEACHER') {
        if (!joinCode || !joinCode.trim()) {
          return {
            success: false,
            error: 'Teacher join code is required to verify faculty access.',
            requiresRetry: true,
            pendingRole: 'TEACHER'
          };
        }
        const verifyRes = await apiJoinSchoolAsTeacher(joinCode.trim(), fullName);
        if (!verifyRes.success) {
          return {
            success: false,
            error: verifyRes.error || 'Invalid teacher join code.',
            requiresRetry: true,
            pendingRole: 'TEACHER'
          };
        }
        setRoleState('TEACHER');
        setUserProfile((prev) => (prev ? { ...prev, role: 'TEACHER', teacherId: `t-${createdUser!.uid.slice(0, 8)}` } : prev));
      } else if (signupRole === 'PARENT') {
        if (!joinCode || !joinCode.trim()) {
          return {
            success: false,
            error: 'Parent link code generated by student is required.',
            requiresRetry: true,
            pendingRole: 'PARENT'
          };
        }
        const linkRes = await apiLinkChildWithCode(joinCode.trim(), createdUser.uid);
        if (!linkRes.success) {
          return {
            success: false,
            error: linkRes.message || linkRes.error || 'Failed to validate parent link code.',
            requiresRetry: true,
            pendingRole: 'PARENT'
          };
        }
        setRoleState('PARENT');
        setUserProfile((prev) => (prev ? {
          ...prev,
          role: 'PARENT',
          parentId: createdUser!.uid,
          linkedChildIds: linkRes.child ? [linkRes.child.id] : []
        } : prev));
        if (linkRes.child) {
          setLinkedChildren([linkRes.child]);
          setActiveChildId(linkRes.child.id);
        }
      } else if (signupRole === 'STUDENT' && joinCode?.trim()) {
        await apiJoinSchoolAsStudent(joinCode.trim(), fullName);
      }

      return { success: true };
    } catch (err: unknown) {
      const code = (err as any)?.code || '';
      const rawMsg = err instanceof Error ? err.message : 'Sign up failed.';
      let msg = rawMsg;
      if (code === 'auth/operation-not-allowed' || rawMsg.includes('operation-not-allowed')) {
        msg = 'Firebase Email/Password Sign-In is disabled in your Firebase Console. Please go to Firebase Console > Authentication > Sign-in method and enable Email/Password.';
      } else if (code === 'auth/email-already-in-use') {
        msg = 'This email address is already registered. Please sign in instead.';
      }
      return { success: false, error: msg };
    }
  };

  const retryRoleVerification = async (
    role: UserRole,
    code: string,
    fullName: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!auth.currentUser) {
      return { success: false, error: 'User is not authenticated.' };
    }
    const uid = auth.currentUser.uid;

    if (role === 'TEACHER') {
      const res = await apiJoinSchoolAsTeacher(code.trim(), fullName);
      if (!res.success) {
        return { success: false, error: res.error || 'Invalid teacher code.' };
      }
      setRoleState('TEACHER');
      setUserProfile((prev) => (prev ? { ...prev, role: 'TEACHER', teacherId: `t-${uid.slice(0, 8)}` } : prev));
      return { success: true };
    }

    if (role === 'PARENT') {
      const res = await apiLinkChildWithCode(code.trim(), uid);
      if (!res.success) {
        return { success: false, error: res.message || res.error || 'Invalid parent link code.' };
      }
      setRoleState('PARENT');
      setUserProfile((prev) => (prev ? {
        ...prev,
        role: 'PARENT',
        parentId: uid,
        linkedChildIds: res.child ? [res.child.id] : []
      } : prev));
      if (res.child) {
        setLinkedChildren([res.child]);
        setActiveChildId(res.child.id);
      }
      return { success: true };
    }

    return { success: true };
  };

  const cancelSignupAndCleanup = async (): Promise<void> => {
    if (!auth.currentUser) return;
    try {
      const uid = auth.currentUser.uid;
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch {
        // Ignore if already deleted
      }
      await deleteUser(auth.currentUser);
    } catch (err) {
      console.warn('Failed to cleanup unverified user:', err);
      await firebaseSignOut(auth);
    } finally {
      setUserProfile(null);
      setCurrentUser(null);
    }
  };

  const quickDemoLogin = async (targetRole: UserRole) => {
    const demoCredentials: Record<UserRole, { email: string; pass: string; name: string }> = {
      STUDENT: { email: 'student@apex.edu', pass: 'student123', name: 'Aravind Kumar' },
      TEACHER: { email: 'teacher@apex.edu', pass: 'teacher123', name: 'Mr. Kingslin' },
      PARENT: { email: 'parent@apex.edu', pass: 'parent123', name: 'Kumar Raman' },
      ADMIN: { email: 'admin@apex.edu', pass: 'admin123', name: 'Apex Administrator' }
    };

    const cred = demoCredentials[targetRole];
    try {
      await signInWithEmailAndPassword(auth, cred.email, cred.pass);
    } catch (signInErr: any) {
      const signInCode = signInErr?.code || '';
      const signInMsg = signInErr?.message || '';

      if (signInCode === 'auth/operation-not-allowed' || signInMsg.includes('operation-not-allowed')) {
        throw new Error(
          'Firebase Email/Password Sign-In is disabled in your Firebase Console. Please enable Email/Password under Firebase Console > Authentication > Sign-in method.'
        );
      }

      // If user does not exist yet, attempt to create them with demo data
      try {
        const userCred = await createUserWithEmailAndPassword(auth, cred.email, cred.pass);
        const profile: UserProfile = {
          uid: userCred.user.uid,
          email: cred.email,
          fullName: cred.name,
          role: targetRole,
          schoolId: 'sch-1',
          studentId: targetRole === 'STUDENT' ? 's1' : undefined,
          teacherId: targetRole === 'TEACHER' ? 't1' : undefined,
          parentId: targetRole === 'PARENT' ? 'p1' : undefined,
          linkedChildIds: targetRole === 'PARENT' ? ['s1', 's2'] : [],
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', userCred.user.uid), profile);
        setUserProfile(profile);
        setRoleState(targetRole);
      } catch (createErr: any) {
        const createCode = createErr?.code || '';
        const createMsg = createErr?.message || '';

        if (createCode === 'auth/operation-not-allowed' || createMsg.includes('operation-not-allowed')) {
          throw new Error(
            'Firebase Email/Password Sign-In is disabled in your Firebase Console. Please enable Email/Password under Firebase Console > Authentication > Sign-in method.'
          );
        }

        console.error('Failed to auto-create demo user:', createErr);
        throw createErr;
      }
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  };

  // Batches
  const addBatch = async (batchData: Omit<CourseBatch, 'id'>) => {
    const newBatchId = `b-${Date.now()}`;
    const newBatch: CourseBatch = {
      ...batchData,
      id: newBatchId
    };
    setBatches((prev) => [...prev, newBatch]);

    try {
      await setDoc(doc(db, 'batches', newBatchId), newBatch);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `batches/${newBatchId}`);
    }

    addNotification({
      type: 'GENERAL',
      title: `New Subject Class: ${newBatch.title}`,
      message: `${newBatch.subject} · ${newBatch.scheduleTime} (${newBatch.days.join(', ')}). Location: ${newBatch.roomOrMeetingLink}`,
      targetBatchTitle: newBatch.title,
      referenceId: newBatch.id,
      actionScreen: 'CALENDAR',
      authorName: newBatch.teacherName || currentTeacher.name
    });
  };

  const parseTimeToMinutes = (timeStr: string): number => {
    const parts = timeStr.split(':').map((v) => parseInt(v, 10));
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  };

  const checkRoomAvailability = (
    roomId: string,
    day: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeSlotId?: string
  ): { isAvailable: boolean; conflictingSlot?: ScheduleSlot } => {
    const newStart = parseTimeToMinutes(startTime);
    const newEnd = parseTimeToMinutes(endTime);

    for (const slot of scheduleSlots) {
      if (excludeSlotId && slot.id === excludeSlotId) continue;
      if (slot.roomId === roomId && slot.day === day) {
        const slotStart = parseTimeToMinutes(slot.startTime);
        const slotEnd = parseTimeToMinutes(slot.endTime);

        if (newStart < slotEnd && newEnd > slotStart) {
          return { isAvailable: false, conflictingSlot: slot };
        }
      }
    }
    return { isAvailable: true };
  };

  const addScheduleSlot = async (slotData: Omit<ScheduleSlot, 'id'>) => {
    const slotId = `slot-${Date.now()}`;
    const newSlot: ScheduleSlot = {
      ...slotData,
      id: slotId
    };
    setScheduleSlots((prev) => [newSlot, ...prev]);

    try {
      await setDoc(doc(db, 'schedule_slots', slotId), newSlot);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `schedule_slots/${slotId}`);
    }

    addNotification({
      type: 'GENERAL',
      title: `Class Scheduled: ${newSlot.batchTitle}`,
      message: `${newSlot.subject} scheduled for ${newSlot.day} ${newSlot.displayTime} at ${newSlot.roomName}.`,
      targetBatchTitle: newSlot.batchTitle,
      referenceId: newSlot.id,
      actionScreen: 'CALENDAR',
      authorName: currentTeacher.name
    });
  };

  const updateScheduleSlot = async (id: string, updates: Partial<ScheduleSlot>) => {
    setScheduleSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    try {
      await updateDoc(doc(db, 'schedule_slots', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `schedule_slots/${id}`);
    }
  };

  const deleteScheduleSlot = async (id: string) => {
    setScheduleSlots((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, 'schedule_slots', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `schedule_slots/${id}`);
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.warn('Could not mark notification as read in Firestore:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const batch = writeBatch(db);
      notifications.filter((n) => !n.read).forEach((n) => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.warn('Could not mark all notifications as read in Firestore:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.warn('Could not delete notification in Firestore:', err);
    }
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit();
    } catch (err) {
      console.warn('Could not clear notifications in Firestore:', err);
    }
  };

  const addNotification = async (notif: Omit<StudentNotification, 'id' | 'timestamp' | 'read'>) => {
    const notifId = `notif-${Date.now()}`;
    const newNotif: StudentNotification = {
      ...notif,
      id: notifId,
      timestamp: 'Just now',
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setLatestNotificationToast(newNotif);

    try {
      await setDoc(doc(db, 'notifications', notifId), newNotif);
    } catch (err) {
      console.warn('Could not save notification to Firestore:', err);
    }

    setTimeout(() => {
      setLatestNotificationToast((curr) => (curr?.id === newNotif.id ? null : curr));
    }, 6000);
  };

  const dismissToast = () => {
    setLatestNotificationToast(null);
  };

  const markAttendance = async (request: MarkAttendanceRequest) => {
    setAttendanceRecords((prev) => {
      const newIds = new Set(request.records.map((r) => `${r.batchId}-${r.studentId}-${r.date}`));
      const filtered = prev.filter((r) => !newIds.has(`${r.batchId}-${r.studentId}-${r.date}`));
      return [...request.records, ...filtered];
    });

    try {
      const batch = writeBatch(db);
      request.records.forEach((record) => {
        const id = record.id || `${record.batchId}-${record.studentId}-${record.date}`;
        batch.set(doc(db, 'attendance', id), { ...record, id });
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'attendance');
    }
  };

  const addAssignment = async (assignmentData: Omit<Assignment, 'id'>) => {
    const asgId = `as-${Date.now()}`;
    const newAssignment: Assignment = {
      ...assignmentData,
      id: asgId,
      submissionsCount: 0
    };
    setAssignments((prev) => [newAssignment, ...prev]);

    try {
      await setDoc(doc(db, 'assignments', asgId), newAssignment);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `assignments/${asgId}`);
    }

    const targetBatch = batches.find((b) => b.id === assignmentData.batchId);
    const batchTitle = targetBatch ? targetBatch.title : 'All Batches';

    addNotification({
      type: 'HOMEWORK_POSTED',
      title: `New Homework: ${assignmentData.title}`,
      message: `${assignmentData.subject ? `${assignmentData.subject} · ` : ''}Due: ${assignmentData.dueDate}. Maximum marks: ${assignmentData.maxScore}.`,
      targetBatchTitle: batchTitle,
      referenceId: newAssignment.id,
      actionScreen: 'ASSIGNMENTS',
      authorName: currentTeacher.name
    });

    // Broadcast FCM Push for homework
    dispatchFcmPush({
      title: `New Homework: ${assignmentData.title}`,
      body: `${assignmentData.subject ? `${assignmentData.subject} · ` : ''}Due: ${assignmentData.dueDate}. Max score: ${assignmentData.maxScore}.`,
      messageType: 'HOMEWORK',
      targetRole: 'STUDENT',
      batchId: assignmentData.batchId,
      batchTitle
    }).catch((e) => console.warn('FCM homework push note:', e));
  };

  const submitAssignment = async (
    assignmentId: string,
    note?: string,
    answerSheetFile?: string,
    answerSheetSize?: string,
    answerSheetUrl?: string
  ) => {
    const now = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const defaultAnswerFile = `${currentStudent.name.replace(/\s+/g, '_')}_AnswerSheet.pdf`;
    const finalAnswerSheetFile = answerSheetFile || defaultAnswerFile;
    const finalAnswerSheetSize = answerSheetSize || '2.4 MB · 5 pages';

    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              isSubmitted: true,
              submissionNote: note || 'Submitted via Student Portal',
              submissionDate: now,
              answerSheetFile: finalAnswerSheetFile,
              answerSheetSize: finalAnswerSheetSize,
              answerSheetUrl: answerSheetUrl || a.answerSheetUrl,
              submissionsCount: (a.submissionsCount || 0) + 1
            }
          : a
      )
    );

    const subId = `sub-${Date.now()}`;
    const newSub: StudentSubmission = {
      id: subId,
      assignmentId,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      submittedAt: 'Just now',
      content: note || 'Completed all exercises.',
      scoreEarned: null,
      status: 'SUBMITTED',
      answerSheetFile: finalAnswerSheetFile,
      answerSheetSize: finalAnswerSheetSize,
      answerSheetUrl: answerSheetUrl || undefined
    };
    setSubmissions((prev) => [newSub, ...prev]);

    try {
      await setDoc(doc(db, 'submissions', subId), newSub);
      await updateDoc(doc(db, 'assignments', assignmentId), {
        isSubmitted: true,
        submissionNote: note || 'Submitted via Student Portal',
        submissionDate: now,
        answerSheetFile: finalAnswerSheetFile,
        answerSheetSize: finalAnswerSheetSize,
        ...(answerSheetUrl ? { answerSheetUrl } : {})
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `submissions/${subId}`);
    }
  };

  const gradeSubmission = async (submissionId: string, score: number, feedback: string) => {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === submissionId) {
          return {
            ...s,
            scoreEarned: score,
            teacherFeedback: feedback,
            status: 'GRADED',
            evaluatedAt: 'Just now'
          };
        }
        return s;
      })
    );

    const sub = submissions.find((s) => s.id === submissionId);
    if (sub) {
      setAssignments((aPrev) =>
        aPrev.map((a) =>
          a.id === sub.assignmentId
            ? { ...a, scoreEarned: score, teacherFeedback: feedback }
            : a
        )
      );
    }

    try {
      await updateDoc(doc(db, 'submissions', submissionId), {
        scoreEarned: score,
        teacherFeedback: feedback,
        status: 'GRADED',
        evaluatedAt: 'Just now'
      });
      if (sub) {
        await updateDoc(doc(db, 'assignments', sub.assignmentId), {
          scoreEarned: score,
          teacherFeedback: feedback
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `submissions/${submissionId}`);
    }
  };

  const payFee = async (
    invoiceId: string,
    paymentMethod = 'UPI / Desk Collection',
    paymentId?: string
  ) => {
    const nowStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const targetFee = feeRecords.find((f) => f.invoiceId === invoiceId);
    if (!targetFee) {
      throw new Error(`Invoice #${invoiceId} not found.`);
    }
    const amount = targetFee.amountDue;

    setFeeRecords((prev) =>
      prev.map((f) =>
        f.invoiceId === invoiceId
          ? {
              ...f,
              status: 'PAID',
              amountPaid: f.amountDue,
              paymentMethod,
              paidAt: nowStr,
              paymentId: paymentId || f.paymentId,
              approvalStatus: 'APPROVED',
              manualPaymentClaimed: false
            }
          : f
      )
    );

    try {
      await updateDoc(doc(db, 'fees', invoiceId), {
        status: 'PAID',
        amountPaid: amount,
        paymentMethod,
        paidAt: nowStr,
        approvalStatus: 'APPROVED',
        manualPaymentClaimed: false,
        ...(paymentId ? { paymentId } : {})
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `fees/${invoiceId}`);
    }
  };

  const submitManualPayment = async (invoiceId: string, utr: string) => {
    const nowStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const targetFee = feeRecords.find((f) => f.invoiceId === invoiceId);
    if (!targetFee) {
      throw new Error(`Invoice #${invoiceId} not found.`);
    }
    const cleanUtr = utr.trim();

    setFeeRecords((prev) =>
      prev.map((f) =>
        f.invoiceId === invoiceId
          ? {
              ...f,
              status: 'PENDING_APPROVAL',
              approvalStatus: 'PENDING_APPROVAL',
              utrNumber: cleanUtr,
              submittedUtrAt: nowStr,
              manualPaymentClaimed: true,
              manualPaymentUtr: cleanUtr,
              manualPaymentSubmittedAt: nowStr,
              paymentMethod: `UPI Transfer (UTR: ${cleanUtr})`
            }
          : f
      )
    );

    try {
      await updateDoc(doc(db, 'fees', invoiceId), {
        status: 'PENDING_APPROVAL',
        approvalStatus: 'PENDING_APPROVAL',
        utrNumber: cleanUtr,
        submittedUtrAt: nowStr,
        manualPaymentClaimed: true,
        manualPaymentUtr: cleanUtr,
        manualPaymentSubmittedAt: nowStr,
        paymentMethod: `UPI Transfer (UTR: ${cleanUtr})`
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `fees/${invoiceId}`);
    }

    addNotification({
      type: 'GENERAL',
      title: 'UPI Payment Claim Submitted (Pending Approval)',
      message: `UTR #${cleanUtr} submitted for Invoice #${invoiceId}. Faculty verification is pending.`,
      targetBatchTitle: targetFee?.monthYear || 'Fee Desk',
      referenceId: invoiceId,
      actionScreen: 'FEES',
      authorName: targetFee?.studentName || 'Student'
    });
  };

  const approveManualPayment = async (invoiceId: string) => {
    const nowStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const targetFee = feeRecords.find((f) => f.invoiceId === invoiceId);
    if (!targetFee) {
      throw new Error(`Invoice #${invoiceId} not found.`);
    }
    const amount = targetFee.amountDue;
    const utr = targetFee.utrNumber || targetFee.manualPaymentUtr || 'Verified';
    const finalMethod = `UPI Transfer (Approved · UTR: ${utr})`;
    const approverName = currentTeacher?.name || userProfile?.fullName || 'Faculty Admin';

    setFeeRecords((prev) =>
      prev.map((f) =>
        f.invoiceId === invoiceId
          ? {
              ...f,
              status: 'PAID',
              amountPaid: f.amountDue,
              paymentMethod: finalMethod,
              paidAt: nowStr,
              approvalStatus: 'APPROVED',
              approvedBy: approverName,
              approvedAt: nowStr,
              manualPaymentClaimed: false
            }
          : f
      )
    );

    try {
      await updateDoc(doc(db, 'fees', invoiceId), {
        status: 'PAID',
        amountPaid: amount,
        paymentMethod: finalMethod,
        paidAt: nowStr,
        approvalStatus: 'APPROVED',
        approvedBy: approverName,
        approvedAt: nowStr,
        manualPaymentClaimed: false
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `fees/${invoiceId}`);
    }

    addNotification({
      type: 'GENERAL',
      title: 'Tuition Fee Payment Approved',
      message: `Invoice #${invoiceId} has been verified and marked as PAID. Official receipt is available.`,
      targetBatchTitle: targetFee?.monthYear || 'Fee Desk',
      referenceId: invoiceId,
      actionScreen: 'FEES',
      authorName: approverName
    });
  };

  const rejectManualPayment = async (invoiceId: string) => {
    setFeeRecords((prev) =>
      prev.map((f) =>
        f.invoiceId === invoiceId
          ? {
              ...f,
              manualPaymentClaimed: false,
              manualPaymentUtr: undefined,
              approvalStatus: 'REJECTED'
            }
          : f
      )
    );

    try {
      await updateDoc(doc(db, 'fees', invoiceId), {
        status: 'PENDING',
        manualPaymentClaimed: false,
        manualPaymentUtr: null,
        approvalStatus: 'REJECTED'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `fees/${invoiceId}`);
    }
  };

  const addAnnouncement = async (item: Omit<Announcement, 'id' | 'timestamp'>) => {
    const annId = `ann-${Date.now()}`;
    const newAnnouncement: Announcement = {
      ...item,
      id: annId,
      timestamp: 'Just now'
    };
    setAnnouncements((prev) => [newAnnouncement, ...prev]);

    try {
      await setDoc(doc(db, 'announcements', annId), newAnnouncement);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `announcements/${annId}`);
    }

    // Broadcast FCM Push for announcements
    dispatchFcmPush({
      title: `Announcement: ${item.title}`,
      body: item.message,
      messageType: 'ANNOUNCEMENT',
      targetRole: 'ALL'
    }).catch((e) => console.warn('FCM announcement push note:', e));
  };

  const askDoubt = async (doubt: Omit<StudentDoubt, 'id' | 'askedAt' | 'isResolved'>) => {
    const dbtId = `dbt-${Date.now()}`;
    const newDoubt: StudentDoubt = {
      ...doubt,
      id: dbtId,
      askedAt: 'Just now',
      isResolved: false
    };
    setDoubts((prev) => [newDoubt, ...prev]);

    try {
      await setDoc(doc(db, 'doubts', dbtId), newDoubt);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `doubts/${dbtId}`);
    }
  };

  const replyDoubt = async (doubtId: string, reply: string) => {
    setDoubts((prev) =>
      prev.map((d) =>
        d.id === doubtId
          ? {
              ...d,
              reply,
              repliedBy: currentTeacher.name,
              repliedAt: 'Just now',
              isResolved: true
            }
          : d
      )
    );

    try {
      await updateDoc(doc(db, 'doubts', doubtId), {
        reply,
        repliedBy: currentTeacher.name,
        repliedAt: 'Just now',
        isResolved: true
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `doubts/${doubtId}`);
    }
  };

  const addResource = async (res: Omit<EducationalResource, 'id' | 'uploadedAt'>) => {
    const resId = `res-${Date.now()}`;
    const newRes: EducationalResource = {
      ...res,
      id: resId,
      uploadedAt: 'Just now'
    };
    setResources((prev) => [newRes, ...prev]);

    try {
      await setDoc(doc(db, 'resources', resId), newRes);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `resources/${resId}`);
    }

    addNotification({
      type: 'RESOURCE_ADDED',
      title: `New Material Shared: ${newRes.title}`,
      message: `${newRes.subject} · ${newRes.type} uploaded for ${newRes.batchTitle || 'All Batches'}. ${newRes.fileSizeOrDuration ? `(${newRes.fileSizeOrDuration})` : ''}`,
      targetBatchTitle: newRes.batchTitle || 'All Batches',
      referenceId: newRes.id,
      actionScreen: 'RESOURCES',
      authorName: newRes.authorName || currentTeacher.name
    });
  };

  const deleteResource = async (resourceId: string) => {
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
    try {
      await deleteDoc(doc(db, 'resources', resourceId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `resources/${resourceId}`);
    }
  };

  const createParentLinkCode = async (): Promise<ParentLinkCode> => {
    try {
      const newCode = await callCreateParentLinkCode(currentStudent.id, currentStudent.name);
      setParentLinkCode(newCode);
      return newCode;
    } catch (err) {
      console.error('Failed to create parent link code via cloud function:', err);
      throw new Error('Unable to generate link code. Server connection required.');
    }
  };

  const revokeParent = (parentId: string) => {
    setLinkedParents((prev) => prev.filter((p) => p.id !== parentId));
  };

  const linkChildWithCode = async (
    code: string
  ): Promise<{ success: boolean; message: string; child?: ChildProfile }> => {
    try {
      const parentId = currentUser?.uid || 'p1';
      const result = await callLinkChildWithCode(code, parentId, schoolInfo.name);

      if (result.success && result.child) {
        setLinkedChildren((prev) => {
          if (prev.some((c) => c.id === result.child!.id)) return prev;
          return [...prev, result.child!];
        });
        setActiveChildId(result.child.id);

        if (currentUser) {
          updateDoc(doc(db, 'users', currentUser.uid), {
            linkedChildIds: [...linkedChildren.map((c) => c.id), result.child.id]
          }).catch((err) => console.warn('Could not update user linkedChildIds:', err));
        }
      }

      return result;
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to validate parent link code.'
      };
    }
  };

  const unlinkChild = (childId: string) => {
    setLinkedChildren((prev) => {
      const remaining = prev.filter((c) => c.id !== childId);
      if (activeChildId === childId && remaining.length > 0) {
        setActiveChildId(remaining[0].id);
      }
      return remaining;
    });
  };

  const updateSchoolName = async (name: string) => {
    const trimmed = name.trim();
    setSchoolInfo((prev) => ({ ...prev, name: trimmed }));
    try {
      await updateDoc(doc(db, 'school_info', 'sch-1'), { name: trimmed });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'school_info/sch-1');
    }
  };

  const regenerateSchoolCodes = async (which: 'student' | 'teacher' | 'both' = 'both'): Promise<void> => {
    try {
      const result = await callRegenerateSchoolCodes(which, {
        studentCode: schoolInfo.studentCode || '',
        teacherCode: schoolInfo.teacherCode || ''
      });
      if (result.success) {
        setSchoolInfo((prev) => ({
          ...prev,
          studentCode: result.studentCode,
          teacherCode: result.teacherCode
        }));
        try {
          await setDoc(
            doc(db, 'school_secrets', 'sch-1'),
            {
              studentCode: result.studentCode,
              teacherCode: result.teacherCode,
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );
        } catch (dbErr) {
          console.warn('Could not persist secrets to Firestore:', dbErr);
        }
      }
    } catch (err) {
      console.error('Failed to regenerate school codes via cloud function:', err);
    }
  };

  const addTestResult = async (result: Omit<TestResult, 'id'>) => {
    const id = `test-${Date.now()}`;
    const newRecord: TestResult = { ...result, id };
    setTestResults((prev) => [newRecord, ...prev]);
    try {
      await setDoc(doc(db, 'test_results', id), newRecord);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `test_results/${id}`);
    }
  };

  const saveBatchTestMarks = async (
    testMeta: { batchId: string; testTitle: string; subject: string; date: string; maxMarks: number },
    marks: Array<{ studentId: string; studentName?: string; marksScored: number; remarks?: string }>
  ) => {
    if (marks.length === 0) return;
    const highestMarks = Math.max(...marks.map((m) => m.marksScored));
    const batch = writeBatch(db);
    const newRecords: TestResult[] = [];

    marks.forEach((entry, idx) => {
      const belowOrEqual = marks.filter((m) => m.marksScored <= entry.marksScored).length;
      const percentile = Number(((belowOrEqual / marks.length) * 100).toFixed(1));
      const testId = `test-${Date.now()}-${idx}`;

      const record: TestResult = {
        id: testId,
        studentId: entry.studentId,
        studentName: entry.studentName,
        batchId: testMeta.batchId,
        testTitle: testMeta.testTitle,
        subject: testMeta.subject,
        date: testMeta.date,
        maxMarks: testMeta.maxMarks,
        marksScored: entry.marksScored,
        highestBatchMarks: highestMarks,
        percentile,
        remarks: entry.remarks || (entry.marksScored / testMeta.maxMarks >= 0.8 ? 'Outstanding performance.' : 'Needs review and practice.')
      };

      newRecords.push(record);
      batch.set(doc(db, 'test_results', testId), record);
    });

    setTestResults((prev) => [...newRecords, ...prev]);

    try {
      await batch.commit();
      addNotification({
        type: 'GENERAL',
        title: `Test Evaluated: ${testMeta.testTitle}`,
        message: `${testMeta.subject} scores entered for ${marks.length} students. Top score: ${highestMarks}/${testMeta.maxMarks}.`,
        targetBatchTitle: testMeta.subject,
        authorName: currentTeacher.name
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'test_results');
    }
  };

  const updateUserProfileData = async (updates: {
    fullName?: string;
    phone?: string;
    guardianName?: string;
    guardianPhone?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Not authenticated' };
    try {
      const filteredUpdates: Record<string, any> = {};
      if (updates.fullName !== undefined) filteredUpdates.fullName = updates.fullName.trim();
      if (updates.phone !== undefined) filteredUpdates.phone = updates.phone.trim();
      if (updates.guardianName !== undefined) filteredUpdates.guardianName = updates.guardianName.trim();
      if (updates.guardianPhone !== undefined) filteredUpdates.guardianPhone = updates.guardianPhone.trim();

      await updateDoc(doc(db, 'users', currentUser.uid), filteredUpdates);
      setUserProfile((prev) => (prev ? { ...prev, ...filteredUpdates } : prev));

      if (filteredUpdates.fullName) {
        await updateDoc(doc(db, 'school_members', currentUser.uid), {
          fullName: filteredUpdates.fullName
        }).catch(() => {});
      }

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update profile' };
    }
  };

  const updateUserPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'User is not signed in.' };
    try {
      await firebaseUpdatePassword(currentUser, newPassword);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Password update failed. Please re-authenticate and retry.' };
    }
  };

  const updateSchoolMemberRole = async (memberId: string, newRole: UserRole, isSchoolAdmin = false) => {
    setSchoolMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole, isSchoolAdmin } : m))
    );
    try {
      await updateDoc(doc(db, 'school_members', memberId), {
        role: newRole,
        isSchoolAdmin
      });
      await updateDoc(doc(db, 'users', memberId), {
        role: newRole
      }).catch(() => {});
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `school_members/${memberId}`);
    }
  };

  const deleteSchoolMember = async (memberId: string) => {
    setSchoolMembers((prev) => prev.filter((m) => m.id !== memberId));
    try {
      await deleteDoc(doc(db, 'school_members', memberId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `school_members/${memberId}`);
    }
  };

  const addSchoolMember = async (memberData: Omit<SchoolMember, 'id' | 'joinedAt'>) => {
    const newId = `usr-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const newMember: SchoolMember = {
      ...memberData,
      id: newId,
      joinedAt: today
    };
    setSchoolMembers((prev) => [newMember, ...prev]);
    try {
      await setDoc(doc(db, 'school_members', newId), newMember);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `school_members/${newId}`);
    }
  };

  const updateSchoolSettings = async (updates: Partial<SchoolInfo>) => {
    setSchoolInfo((prev) => ({ ...prev, ...updates }));
    try {
      await updateDoc(doc(db, 'school_info', 'sch-1'), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'school_info/sch-1');
    }
  };

  const resetToDefaults = () => {
    setBatches(initialBatches);
    setAttendanceRecords(initialAttendanceRecords);
    setAssignments(initialAssignments);
    setSubmissions(initialSubmissions);
    setFeeRecords(initialFeeRecords);
    setAnnouncements(initialAnnouncements);
    setDoubts(initialDoubts);
    setResources(initialResources);
    setNotifications(initialNotifications);
    setLatestNotificationToast(null);
    setRooms(initialRooms);
    setScheduleSlots(initialScheduleSlots);
    setParentLinkCode(initialParentLinkCode);
    setLinkedParents(initialLinkedParents);
    setLinkedChildren(initialLinkedChildren);
    setActiveChildId('s1');
    setSchoolInfo(initialSchoolInfo);
    setSchoolMembers(initialSchoolMembers);
    seedDemoDataOnce();
  };

  const sendGuardianSmsOrWhatsApp = async (params: SendGuardianMessageParams): Promise<SendMessageResult> => {
    return await sendGuardianMessage(params);
  };

  const sendPushNotification = async (params: FcmPushParams): Promise<FcmPushResult> => {
    return await dispatchFcmPush(params);
  };

  const requestPushPermissions = async (): Promise<string | null> => {
    return await requestFcmToken();
  };

  return (
    <TuitionContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        userProfile,
        authLoading,
        loginWithEmail,
        signupWithEmail,
        retryRoleVerification,
        cancelSignupAndCleanup,
        quickDemoLogin,
        logout,
        currentStudent,
        currentTeacher,
        currentParent,
        batches,
        addBatch,
        rooms,
        scheduleSlots,
        attendanceRecords,
        assignments,
        submissions,
        feeRecords,
        announcements,
        testResults,
        addTestResult,
        saveBatchTestMarks,
        doubts,
        resources,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
        addNotification,
        latestNotificationToast,
        dismissToast,
        addScheduleSlot,
        updateScheduleSlot,
        deleteScheduleSlot,
        checkRoomAvailability,
        markAttendance,
        addAssignment,
        submitAssignment,
        gradeSubmission,
        payFee,
        submitManualPayment,
        approveManualPayment,
        rejectManualPayment,
        addAnnouncement,
        askDoubt,
        replyDoubt,
        addResource,
        deleteResource,
        parentLinkCode,
        createParentLinkCode,
        linkedParents,
        revokeParent,
        linkedChildren,
        activeChildId,
        setActiveChildId,
        linkChildWithCode,
        unlinkChild,
        schoolInfo,
        updateSchoolName,
        updateSchoolSettings,
        regenerateSchoolCodes,
        schoolMembers,
        updateSchoolMemberRole,
        deleteSchoolMember,
        addSchoolMember,
        notificationLogs,
        sendGuardianSmsOrWhatsApp,
        sendPushNotification,
        requestPushPermissions,
        updateUserProfileData,
        updateUserPassword,
        resetToDefaults,
        theme,
        toggleTheme
      }}
    >
      {children}
    </TuitionContext.Provider>
  );
};

export const useTuition = () => {
  const context = useContext(TuitionContext);
  if (!context) {
    throw new Error('useTuition must be used within a TuitionProvider');
  }
  return context;
};
