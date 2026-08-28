package com.tuition.core.network

import kotlinx.serialization.Serializable

@Serializable
enum class UserRole {
    STUDENT,
    TEACHER,
    ADMIN
}

@Serializable
enum class AttendanceStatus {
    PRESENT,
    ABSENT,
    LATE,
    EXCUSED
}

@Serializable
enum class FeePaymentStatus {
    PAID,
    PENDING,
    OVERDUE
}

@Serializable
data class AuthRequest(
    val email: String,
    val passwordHash: String,
    val role: UserRole
)

@Serializable
data class AuthResponse(
    val token: String,
    val userId: String,
    val fullName: String,
    val email: String,
    val role: UserRole
)

@Serializable
data class StudentProfile(
    val id: String,
    val name: String,
    val grade: String,
    val section: String,
    val guardianName: String,
    val guardianPhone: String,
    val enrolledCourses: List<String> = emptyList(),
    val overallAttendancePercent: Double = 0.0
)

@Serializable
data class TeacherProfile(
    val id: String,
    val name: String,
    val subjects: List<String> = emptyList(),
    val assignedBatches: List<String> = emptyList(),
    val email: String,
    val phone: String
)

@Serializable
data class CourseBatch(
    val id: String,
    val title: String,
    val subject: String,
    val teacherName: String,
    val scheduleTime: String,
    val activeStudentCount: Int,
    val roomOrMeetingLink: String
)

@Serializable
data class AttendanceRecord(
    val id: String,
    val batchId: String,
    val studentId: String,
    val studentName: String,
    val date: String,
    val status: AttendanceStatus,
    val notes: String = ""
)

@Serializable
data class MarkAttendanceRequest(
    val batchId: String,
    val date: String,
    val records: List<AttendanceRecord>
)

@Serializable
data class Assignment(
    val id: String,
    val batchId: String,
    val title: String,
    val description: String,
    val dueDate: String,
    val maxScore: Int,
    val isSubmitted: Boolean = false,
    val scoreEarned: Int? = null
)

@Serializable
data class FeeRecord(
    val invoiceId: String,
    val studentId: String,
    val studentName: String,
    val monthYear: String,
    val amountDue: Double,
    val amountPaid: Double,
    val status: FeePaymentStatus,
    val dueDate: String
)

@Serializable
data class Announcement(
    val id: String,
    val title: String,
    val message: String,
    val authorName: String,
    val timestamp: String,
    val priority: String = "NORMAL"
)
