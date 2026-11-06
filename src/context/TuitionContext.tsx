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
  User as FirebaseUser
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';

interface TuitionContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmail: (email: string, pass: string, fullName: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
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
  payFee: (invoiceId: string, paymentMethod?: string, paymentId?: string, razorpayOrderId?: string) => Promise<void> | void;
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
}

// ---------------- Demo Seed Data ----------------
const initialBatches: CourseBatch[] = [
  {
    id: 'b1',
    title: 'Grade 10 Mathematics',
    subject: 'Mathematics',
    teacherName: 'Mr. Kingslin',
    scheduleTime: '05:00 PM - 06:30 PM',
    days: ['Mon', 'Wed', 'Fri'],
    activeStudentCount: 18,
    roomOrMeetingLink: 'Room 101',
    syllabusProgress: 72,
    nextTopic: 'Quadratic Equations & Roots',
    gradeLevel: 'Grade 10',
    textbookOrSyllabus: 'NCERT & State Board Mathematics'
  },
  {
    id: 'b2',
    title: 'Physics Fundamentals',
    subject: 'Physics',
    teacherName: 'Dr. Wilson',
    scheduleTime: '06:45 PM - 08:00 PM',
    days: ['Tue', 'Thu', 'Sat'],
    activeStudentCount: 14,
    roomOrMeetingLink: 'Lab 2',
    syllabusProgress: 64,
    nextTopic: 'Electromagnetic Induction',
    gradeLevel: 'Grade 10 & 11',
    textbookOrSyllabus: 'Concepts of Physics & Practical Lab Manual'
  },
  {
    id: 'b3',
    title: 'Chemistry & Reactions',
    subject: 'Chemistry',
    teacherName: 'Ms. Stella',
    scheduleTime: '04:00 PM - 05:15 PM',
    days: ['Mon', 'Thu'],
    activeStudentCount: 12,
    roomOrMeetingLink: 'Room 104',
    syllabusProgress: 58,
    nextTopic: 'Acids, Bases and Salts',
    gradeLevel: 'Grade 10',
    textbookOrSyllabus: 'Inorganic Chemistry & Reaction Mechanics'
  },
  {
    id: 'b4',
    title: 'Biology & Life Systems',
    subject: 'Biology',
    teacherName: 'Dr. Preethi',
    scheduleTime: '03:00 PM - 04:15 PM',
    days: ['Mon', 'Wed'],
    activeStudentCount: 16,
    roomOrMeetingLink: 'Lab 1',
    syllabusProgress: 60,
    nextTopic: 'Cellular Respiration & Genetics',
    gradeLevel: 'Grade 10',
    textbookOrSyllabus: 'NCERT Life Processes & Bio Practical Lab'
  }
];

const initialAttendanceRecords: AttendanceRecord[] = [
  { id: 'a1', batchId: 'b1', studentId: 's1', studentName: 'Aravind Kumar', date: '2026-10-30', status: 'PRESENT', notes: 'Active participation' },
  { id: 'a2', batchId: 'b1', studentId: 's1', studentName: 'Aravind Kumar', date: '2026-10-28', status: 'PRESENT', notes: '' },
  { id: 'a3', batchId: 'b1', studentId: 's1', studentName: 'Aravind Kumar', date: '2026-10-26', status: 'LATE', notes: 'Late by 10 mins (Traffic)' },
  { id: 'a4', batchId: 'b1', studentId: 's1', studentName: 'Aravind Kumar', date: '2026-10-24', status: 'ABSENT', notes: 'Medical leave filed' },
  { id: 'a5', batchId: 'b1', studentId: 's1', studentName: 'Aravind Kumar', date: '2026-10-21', status: 'PRESENT', notes: '' },
  { id: 'a6', batchId: 'b1', studentId: 's1', studentName: 'Aravind Kumar', date: '2026-10-19', status: 'PRESENT', notes: '' },
  { id: 'a7', batchId: 'b1', studentId: 's1', studentName: 'Aravind Kumar', date: '2026-10-17', status: 'EXCUSED', notes: 'School Sports Meet' },
  { id: 'a8', batchId: 'b1', studentId: 's2', studentName: 'Divya Sharma', date: '2026-10-30', status: 'PRESENT', notes: '' },
  { id: 'a9', batchId: 'b1', studentId: 's3', studentName: 'Ganesh Raman', date: '2026-10-30', status: 'ABSENT', notes: 'Unexcused' },
  { id: 'a10', batchId: 'b1', studentId: 's4', studentName: 'Kavitha Selvam', date: '2026-10-30', status: 'PRESENT', notes: '' },
  { id: 'a11', batchId: 'b1', studentId: 's5', studentName: 'Pradeep Raj', date: '2026-10-30', status: 'LATE', notes: 'Bus delay' }
];

const initialAssignments: Assignment[] = [
  {
    id: 'as1',
    batchId: 'b1',
    title: 'Trigonometry Exercise 4.2',
    subject: 'Mathematics',
    description: 'Complete questions 1 to 15 with full derivations and geometric proofs.',
    dueDate: 'Tomorrow, 11:59 PM',
    maxScore: 25,
    isSubmitted: false,
    submissionsCount: 14,
    referenceFile: 'Trig_Derivations_Guide.pdf',
    questionPaperFile: 'Trigonometry_Board_Question_Paper_2026.pdf',
    questionPaperSize: '1.4 MB · 4 pages'
  },
  {
    id: 'as2',
    batchId: 'b2',
    title: 'Optics Ray Diagrams',
    subject: 'Physics',
    description: 'Draw convex and concave mirror reflections with focal length calculations.',
    dueDate: '2026-10-28',
    maxScore: 20,
    isSubmitted: true,
    scoreEarned: 19,
    submissionDate: '2026-10-27',
    submissionNote: 'Hand-drawn diagrams scanned with optical formula derivations attached.',
    teacherFeedback: 'Excellent diagrammatic precision. Review sign convention for negative focal points.',
    submissionsCount: 13,
    referenceFile: 'Mirror_Reflections_Reference.pdf',
    questionPaperFile: 'Optics_Ray_Diagrams_Exam_Paper.pdf',
    questionPaperSize: '2.1 MB · 3 pages',
    answerSheetFile: 'Aravind_Kumar_Optics_AnswerSheet.pdf',
    answerSheetSize: '3.6 MB · 5 pages'
  },
  {
    id: 'as3',
    batchId: 'b3',
    title: 'Chemical Equilibrium Worksheet',
    subject: 'Chemistry',
    description: "Practice worksheet on Le Chatelier's principle and equilibrium constant calculations.",
    dueDate: '2026-11-05',
    maxScore: 30,
    isSubmitted: false,
    submissionsCount: 8,
    referenceFile: 'Equilibrium_Equas_CheatSheet.pdf',
    questionPaperFile: 'Chemical_Equilibrium_Problem_Paper.pdf',
    questionPaperSize: '1.1 MB · 2 pages'
  },
  {
    id: 'as4',
    batchId: 'b1',
    title: 'Quadratic Roots & Discriminant Problem Set',
    subject: 'Mathematics',
    description: 'Solve questions 1 through 10 from Chapter 3 on finding nature of roots using b^2 - 4ac.',
    dueDate: '2026-11-08',
    maxScore: 25,
    isSubmitted: false,
    submissionsCount: 4,
    referenceFile: 'Quadratics_Formulas.pdf',
    questionPaperFile: 'Quadratic_Roots_Question_Paper.pdf',
    questionPaperSize: '1.8 MB · 3 pages'
  }
];

const initialSubmissions: StudentSubmission[] = [
  {
    id: 'sub-1',
    assignmentId: 'as1',
    studentId: 's2',
    studentName: 'Divya Sharma',
    submittedAt: 'Today, 02:15 PM',
    content: 'Completed all 15 questions with derivations. Tested tangent formula roots.',
    scoreEarned: 24,
    teacherFeedback: 'Flawless work on derivation #8!',
    status: 'GRADED',
    answerSheetFile: 'Divya_Sharma_Trig_AnswerSheet.pdf',
    answerSheetSize: '2.8 MB · 6 pages',
    evaluatedAt: 'Today, 03:00 PM'
  },
  {
    id: 'sub-2',
    assignmentId: 'as1',
    studentId: 's4',
    studentName: 'Kavitha Selvam',
    submittedAt: 'Today, 04:30 PM',
    content: 'Attached handwritten solutions for trigonometry worksheet.',
    scoreEarned: null,
    status: 'SUBMITTED',
    answerSheetFile: 'Kavitha_Selvam_Trig_Worksheet.pdf',
    answerSheetSize: '3.2 MB · 4 pages'
  },
  {
    id: 'sub-3',
    assignmentId: 'as2',
    studentId: 's1',
    studentName: 'Aravind Kumar',
    submittedAt: '2026-10-27',
    content: 'Hand-drawn diagrams scanned with optical formula derivations attached.',
    scoreEarned: 19,
    teacherFeedback: 'Excellent diagrammatic precision. Review sign convention for negative focal points.',
    status: 'GRADED',
    answerSheetFile: 'Aravind_Kumar_Optics_AnswerSheet.pdf',
    answerSheetSize: '3.6 MB · 5 pages',
    evaluatedAt: '2026-10-28 10:15 AM'
  }
];

const initialFeeRecords: FeeRecord[] = [
  {
    invoiceId: 'inv-10-26',
    studentId: 's1',
    studentName: 'Aravind Kumar',
    monthYear: 'October 2026',
    amountDue: 1500.0,
    amountPaid: 1500.0,
    status: 'PAID',
    dueDate: '2026-10-10',
    paymentMethod: 'UPI (GPay)',
    paidAt: '2026-10-08 11:20 AM'
  },
  {
    invoiceId: 'inv-11-26',
    studentId: 's1',
    studentName: 'Aravind Kumar',
    monthYear: 'November 2026',
    amountDue: 1500.0,
    amountPaid: 0.0,
    status: 'PENDING',
    dueDate: '2026-11-10'
  },
  {
    invoiceId: 'inv-02',
    studentId: 's2',
    studentName: 'Divya Sharma',
    monthYear: 'November 2026',
    amountDue: 1500.0,
    amountPaid: 1500.0,
    status: 'PAID',
    dueDate: '2026-11-10',
    paymentMethod: 'NetBanking',
    paidAt: '2026-10-31 03:45 PM'
  },
  {
    invoiceId: 'inv-03',
    studentId: 's3',
    studentName: 'Ganesh Raman',
    monthYear: 'October 2026',
    amountDue: 1500.0,
    amountPaid: 0.0,
    status: 'OVERDUE',
    dueDate: '2026-10-10'
  },
  {
    invoiceId: 'inv-04',
    studentId: 's4',
    studentName: 'Kavitha Selvam',
    monthYear: 'November 2026',
    amountDue: 1500.0,
    amountPaid: 0.0,
    status: 'PENDING',
    dueDate: '2026-11-15'
  }
];

const initialAnnouncements: Announcement[] = [
  {
    id: 'ann1',
    title: 'Term 1 Revision Mock Test Series',
    message: 'Mathematics and Physics full syllabus mock examinations commence this Saturday at 10:00 AM sharp in Room 101. Bring geometry kits.',
    authorName: 'Mr. Kingslin',
    timestamp: '2 hours ago',
    priority: 'HIGH'
  },
  {
    id: 'ann2',
    title: 'Lab Session Rescheduled',
    message: 'The Chemistry Optics & Titration practical is moved to Thursday 04:00 PM due to science lab equipment calibration.',
    authorName: 'Ms. Stella',
    timestamp: 'Yesterday',
    priority: 'NORMAL'
  },
  {
    id: 'ann3',
    title: 'Holiday Notice (Diwali Break)',
    message: 'The coaching center will remain closed for Diwali holidays from Nov 12 to Nov 15. Online practice worksheets will be accessible via portal.',
    authorName: 'Administration',
    timestamp: '3 days ago',
    priority: 'NORMAL'
  }
];

const initialTestResults: TestResult[] = [
  {
    id: 'test-1',
    studentId: 's1',
    batchId: 'b1',
    testTitle: 'Monthly Assessment: Trigonometry & Circles',
    subject: 'Mathematics',
    date: '2026-10-25',
    maxMarks: 50,
    marksScored: 47,
    highestBatchMarks: 49,
    percentile: 94.2,
    remarks: 'Outstanding speed in algebraic proofs. Keep reviewing coordinate geometry.'
  },
  {
    id: 'test-2',
    studentId: 's1',
    batchId: 'b2',
    testTitle: 'Unit Test 2: Optics & Reflection Laws',
    subject: 'Physics',
    date: '2026-10-18',
    maxMarks: 40,
    marksScored: 36,
    highestBatchMarks: 38,
    percentile: 90.0,
    remarks: 'Clear mirror diagrams. Minor calculation glitch on question #7.'
  },
  {
    id: 'test-3',
    studentId: 's1',
    batchId: 'b3',
    testTitle: 'Chapter Quiz: Chemical Reactions & Balancing',
    subject: 'Chemistry',
    date: '2026-10-10',
    maxMarks: 30,
    marksScored: 28,
    highestBatchMarks: 30,
    percentile: 92.5,
    remarks: 'Good grasp of stoichiometry and precipitation indicators.'
  }
];

const initialDoubts: StudentDoubt[] = [
  {
    id: 'dbt-1',
    studentId: 's1',
    studentName: 'Aravind Kumar',
    subject: 'Mathematics',
    topic: 'Quadratic Formula Derivation',
    question: 'How do we resolve the negative discriminant when completing the square for non-real roots in problem 14?',
    askedAt: 'Today, 10:15 AM',
    reply: 'In Class 10 State Board curriculum, if b^2 - 4ac < 0, state that no real roots exist. In Class 11 we introduce imaginary unit i.',
    repliedBy: 'Mr. Kingslin',
    repliedAt: 'Today, 11:30 AM',
    isResolved: true
  },
  {
    id: 'dbt-2',
    studentId: 's1',
    studentName: 'Aravind Kumar',
    subject: 'Physics',
    topic: 'Sign Convention for Concave Mirrors',
    question: 'Why is the focal length always taken as negative for concave mirrors according to the Cartesian convention?',
    askedAt: 'Yesterday, 04:45 PM',
    reply: 'Because the focus lies in front of the reflecting surface on the left side of the pole, which is against the direction of incident light rays.',
    repliedBy: 'Dr. Wilson',
    repliedAt: 'Yesterday, 06:10 PM',
    isResolved: true
  },
  {
    id: 'dbt-3',
    studentId: 's2',
    studentName: 'Divya Sharma',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    question: 'Can we divide through by cos^2(theta) directly when solving identity question 8 on page 112?',
    askedAt: '2 hours ago',
    isResolved: false
  }
];

const initialResources: EducationalResource[] = [
  {
    id: 'res-1',
    batchId: 'b1',
    batchTitle: 'Grade 10 Mathematics',
    title: 'Class 10 Trigonometry Formula Booklet & Identities',
    subject: 'Mathematics',
    type: 'PDF',
    urlOrFilename: 'Trigonometry_Formulas_Complete_Guide.pdf',
    description: 'Comprehensive 8-page formula sheet covering sin, cos, tan identities, standard angle tables (0°-90°), and complementary angle proofs.',
    authorName: 'Mr. Kingslin',
    uploadedAt: 'Yesterday',
    fileSizeOrDuration: '3.4 MB · 8 pages',
    tags: ['Formulas', 'Unit 4', 'Trigonometry']
  },
  {
    id: 'res-2',
    batchId: 'b2',
    batchTitle: 'Physics Fundamentals',
    title: 'Ray Optics & Mirror Reflection Laws Handout',
    subject: 'Physics',
    type: 'PDF',
    urlOrFilename: 'Optics_Ray_Diagrams_Handout.pdf',
    description: 'Illustrated guide on convex and concave mirror reflections, Cartesian sign conventions, focal length derivation, and magnification equations.',
    authorName: 'Dr. Wilson',
    uploadedAt: '3 days ago',
    fileSizeOrDuration: '4.8 MB · 12 pages',
    tags: ['Optics', 'Ray Diagrams', 'Unit 2']
  },
  {
    id: 'res-3',
    batchId: 'b3',
    batchTitle: 'Chemistry & Reactions',
    title: 'Khan Academy: Dynamic Chemical Equilibrium & Le Chatelier Principle',
    subject: 'Chemistry',
    type: 'VIDEO',
    urlOrFilename: 'https://www.khanacademy.org/science/chemistry/chemical-equilibrium',
    description: 'Curated 18-minute video tutorial explaining how equilibrium systems dynamically respond to shifts in temperature, pressure, and catalyst.',
    authorName: 'Ms. Stella',
    uploadedAt: 'Oct 28, 2026',
    fileSizeOrDuration: '18 mins video',
    tags: ['Video', 'Equilibrium', 'Kinetics']
  },
  {
    id: 'res-4',
    batchId: 'ALL',
    batchTitle: 'All Batches',
    title: 'NCERT Official Exemplar Problems & Solutions Portal',
    subject: 'Mathematics',
    type: 'LINK',
    urlOrFilename: 'https://ncert.nic.in/exemplar-problems.php',
    description: 'Direct link to the official Department of Education question bank with higher-order thinking skill (HOTS) questions and solved keys.',
    authorName: 'Mr. Kingslin',
    uploadedAt: 'Oct 25, 2026',
    fileSizeOrDuration: 'Govt Web Resource',
    tags: ['NCERT', 'HOTS', 'Exemplar']
  },
  {
    id: 'res-5',
    batchId: 'b3',
    batchTitle: 'Chemistry & Reactions',
    title: 'Balancing Chemical Equations & Redox Reactions Cheatsheet',
    subject: 'Chemistry',
    type: 'CHEATSHEET',
    urlOrFilename: 'Chemical_Reactions_Balancing_Tricks.pdf',
    description: 'Quick reference sheet with algebraic balancing techniques, oxidation state assignment rules, and common precipitate color indicators.',
    authorName: 'Ms. Stella',
    uploadedAt: 'Oct 22, 2026',
    fileSizeOrDuration: '1.2 MB · 2 pages',
    tags: ['Cheatsheet', 'Stoichiometry', 'Reactions']
  },
  {
    id: 'res-6',
    batchId: 'b2',
    batchTitle: 'Physics Fundamentals',
    title: 'PhET Interactive Simulation: Faraday\'s Law of Electromagnetic Induction',
    subject: 'Physics',
    type: 'LINK',
    urlOrFilename: 'https://phet.colorado.edu/en/simulations/faradays-law',
    description: 'Interactive HTML5 simulation showing induced voltage, magnetic flux variation, field lines, and light bulb excitation.',
    authorName: 'Dr. Wilson',
    uploadedAt: 'Oct 20, 2026',
    fileSizeOrDuration: 'Interactive Simulation',
    tags: ['Simulation', 'Electromagnetism', 'PhET']
  }
];

const initialNotifications: StudentNotification[] = [
  {
    id: 'notif-1',
    type: 'HOMEWORK_POSTED',
    title: 'New Homework: Trigonometric Identities & Heights',
    message: 'Mathematics · Due Nov 05, 2026. Complete textbook exercise 8.4 questions 1-10 with detailed derivations.',
    timestamp: '2 hours ago',
    read: false,
    targetBatchTitle: 'Grade 10 Mathematics',
    referenceId: 'as1',
    actionScreen: 'ASSIGNMENTS',
    authorName: 'Mr. Kingslin'
  },
  {
    id: 'notif-2',
    type: 'RESOURCE_ADDED',
    title: 'New Material Shared: Complete Class 10 Trigonometry Formula Booklet',
    message: 'Mathematics · Comprehensive PDF formula booklet with identity derivations and angle lookup table.',
    timestamp: 'Yesterday',
    read: false,
    targetBatchTitle: 'Grade 10 Mathematics',
    referenceId: 'res-1',
    actionScreen: 'RESOURCES',
    authorName: 'Mr. Kingslin'
  },
  {
    id: 'notif-3',
    type: 'RESOURCE_ADDED',
    title: 'New Material Shared: PhET Faraday\'s Electromagnetic Induction Lab',
    message: 'Physics · HTML5 interactive simulation link for hands-on magnetic flux and induction visualization.',
    timestamp: '3 days ago',
    read: true,
    targetBatchTitle: 'Physics Fundamentals',
    referenceId: 'res-6',
    actionScreen: 'RESOURCES',
    authorName: 'Dr. Wilson'
  }
];

const initialRooms: ClassroomRoom[] = [
  {
    id: 'r1',
    name: 'Room 101 (Main Lecture Hall)',
    building: 'Main Academic Block · 1st Floor',
    capacity: 24,
    equipment: ['Smart Projector', 'Digital Whiteboard', 'Wireless Mic', 'Air Conditioned'],
    isLab: false
  },
  {
    id: 'r2',
    name: 'Lab 2 (Optics & Physics Wing)',
    building: 'Science Practical Block · Ground Floor',
    capacity: 18,
    equipment: ['Optical Benches', 'Laser Diffraction Kits', 'Galvanometers', 'Fume Absorber'],
    isLab: true
  },
  {
    id: 'r3',
    name: 'Room 104 (Interactive Classroom)',
    building: 'East Wing · 2nd Floor',
    capacity: 20,
    equipment: ['Touch Display Screen', 'Dual Whiteboards', 'High-speed Wi-Fi', 'Sound Dampening'],
    isLab: false
  },
  {
    id: 'r4',
    name: 'Chemistry Analytical Lab',
    building: 'Science Practical Block · Ground Floor',
    capacity: 16,
    equipment: ['Chemical Fume Hood', 'Acid-Base Titration Benches', 'Centrifuges', 'Safety Eye Wash'],
    isLab: true
  },
  {
    id: 'r5',
    name: 'Seminar Hall A (Auditorium)',
    building: 'West Academic Wing · 1st Floor',
    capacity: 45,
    equipment: ['Dual Laser Projectors', 'Conference Sound System', 'Document Camera', 'Stage Podium'],
    isLab: false
  }
];

const initialScheduleSlots: ScheduleSlot[] = [
  {
    id: 'slot-1',
    batchId: 'b1',
    batchTitle: 'Grade 10 Mathematics',
    subject: 'Mathematics',
    teacherName: 'Mr. Kingslin',
    day: 'Mon',
    startTime: '17:00',
    endTime: '18:30',
    displayTime: '05:00 PM - 06:30 PM',
    roomId: 'r1',
    roomName: 'Room 101 (Main Lecture Hall)',
    locationNotes: 'Main Academic Block · Floor 1',
    isOnline: false,
    activeStudents: 18
  },
  {
    id: 'slot-2',
    batchId: 'b1',
    batchTitle: 'Grade 10 Mathematics',
    subject: 'Mathematics',
    teacherName: 'Mr. Kingslin',
    day: 'Wed',
    startTime: '17:00',
    endTime: '18:30',
    displayTime: '05:00 PM - 06:30 PM',
    roomId: 'r1',
    roomName: 'Room 101 (Main Lecture Hall)',
    locationNotes: 'Main Academic Block · Floor 1',
    isOnline: false,
    activeStudents: 18
  },
  {
    id: 'slot-3',
    batchId: 'b1',
    batchTitle: 'Grade 10 Mathematics',
    subject: 'Mathematics',
    teacherName: 'Mr. Kingslin',
    day: 'Fri',
    startTime: '17:00',
    endTime: '18:30',
    displayTime: '05:00 PM - 06:30 PM',
    roomId: 'r1',
    roomName: 'Room 101 (Main Lecture Hall)',
    locationNotes: 'Main Academic Block · Floor 1',
    isOnline: false,
    activeStudents: 18
  },
  {
    id: 'slot-4',
    batchId: 'b2',
    batchTitle: 'Physics Fundamentals',
    subject: 'Physics',
    teacherName: 'Dr. Wilson',
    day: 'Tue',
    startTime: '18:45',
    endTime: '20:00',
    displayTime: '06:45 PM - 08:00 PM',
    roomId: 'r2',
    roomName: 'Lab 2 (Optics & Physics Wing)',
    locationNotes: 'Science Practical Block · Ground Floor',
    isOnline: false,
    activeStudents: 14
  },
  {
    id: 'slot-5',
    batchId: 'b2',
    batchTitle: 'Physics Fundamentals',
    subject: 'Physics',
    teacherName: 'Dr. Wilson',
    day: 'Thu',
    startTime: '18:45',
    endTime: '20:00',
    displayTime: '06:45 PM - 08:00 PM',
    roomId: 'r2',
    roomName: 'Lab 2 (Optics & Physics Wing)',
    locationNotes: 'Science Practical Block · Ground Floor',
    isOnline: false,
    activeStudents: 14
  },
  {
    id: 'slot-6',
    batchId: 'b2',
    batchTitle: 'Physics Fundamentals',
    subject: 'Physics',
    teacherName: 'Dr. Wilson',
    day: 'Sat',
    startTime: '18:45',
    endTime: '20:00',
    displayTime: '06:45 PM - 08:00 PM',
    roomId: 'r2',
    roomName: 'Lab 2 (Optics & Physics Wing)',
    locationNotes: 'Science Practical Block · Ground Floor',
    isOnline: false,
    activeStudents: 14
  },
  {
    id: 'slot-7',
    batchId: 'b3',
    batchTitle: 'Chemistry & Reactions',
    subject: 'Chemistry',
    teacherName: 'Ms. Stella',
    day: 'Mon',
    startTime: '16:00',
    endTime: '17:15',
    displayTime: '04:00 PM - 05:15 PM',
    roomId: 'r3',
    roomName: 'Room 104 (Interactive Classroom)',
    locationNotes: 'East Wing · 2nd Floor',
    isOnline: false,
    activeStudents: 12
  },
  {
    id: 'slot-8',
    batchId: 'b3',
    batchTitle: 'Chemistry & Reactions',
    subject: 'Chemistry',
    teacherName: 'Ms. Stella',
    day: 'Thu',
    startTime: '16:00',
    endTime: '17:15',
    displayTime: '04:00 PM - 05:15 PM',
    roomId: 'r3',
    roomName: 'Room 104 (Interactive Classroom)',
    locationNotes: 'East Wing · 2nd Floor',
    isOnline: false,
    activeStudents: 12
  },
  {
    id: 'slot-9',
    batchId: 'b1',
    batchTitle: 'Grade 10 Mathematics - Problem Solving Marathon',
    subject: 'Mathematics',
    teacherName: 'Mr. Kingslin',
    day: 'Sat',
    startTime: '10:00',
    endTime: '11:45',
    displayTime: '10:00 AM - 11:45 AM',
    roomId: 'r5',
    roomName: 'Seminar Hall A (Auditorium)',
    locationNotes: 'West Academic Wing · 1st Floor',
    isOnline: false,
    activeStudents: 25
  }
];

const initialParentLinkCode: ParentLinkCode | null = null;

const initialLinkedParents: LinkedParent[] = [
  {
    id: 'p1',
    fullName: 'Kumar Raman (Father)',
    email: 'kumar.raman@gmail.com',
    phone: '+91 98765 43210',
    linkedAt: '2026-10-15'
  }
];

const initialLinkedChildren: ChildProfile[] = [
  {
    id: 's1',
    fullName: 'Aravind Kumar',
    grade: 'Grade 10',
    section: 'State Board Batch A',
    schoolName: 'Apex Academy of Excellence'
  },
  {
    id: 's2',
    fullName: 'Divya Sharma',
    grade: 'Grade 10',
    section: 'State Board Batch A',
    schoolName: 'Apex Academy of Excellence'
  }
];

const initialSchoolInfo: SchoolInfo = {
  id: 'sch-1',
  name: 'Apex Academy of Excellence',
  isSchoolAdmin: true,
  studentCode: 'S-8F29A1B',
  teacherCode: 'T-3E49K2X',
  teacherCount: 4,
  studentCount: 60,
  parentCount: 42
};

const initialSchoolMembers: SchoolMember[] = [
  { id: 't1', fullName: 'Mr. Kingslin', email: 'teacher@apex.edu', role: 'TEACHER', isSchoolAdmin: true, joinedAt: '2026-06-01' },
  { id: 't2', fullName: 'Dr. Wilson', email: 'wilson.physics@tuitionplatform.internal', role: 'TEACHER', isSchoolAdmin: false, joinedAt: '2026-06-15' },
  { id: 't3', fullName: 'Ms. Stella', email: 'stella.chemistry@tuitionplatform.internal', role: 'TEACHER', isSchoolAdmin: false, joinedAt: '2026-07-01' },
  { id: 't4', fullName: 'Dr. Preethi', email: 'preethi.biology@tuitionplatform.internal', role: 'TEACHER', isSchoolAdmin: false, joinedAt: '2026-08-01' },
  { id: 's1', fullName: 'Aravind Kumar', email: 'student@apex.edu', role: 'STUDENT', isSchoolAdmin: false, joinedAt: '2026-08-10' },
  { id: 's2', fullName: 'Divya Sharma', email: 'divya.s@student.internal', role: 'STUDENT', isSchoolAdmin: false, joinedAt: '2026-08-12' },
  { id: 's3', fullName: 'Ganesh Raman', email: 'ganesh.r@student.internal', role: 'STUDENT', isSchoolAdmin: false, joinedAt: '2026-08-15' },
  { id: 'p1', fullName: 'Kumar Raman', email: 'parent@apex.edu', role: 'PARENT', isSchoolAdmin: false, joinedAt: '2026-08-20' },
  { id: 'p2', fullName: 'Sunita Sharma', email: 'sunita.sharma@gmail.com', role: 'PARENT', isSchoolAdmin: false, joinedAt: '2026-08-22' },
  { id: 'adm-1', fullName: 'Apex Administrator', email: 'admin@apex.edu', role: 'ADMIN', isSchoolAdmin: true, joinedAt: '2026-01-01' }
];

const TuitionContext = createContext<TuitionContextType | undefined>(undefined);

export const TuitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [role, setRoleState] = useState<UserRole>('STUDENT');

  // Firestore live collections state
  const [batches, setBatches] = useState<CourseBatch[]>(initialBatches);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(initialAttendanceRecords);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(initialSubmissions);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>(initialFeeRecords);
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [testResults, setTestResults] = useState<TestResult[]>(initialTestResults);
  const [doubts, setDoubts] = useState<StudentDoubt[]>(initialDoubts);
  const [resources, setResources] = useState<EducationalResource[]>(initialResources);
  const [notifications, setNotifications] = useState<StudentNotification[]>(initialNotifications);
  const [rooms, setRooms] = useState<ClassroomRoom[]>(initialRooms);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>(initialScheduleSlots);
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

  // Seed initial demo data once to Firestore if school_info/sch-1 does not exist
  const seedDemoDataOnce = async () => {
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

        // Seed initial school demo data if not yet present
        seedDemoDataOnce();
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Set up Real-time Listeners across all Firestore collections
  useEffect(() => {
    if (!currentUser) return;

    const unsubs: (() => void)[] = [];

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
    unsubs.push(
      onSnapshot(
        collection(db, 'batches'),
        (snap) => {
          if (!snap.empty) {
            setBatches(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CourseBatch)));
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'batches')
      )
    );

    // 3. Attendance
    unsubs.push(
      onSnapshot(
        collection(db, 'attendance'),
        (snap) => {
          if (!snap.empty) {
            setAttendanceRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord)));
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'attendance')
      )
    );

    // 4. Assignments
    unsubs.push(
      onSnapshot(
        collection(db, 'assignments'),
        (snap) => {
          if (!snap.empty) {
            setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment)));
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'assignments')
      )
    );

    // 5. Submissions
    unsubs.push(
      onSnapshot(
        collection(db, 'submissions'),
        (snap) => {
          if (!snap.empty) {
            setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudentSubmission)));
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'submissions')
      )
    );

    // 6. Fees
    unsubs.push(
      onSnapshot(
        collection(db, 'fees'),
        (snap) => {
          if (!snap.empty) {
            setFeeRecords(snap.docs.map((d) => ({ invoiceId: d.id, ...d.data() } as FeeRecord)));
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'fees')
      )
    );

    // 7. Announcements
    unsubs.push(
      onSnapshot(
        collection(db, 'announcements'),
        (snap) => {
          if (!snap.empty) {
            setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement)));
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'announcements')
      )
    );

    // 8. Doubts
    unsubs.push(
      onSnapshot(
        collection(db, 'doubts'),
        (snap) => {
          if (!snap.empty) {
            setDoubts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudentDoubt)));
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'doubts')
      )
    );

    // 9. Resources
    unsubs.push(
      onSnapshot(
        collection(db, 'resources'),
        (snap) => {
          if (!snap.empty) {
            setResources(snap.docs.map((d) => ({ id: d.id, ...d.data() } as EducationalResource)));
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'resources')
      )
    );

    // 10. Notifications
    unsubs.push(
      onSnapshot(
        collection(db, 'notifications'),
        (snap) => {
          if (!snap.empty) {
            setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudentNotification)));
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'notifications')
      )
    );

    // 11. Rooms
    unsubs.push(
      onSnapshot(
        collection(db, 'rooms'),
        (snap) => {
          if (!snap.empty) {
            setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassroomRoom)));
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'rooms')
      )
    );

    // 12. Schedule slots
    unsubs.push(
      onSnapshot(
        collection(db, 'schedule_slots'),
        (snap) => {
          if (!snap.empty) {
            setScheduleSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScheduleSlot)));
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'schedule_slots')
      )
    );

    // 13. Test Results
    unsubs.push(
      onSnapshot(
        collection(db, 'test_results'),
        (snap) => {
          if (!snap.empty) {
            setTestResults(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TestResult)));
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'test_results')
      )
    );

    // 14. School Info
    unsubs.push(
      onSnapshot(
        doc(db, 'school_info', 'sch-1'),
        (snap) => {
          if (snap.exists()) {
            setSchoolInfo(snap.data() as SchoolInfo);
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'school_info/sch-1')
      )
    );

    // 15. School Members
    unsubs.push(
      onSnapshot(
        collection(db, 'school_members'),
        (snap) => {
          if (!snap.empty) {
            setSchoolMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SchoolMember)));
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'school_members')
      )
    );

    // 16. Parent Links
    unsubs.push(
      onSnapshot(
        collection(db, 'parent_links'),
        (snap) => {
          if (!snap.empty) {
            const firstActive = snap.docs.find((d) => !d.data().used);
            if (firstActive) {
              setParentLinkCode(firstActive.data() as ParentLinkCode);
            }
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'parent_links')
      )
    );

    // 17. Notification & Message Logs
    unsubs.push(
      onSnapshot(
        collection(db, 'notification_logs'),
        (snap) => {
          if (!snap.empty) {
            const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationLog));
            logs.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
            setNotificationLogs(logs);
          }
        },
        (err) => console.warn('notification_logs listener warning:', err)
      )
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [currentUser]);

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
      const msg = err instanceof Error ? err.message : 'Login failed.';
      return { success: false, error: msg };
    }
  };

  const signupWithEmail = async (
    email: string,
    pass: string,
    fullName: string,
    signupRole: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const user = cred.user;

      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || email,
        fullName,
        role: signupRole,
        schoolId: 'sch-1',
        studentId: signupRole === 'STUDENT' ? `s-${Date.now()}` : undefined,
        teacherId: signupRole === 'TEACHER' ? `t-${Date.now()}` : undefined,
        parentId: signupRole === 'PARENT' ? `p-${Date.now()}` : undefined,
        linkedChildIds: signupRole === 'PARENT' ? ['s1'] : [],
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), profile);
      setUserProfile(profile);
      setRoleState(signupRole);

      // Add to school members roster
      await setDoc(doc(db, 'school_members', user.uid), {
        id: user.uid,
        fullName,
        email,
        role: signupRole,
        isSchoolAdmin: signupRole === 'ADMIN',
        joinedAt: new Date().toISOString().split('T')[0]
      });

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed.';
      return { success: false, error: msg };
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
    } catch {
      // If user does not exist yet, create them with demo data
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
      } catch (createErr) {
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
    paymentMethod = 'Razorpay Checkout',
    paymentId?: string,
    razorpayOrderId?: string
  ) => {
    const nowStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const targetFee = feeRecords.find((f) => f.invoiceId === invoiceId);
    const amount = targetFee ? targetFee.amountDue : 1500;

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
              razorpayOrderId: razorpayOrderId || f.razorpayOrderId,
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
        ...(paymentId ? { paymentId } : {}),
        ...(razorpayOrderId ? { razorpayOrderId } : {})
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

    setFeeRecords((prev) =>
      prev.map((f) =>
        f.invoiceId === invoiceId
          ? {
              ...f,
              manualPaymentClaimed: true,
              manualPaymentUtr: utr.trim(),
              approvalStatus: 'PENDING_APPROVAL',
              manualPaymentSubmittedAt: nowStr,
              paymentMethod: `Manual UPI (Pending Faculty Approval · UTR: ${utr.trim()})`
            }
          : f
      )
    );

    try {
      await updateDoc(doc(db, 'fees', invoiceId), {
        manualPaymentClaimed: true,
        manualPaymentUtr: utr.trim(),
        approvalStatus: 'PENDING_APPROVAL',
        manualPaymentSubmittedAt: nowStr,
        paymentMethod: `Manual UPI (Pending Faculty Approval · UTR: ${utr.trim()})`
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `fees/${invoiceId}`);
    }

    addNotification({
      type: 'GENERAL',
      title: 'Manual UPI Payment Submitted for Review',
      message: `UTR #${utr.trim()} submitted for Invoice #${invoiceId}. Faculty review is pending.`,
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
    const amount = targetFee ? targetFee.amountDue : 1500;
    const utr = targetFee?.manualPaymentUtr || 'Verified';
    const finalMethod = `Manual UPI (Approved by Faculty · UTR: ${utr})`;

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
      authorName: currentTeacher.name
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
        studentCode: schoolInfo.studentCode,
        teacherCode: schoolInfo.teacherCode
      });
      if (result.success) {
        setSchoolInfo((prev) => ({
          ...prev,
          studentCode: result.studentCode,
          teacherCode: result.teacherCode
        }));
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
        resetToDefaults
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
