package com.tuition.core.network

import com.google.gson.annotations.SerializedName

enum class UserRole {
    @SerializedName("student") STUDENT,
    @SerializedName("teacher") TEACHER,
    @SerializedName("admin") ADMIN
}

enum class BookingStatus {
    @SerializedName("pending") PENDING,
    @SerializedName("confirmed") CONFIRMED,
    @SerializedName("completed") COMPLETED,
    @SerializedName("cancelled") CANCELLED
}

data class User(
    val id: String,
    val name: String,
    val email: String,
    val role: UserRole,
    val phone: String = ""
)

data class TuitionClass(
    val id: String,
    val title: String,
    val subject: String,
    val gradeLevel: String,
    val teacherId: String,
    val teacherName: String,
    val description: String,
    val schedule: String,
    val monthlyFee: Double,
    val meetingUrl: String = "",
    val enrolledCount: Int = 0,
    val maxCapacity: Int = 30
)

data class Booking(
    val id: String,
    val classId: String,
    val classTitle: String,
    val studentId: String,
    val studentName: String,
    val bookingDate: String,
    val status: BookingStatus,
    val monthlyFee: Double
)

data class Assignment(
    val id: String,
    val classId: String,
    val title: String,
    val description: String,
    val dueDate: String,
    val maxScore: Int = 100
)

data class Submission(
    val id: String,
    val assignmentId: String,
    val studentId: String,
    val studentName: String,
    val content: String,
    val submittedAt: String,
    val score: Int? = null,
    val feedback: String? = null
)

data class AttendanceRecord(
    val id: String,
    val classId: String,
    val studentId: String,
    val studentName: String,
    val date: String,
    val isPresent: Boolean
)

data class ApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val data: T? = null
)
