package com.tuition.core.network

import com.google.gson.annotations.SerializedName

enum class UserRole {
    STUDENT,
    TEACHER,
    ADMIN
}

enum class AttendanceStatus {
    PRESENT,
    ABSENT,
    LATE
}

enum class SubmissionStatus {
    PENDING,
    SUBMITTED,
    GRADED
}

data class UserProfile(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("email") val email: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("role") val role: UserRole,
    @SerializedName("profilePicUrl") val profilePicUrl: String? = null
)

data class TuitionBatch(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("subject") val subject: String,
    @SerializedName("grade") val grade: String,
    @SerializedName("teacherName") val teacherName: String,
    @SerializedName("scheduleTime") val scheduleTime: String,
    @SerializedName("monthlyFee") val monthlyFee: Double,
    @SerializedName("enrolledStudents") val enrolledStudents: Int = 0,
    @SerializedName("maxCapacity") val maxCapacity: Int = 30,
    @SerializedName("meetingUrl") val meetingUrl: String? = null,
    @SerializedName("isLiveNow") val isLiveNow: Boolean = false
)

data class Assignment(
    @SerializedName("id") val id: String,
    @SerializedName("batchId") val batchId: String,
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String,
    @SerializedName("dueDate") val dueDate: String,
    @SerializedName("totalMarks") val totalMarks: Int = 100,
    @SerializedName("status") val status: SubmissionStatus = SubmissionStatus.PENDING,
    @SerializedName("obtainedMarks") val obtainedMarks: Int? = null,
    @SerializedName("teacherFeedback") val teacherFeedback: String? = null
)

data class AssignmentSubmission(
    @SerializedName("id") val id: String,
    @SerializedName("assignmentId") val assignmentId: String,
    @SerializedName("studentId") val studentId: String,
    @SerializedName("studentName") val studentName: String,
    @SerializedName("submissionText") val submissionText: String,
    @SerializedName("fileUrl") val fileUrl: String? = null,
    @SerializedName("submissionDate") val submissionDate: String,
    @SerializedName("obtainedMarks") val obtainedMarks: Int? = null,
    @SerializedName("feedback") val feedback: String? = null
)

data class AttendanceRecord(
    @SerializedName("id") val id: String,
    @SerializedName("batchId") val batchId: String,
    @SerializedName("studentId") val studentId: String,
    @SerializedName("studentName") val studentName: String,
    @SerializedName("date") val date: String,
    @SerializedName("status") val status: AttendanceStatus
)

data class Announcement(
    @SerializedName("id") val id: String,
    @SerializedName("batchId") val batchId: String?,
    @SerializedName("authorName") val authorName: String,
    @SerializedName("title") val title: String,
    @SerializedName("content") val content: String,
    @SerializedName("timestamp") val timestamp: String,
    @SerializedName("isHighPriority") val isHighPriority: Boolean = false
)

data class ApiResponse<T>(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String?,
    @SerializedName("data") val data: T?
)

data class MarkAttendanceRequest(
    @SerializedName("batchId") val batchId: String,
    @SerializedName("date") val date: String,
    @SerializedName("records") val records: List<StudentAttendanceInput>
)

data class StudentAttendanceInput(
    @SerializedName("studentId") val studentId: String,
    @SerializedName("status") val status: AttendanceStatus
)

data class CreateAssignmentRequest(
    @SerializedName("batchId") val batchId: String,
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String,
    @SerializedName("dueDate") val dueDate: String,
    @SerializedName("totalMarks") val totalMarks: Int
)

data class GradeSubmissionRequest(
    @SerializedName("submissionId") val submissionId: String,
    @SerializedName("marks") val marks: Int,
    @SerializedName("feedback") val feedback: String
)
