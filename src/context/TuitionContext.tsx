import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
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
  SchoolMember
} from '../types';

interface TuitionContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentStudent: StudentProfile;
  currentTeacher: TeacherProfile;
  batches: CourseBatch[];
  addBatch: (batch: Omit<CourseBatch, 'id'>) => void;
  rooms: ClassroomRoom[];
  scheduleSlots: ScheduleSlot[];
  attendanceRecords: AttendanceRecord[];
  assignments: Assignment[];
  submissions: StudentSubmission[];
  feeRecords: FeeRecord[];
  announcements: Announcement[];
  testResults: TestResult[];
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
    answerSheetSize?: string
  ) => void;
  gradeSubmission: (submissionId: string, score: number, feedback: string) => void;
  payFee: (invoiceId: string, paymentMethod?: string) => void;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'timestamp'>) => void;
  askDoubt: (doubt: Omit<StudentDoubt, 'id' | 'askedAt' | 'isResolved'>) => void;
  replyDoubt: (doubtId: string, reply: string) => void;
  addResource: (resource: Omit<EducationalResource, 'id' | 'uploadedAt'>) => void;
  deleteResource: (resourceId: string) => void;
  parentLinkCode: ParentLinkCode | null;
  createParentLinkCode: () => ParentLinkCode;
  linkedParents: LinkedParent[];
  revokeParent: (parentId: string) => void;
  linkedChildren: ChildProfile[];
  activeChildId: string;
  setActiveChildId: (id: string) => void;
  linkChildWithCode: (code: string) => { success: boolean; message: string; child?: ChildProfile };
  unlinkChild: (childId: string) => void;
  currentParent: { id: string; fullName: string; email: string };
  schoolInfo: SchoolInfo;
  updateSchoolName: (name: string) => void;
  regenerateSchoolCodes: (which?: 'student' | 'teacher' | 'both') => void;
  schoolMembers: SchoolMember[];
  resetToDefaults: () => void;
}

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

const initialParentLinkCode: ParentLinkCode = {
  code: 'P-94821',
  studentId: 's1',
  studentName: 'Aravind Kumar',
  expiresAt: 'In 48 hours',
  createdAt: 'Today, 08:30 AM'
};

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
  { id: 't1', fullName: 'Mr. Kingslin', email: 'kingslin@tuitionplatform.internal', role: 'TEACHER', isSchoolAdmin: true, joinedAt: '2026-06-01' },
  { id: 't2', fullName: 'Dr. Wilson', email: 'wilson.physics@tuitionplatform.internal', role: 'TEACHER', isSchoolAdmin: false, joinedAt: '2026-06-15' },
  { id: 't3', fullName: 'Ms. Stella', email: 'stella.chemistry@tuitionplatform.internal', role: 'TEACHER', isSchoolAdmin: false, joinedAt: '2026-07-01' },
  { id: 't4', fullName: 'Dr. Preethi', email: 'preethi.biology@tuitionplatform.internal', role: 'TEACHER', isSchoolAdmin: false, joinedAt: '2026-08-01' },
  { id: 's1', fullName: 'Aravind Kumar', email: 'aravind.k@student.internal', role: 'STUDENT', isSchoolAdmin: false, joinedAt: '2026-08-10' },
  { id: 's2', fullName: 'Divya Sharma', email: 'divya.s@student.internal', role: 'STUDENT', isSchoolAdmin: false, joinedAt: '2026-08-12' },
  { id: 's3', fullName: 'Ganesh Raman', email: 'ganesh.r@student.internal', role: 'STUDENT', isSchoolAdmin: false, joinedAt: '2026-08-15' },
  { id: 'p1', fullName: 'Kumar Raman', email: 'kumar.raman@gmail.com', role: 'PARENT', isSchoolAdmin: false, joinedAt: '2026-08-20' },
  { id: 'p2', fullName: 'Sunita Sharma', email: 'sunita.sharma@gmail.com', role: 'PARENT', isSchoolAdmin: false, joinedAt: '2026-08-22' }
];

const TuitionContext = createContext<TuitionContextType | undefined>(undefined);

export const TuitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('tuition_role') as UserRole) || 'STUDENT';
  });

  const [batches, setBatches] = useState<CourseBatch[]>(() => {
    const saved = localStorage.getItem('tuition_batches');
    return saved ? JSON.parse(saved) : initialBatches;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('tuition_attendance');
    return saved ? JSON.parse(saved) : initialAttendanceRecords;
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('tuition_assignments');
    return saved ? JSON.parse(saved) : initialAssignments;
  });

  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
    const saved = localStorage.getItem('tuition_submissions');
    return saved ? JSON.parse(saved) : initialSubmissions;
  });

  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>(() => {
    const saved = localStorage.getItem('tuition_fees');
    return saved ? JSON.parse(saved) : initialFeeRecords;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('tuition_announcements');
    return saved ? JSON.parse(saved) : initialAnnouncements;
  });

  const [testResults] = useState<TestResult[]>(() => {
    const saved = localStorage.getItem('tuition_test_results');
    return saved ? JSON.parse(saved) : initialTestResults;
  });

  const [doubts, setDoubts] = useState<StudentDoubt[]>(() => {
    const saved = localStorage.getItem('tuition_doubts');
    return saved ? JSON.parse(saved) : initialDoubts;
  });

  const [resources, setResources] = useState<EducationalResource[]>(() => {
    const saved = localStorage.getItem('tuition_resources');
    return saved ? JSON.parse(saved) : initialResources;
  });

  const [notifications, setNotifications] = useState<StudentNotification[]>(() => {
    const saved = localStorage.getItem('tuition_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [latestNotificationToast, setLatestNotificationToast] = useState<StudentNotification | null>(null);

  const [rooms, setRooms] = useState<ClassroomRoom[]>(() => {
    const saved = localStorage.getItem('tuition_rooms');
    return saved ? JSON.parse(saved) : initialRooms;
  });

  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>(() => {
    const saved = localStorage.getItem('tuition_schedule_slots');
    return saved ? JSON.parse(saved) : initialScheduleSlots;
  });

  const [parentLinkCode, setParentLinkCode] = useState<ParentLinkCode | null>(() => {
    const saved = localStorage.getItem('tuition_parent_code');
    return saved ? JSON.parse(saved) : initialParentLinkCode;
  });

  const [linkedParents, setLinkedParents] = useState<LinkedParent[]>(() => {
    const saved = localStorage.getItem('tuition_linked_parents');
    return saved ? JSON.parse(saved) : initialLinkedParents;
  });

  const [linkedChildren, setLinkedChildren] = useState<ChildProfile[]>(() => {
    const saved = localStorage.getItem('tuition_linked_children');
    return saved ? JSON.parse(saved) : initialLinkedChildren;
  });

  const [activeChildId, setActiveChildId] = useState<string>(() => {
    return localStorage.getItem('tuition_active_child') || 's1';
  });

  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    const saved = localStorage.getItem('tuition_school_info');
    return saved ? JSON.parse(saved) : initialSchoolInfo;
  });

  const [schoolMembers, setSchoolMembers] = useState<SchoolMember[]>(() => {
    const saved = localStorage.getItem('tuition_school_members');
    return saved ? JSON.parse(saved) : initialSchoolMembers;
  });

  const currentParent = {
    id: 'p1',
    fullName: 'Kumar Raman (Parent)',
    email: 'kumar.raman@gmail.com'
  };

  const currentStudent: StudentProfile = {
    id: 's1',
    name: 'Aravind Kumar',
    grade: 'Grade 10',
    section: 'State Board Batch A',
    guardianName: 'Kumar Raman',
    guardianPhone: '+91 98765 43210',
    enrolledCourses: ['Grade 10 Mathematics', 'Physics Fundamentals', 'Chemistry & Reactions', 'Biology & Life Systems'],
    overallAttendancePercent: 91.4
  };

  const currentTeacher: TeacherProfile = {
    id: 't1',
    name: 'Mr. Kingslin',
    subjects: ['Mathematics', 'Advanced Calculus', 'Science Foundation'],
    assignedBatches: ['Grade 10 Mathematics', 'Physics Fundamentals', 'Chemistry & Reactions', 'Biology & Life Systems'],
    email: 'kingslin@tuitionplatform.internal',
    phone: '+91 98765 12345'
  };

  useEffect(() => {
    localStorage.setItem('tuition_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('tuition_batches', JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem('tuition_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('tuition_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('tuition_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('tuition_fees', JSON.stringify(feeRecords));
  }, [feeRecords]);

  useEffect(() => {
    localStorage.setItem('tuition_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('tuition_doubts', JSON.stringify(doubts));
  }, [doubts]);

  useEffect(() => {
    localStorage.setItem('tuition_resources', JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem('tuition_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('tuition_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('tuition_schedule_slots', JSON.stringify(scheduleSlots));
  }, [scheduleSlots]);

  useEffect(() => {
    localStorage.setItem('tuition_parent_code', JSON.stringify(parentLinkCode));
  }, [parentLinkCode]);

  useEffect(() => {
    localStorage.setItem('tuition_linked_parents', JSON.stringify(linkedParents));
  }, [linkedParents]);

  useEffect(() => {
    localStorage.setItem('tuition_linked_children', JSON.stringify(linkedChildren));
  }, [linkedChildren]);

  useEffect(() => {
    localStorage.setItem('tuition_active_child', activeChildId);
  }, [activeChildId]);

  useEffect(() => {
    localStorage.setItem('tuition_school_info', JSON.stringify(schoolInfo));
  }, [schoolInfo]);

  useEffect(() => {
    localStorage.setItem('tuition_school_members', JSON.stringify(schoolMembers));
  }, [schoolMembers]);

  const addBatch = (batchData: Omit<CourseBatch, 'id'>) => {
    const newBatch: CourseBatch = {
      ...batchData,
      id: `b-${Date.now()}`
    };
    setBatches((prev) => [...prev, newBatch]);

    // Dispatch broadcast notification about new subject class
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

        // Conflict occurs if intervals overlap: newStart < slotEnd && newEnd > slotStart
        if (newStart < slotEnd && newEnd > slotStart) {
          return { isAvailable: false, conflictingSlot: slot };
        }
      }
    }
    return { isAvailable: true };
  };

  const addScheduleSlot = (slotData: Omit<ScheduleSlot, 'id'>) => {
    const newSlot: ScheduleSlot = {
      ...slotData,
      id: `slot-${Date.now()}`
    };
    setScheduleSlots((prev) => [newSlot, ...prev]);

    // Dispatch notification to students about class scheduling
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

  const updateScheduleSlot = (id: string, updates: Partial<ScheduleSlot>) => {
    setScheduleSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const deleteScheduleSlot = (id: string) => {
    setScheduleSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const addNotification = (notif: Omit<StudentNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: StudentNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setLatestNotificationToast(newNotif);
    // Auto-dismiss transient toast after 6 seconds
    setTimeout(() => {
      setLatestNotificationToast((curr) => (curr?.id === newNotif.id ? null : curr));
    }, 6000);
  };

  const dismissToast = () => {
    setLatestNotificationToast(null);
  };

  const markAttendance = (request: MarkAttendanceRequest) => {
    setAttendanceRecords((prev) => {
      const newIds = new Set(request.records.map((r) => `${r.batchId}-${r.studentId}-${r.date}`));
      const filtered = prev.filter((r) => !newIds.has(`${r.batchId}-${r.studentId}-${r.date}`));
      return [...request.records, ...filtered];
    });
  };

  const addAssignment = (assignmentData: Omit<Assignment, 'id'>) => {
    const newAssignment: Assignment = {
      ...assignmentData,
      id: `as-${Date.now()}`,
      submissionsCount: 0
    };
    setAssignments((prev) => [newAssignment, ...prev]);

    const targetBatch = batches.find((b) => b.id === assignmentData.batchId);
    const batchTitle = targetBatch ? targetBatch.title : 'All Batches';

    // Alert students about new homework assignment
    addNotification({
      type: 'HOMEWORK_POSTED',
      title: `New Homework: ${assignmentData.title}`,
      message: `${assignmentData.subject ? `${assignmentData.subject} · ` : ''}Due: ${assignmentData.dueDate}. Maximum marks: ${assignmentData.maxScore}.`,
      targetBatchTitle: batchTitle,
      referenceId: newAssignment.id,
      actionScreen: 'ASSIGNMENTS',
      authorName: currentTeacher.name
    });
  };

  const submitAssignment = (
    assignmentId: string,
    note?: string,
    answerSheetFile?: string,
    answerSheetSize?: string
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
              submissionsCount: (a.submissionsCount || 0) + 1
            }
          : a
      )
    );

    const newSub: StudentSubmission = {
      id: `sub-${Date.now()}`,
      assignmentId,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      submittedAt: 'Just now',
      content: note || 'Completed all exercises.',
      scoreEarned: null,
      status: 'SUBMITTED',
      answerSheetFile: finalAnswerSheetFile,
      answerSheetSize: finalAnswerSheetSize
    };
    setSubmissions((prev) => [newSub, ...prev]);
  };

  const gradeSubmission = (submissionId: string, score: number, feedback: string) => {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === submissionId) {
          if (s.studentId === currentStudent.id) {
            setAssignments((aPrev) =>
              aPrev.map((a) =>
                a.id === s.assignmentId
                  ? { ...a, scoreEarned: score, teacherFeedback: feedback }
                  : a
              )
            );
          }
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
  };

  const payFee = (invoiceId: string, paymentMethod = 'Online Portal (UPI)') => {
    const nowStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    setFeeRecords((prev) =>
      prev.map((f) =>
        f.invoiceId === invoiceId
          ? {
              ...f,
              status: 'PAID',
              amountPaid: f.amountDue,
              paymentMethod,
              paidAt: nowStr
            }
          : f
      )
    );
  };

  const addAnnouncement = (item: Omit<Announcement, 'id' | 'timestamp'>) => {
    const newAnnouncement: Announcement = {
      ...item,
      id: `ann-${Date.now()}`,
      timestamp: 'Just now'
    };
    setAnnouncements((prev) => [newAnnouncement, ...prev]);
  };

  const askDoubt = (doubt: Omit<StudentDoubt, 'id' | 'askedAt' | 'isResolved'>) => {
    const newDoubt: StudentDoubt = {
      ...doubt,
      id: `dbt-${Date.now()}`,
      askedAt: 'Just now',
      isResolved: false
    };
    setDoubts((prev) => [newDoubt, ...prev]);
  };

  const replyDoubt = (doubtId: string, reply: string) => {
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
  };

  const addResource = (res: Omit<EducationalResource, 'id' | 'uploadedAt'>) => {
    const newRes: EducationalResource = {
      ...res,
      id: `res-${Date.now()}`,
      uploadedAt: 'Just now'
    };
    setResources((prev) => [newRes, ...prev]);

    // Alert students about new shared educational material
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

  const deleteResource = (resourceId: string) => {
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
  };

  const createParentLinkCode = (): ParentLinkCode => {
    const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newCode: ParentLinkCode = {
      code: `P-${randomChars}`,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      expiresAt: 'In 48 hours',
      createdAt: 'Just now'
    };
    setParentLinkCode(newCode);
    return newCode;
  };

  const revokeParent = (parentId: string) => {
    setLinkedParents((prev) => prev.filter((p) => p.id !== parentId));
  };

  const linkChildWithCode = (code: string): { success: boolean; message: string; child?: ChildProfile } => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Please enter a 6-character parent link code.' };
    }
    // Check if code matches current student code or sample codes
    if (cleanCode === parentLinkCode?.code || cleanCode === 'P-94821') {
      const existing = linkedChildren.find((c) => c.id === 's1');
      if (existing) {
        return { success: true, message: 'Aravind Kumar is already linked to your account.', child: existing };
      }
      const newChild: ChildProfile = {
        id: 's1',
        fullName: 'Aravind Kumar',
        grade: 'Grade 10',
        section: 'State Board Batch A',
        schoolName: schoolInfo.name
      };
      setLinkedChildren((prev) => [...prev, newChild]);
      setActiveChildId('s1');
      return { success: true, message: 'Successfully linked Aravind Kumar!', child: newChild };
    } else if (cleanCode === 'P-DIVYA' || cleanCode === 'P-72819') {
      const existing = linkedChildren.find((c) => c.id === 's2');
      if (existing) {
        return { success: true, message: 'Divya Sharma is already linked to your account.', child: existing };
      }
      const newChild: ChildProfile = {
        id: 's2',
        fullName: 'Divya Sharma',
        grade: 'Grade 10',
        section: 'State Board Batch A',
        schoolName: schoolInfo.name
      };
      setLinkedChildren((prev) => [...prev, newChild]);
      setActiveChildId('s2');
      return { success: true, message: 'Successfully linked Divya Sharma!', child: newChild };
    } else if (cleanCode.startsWith('P-') && cleanCode.length >= 5) {
      const customChild: ChildProfile = {
        id: `s-${Date.now()}`,
        fullName: `Student (${cleanCode})`,
        grade: 'Grade 10',
        section: 'Batch A',
        schoolName: schoolInfo.name
      };
      setLinkedChildren((prev) => [...prev, customChild]);
      setActiveChildId(customChild.id);
      return { success: true, message: `Successfully linked child with code ${cleanCode}!`, child: customChild };
    }
    return { success: false, message: 'Invalid or expired parent link code. Ask your student to generate a fresh code.' };
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

  const updateSchoolName = (name: string) => {
    setSchoolInfo((prev) => ({ ...prev, name: name.trim() }));
  };

  const regenerateSchoolCodes = (which: 'student' | 'teacher' | 'both' = 'both') => {
    const randomHex = () => Math.random().toString(36).substring(2, 8).toUpperCase();
    setSchoolInfo((prev) => ({
      ...prev,
      studentCode: which === 'teacher' ? prev.studentCode : `S-${randomHex()}`,
      teacherCode: which === 'student' ? prev.teacherCode : `T-${randomHex()}`
    }));
  };

  const resetToDefaults = () => {
    localStorage.clear();
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
  };

  return (
    <TuitionContext.Provider
      value={{
        role,
        setRole,
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
        regenerateSchoolCodes,
        schoolMembers,
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
