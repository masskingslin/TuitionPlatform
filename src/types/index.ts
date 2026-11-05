export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PARENT';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export type FeePaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface AuthRequest {
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  guardianName?: string;
  guardianPhone?: string;
  schoolId?: string;
  studentId?: string;
  teacherId?: string;
  parentId?: string;
  linkedChildIds?: string[];
  createdAt?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  grade: string;
  section: string;
  guardianName: string;
  guardianPhone: string;
  enrolledCourses: string[];
  overallAttendancePercent: number;
}

export interface TeacherProfile {
  id: string;
  name: string;
  subjects: string[];
  assignedBatches: string[];
  email: string;
  phone: string;
}

export interface CourseBatch {
  id: string;
  title: string;
  subject: string;
  teacherName: string;
  scheduleTime: string;
  days: string[];
  activeStudentCount: number;
  roomOrMeetingLink: string;
  syllabusProgress: number;
  nextTopic: string;
  gradeLevel?: string;
  textbookOrSyllabus?: string;
}

export interface AttendanceRecord {
  id: string;
  batchId: string;
  studentId: string;
  studentName: string;
  date: string;
  status: AttendanceStatus;
  notes: string;
}

export interface MarkAttendanceRequest {
  batchId: string;
  date: string;
  records: AttendanceRecord[];
}

export interface StudentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  content: string;
  scoreEarned?: number | null;
  teacherFeedback?: string;
  status: 'SUBMITTED' | 'GRADED';
  answerSheetFile?: string;
  answerSheetSize?: string;
  answerSheetUrl?: string;
  evaluatedAt?: string;
}

export interface Assignment {
  id: string;
  batchId: string;
  title: string;
  subject?: string;
  description: string;
  dueDate: string;
  maxScore: number;
  isSubmitted: boolean;
  scoreEarned?: number | null;
  submissionNote?: string;
  submissionDate?: string;
  teacherFeedback?: string;
  submissionsCount?: number;
  referenceFile?: string;
  questionPaperFile?: string;
  questionPaperSize?: string;
  questionPaperUrl?: string;
  answerSheetFile?: string;
  answerSheetSize?: string;
  answerSheetUrl?: string;
}

export interface FeeRecord {
  invoiceId: string;
  studentId: string;
  studentName: string;
  monthYear: string;
  amountDue: number;
  amountPaid: number;
  status: FeePaymentStatus;
  dueDate: string;
  paymentMethod?: string;
  paidAt?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  approvalStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  manualPaymentClaimed?: boolean;
  manualPaymentUtr?: string;
  manualPaymentSubmittedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  authorName: string;
  timestamp: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface TestResult {
  id: string;
  studentId: string;
  studentName?: string;
  batchId: string;
  testTitle: string;
  subject: string;
  date: string;
  maxMarks: number;
  marksScored: number;
  highestBatchMarks: number;
  percentile: number;
  remarks: string;
}

export interface StudentDoubt {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  topic: string;
  question: string;
  askedAt: string;
  reply?: string;
  repliedBy?: string;
  repliedAt?: string;
  isResolved: boolean;
}

export type ResourceType = 'PDF' | 'LINK' | 'VIDEO' | 'CHEATSHEET';

export interface EducationalResource {
  id: string;
  batchId: string; // 'ALL' or specific batchId
  batchTitle?: string;
  title: string;
  subject: string;
  type: ResourceType;
  urlOrFilename: string;
  fileUrl?: string;
  fileName?: string;
  description: string;
  authorName: string;
  uploadedAt: string;
  fileSizeOrDuration?: string;
  tags?: string[];
}

export type NotificationType = 'HOMEWORK_POSTED' | 'RESOURCE_ADDED' | 'ANNOUNCEMENT' | 'GENERAL';

export interface StudentNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetBatchTitle?: string;
  referenceId?: string;
  actionScreen?: StudentNavScreen;
  authorName: string;
}

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface ClassroomRoom {
  id: string;
  name: string;
  building: string;
  capacity: number;
  equipment: string[];
  isLab: boolean;
  isAvailableNow?: boolean;
}

export interface ScheduleSlot {
  id: string;
  batchId: string;
  batchTitle: string;
  subject: string;
  teacherName: string;
  day: DayOfWeek;
  startTime: string; // 24-hr format e.g. "17:00"
  endTime: string;   // 24-hr format e.g. "18:30"
  displayTime: string; // e.g. "05:00 PM - 06:30 PM"
  roomId: string;
  roomName: string;
  locationNotes: string;
  isOnline?: boolean;
  activeStudents: number;
}

export type StudentNavScreen = 'DASHBOARD' | 'ATTENDANCE' | 'ASSIGNMENTS' | 'CALENDAR' | 'RESOURCES' | 'TESTS' | 'FEES';
export type TeacherNavScreen = 'BATCHES' | 'CALENDAR' | 'ATTENDANCE' | 'HOMEWORK' | 'TESTS' | 'RESOURCES' | 'FEE_TRACKER' | 'DOUBTS' | 'SCHOOL' | 'ANALYTICS';
export type ParentNavScreen = 'OVERVIEW' | 'ATTENDANCE' | 'HOMEWORK' | 'TESTS' | 'FEES' | 'ACCOUNT';

export interface ParentLinkCode {
  code: string;
  studentId: string;
  studentName: string;
  expiresAt: string;
  createdAt: string;
  expiresAtMs?: number;
  used?: boolean;
}

export interface LinkedParent {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  linkedAt: string;
}

export interface ChildProfile {
  id: string;
  fullName: string;
  grade: string;
  section: string;
  avatarUrl?: string;
  schoolName: string;
}

export interface SchoolInfo {
  id: string;
  name: string;
  isSchoolAdmin: boolean;
  studentCode: string;
  teacherCode: string;
  teacherCount: number;
  studentCount: number;
  parentCount: number;
  email?: string;
  phone?: string;
  address?: string;
  academicYear?: string;
}

export interface SchoolMember {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isSchoolAdmin: boolean;
  avatarUrl?: string;
  joinedAt: string;
}

export type MessageChannel = 'SMS' | 'WHATSAPP' | 'FCM_PUSH';
export type MessageType = 'ATTENDANCE_ALERT' | 'FEE_REMINDER' | 'HOMEWORK' | 'ANNOUNCEMENT';
export type MessageDeliveryStatus = 'DELIVERED' | 'SENT' | 'FAILED' | 'SIMULATED';

export interface NotificationLog {
  id: string;
  channel: MessageChannel;
  messageType: MessageType;
  recipientPhone?: string;
  recipientName?: string;
  studentId?: string;
  studentName?: string;
  title?: string;
  content: string;
  provider: 'MSG91' | 'WHATSAPP_CLOUD' | 'FCM' | 'SYSTEM_DISPATCHER';
  providerMessageId?: string;
  status: MessageDeliveryStatus;
  sentAt: string;
  error?: string;
  metadata?: Record<string, any>;
}



