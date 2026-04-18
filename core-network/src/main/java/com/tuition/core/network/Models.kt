package com.tuition.core.network

// Models for Login and Registration
data class AuthRequest(
    val mobileNumber: String,
    val password: String,
    val fullName: String? = null // Only needed for registration
)

data class AuthResponse(
    val token: String,
    val userId: String,
    val role: String,
    val message: String
)

// Model for Teacher editing a Student
data class EditStudentRequest(
    val newFullName: String,
    val newPassword: String? = null // Optional: only if the teacher resets it
)

// General Response Message
data class GenericResponse(
    val success: Boolean,
    val message: String
)
