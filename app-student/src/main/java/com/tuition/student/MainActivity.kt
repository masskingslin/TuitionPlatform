package com.tuition.student

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tuition.core.network.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(
                colorScheme = lightColorScheme(
                    primary = Color(0xFF1E88E5),
                    secondary = Color(0xFF26A69A),
                    background = Color(0xFFF8F9FA),
                    surface = Color.White
                )
            ) {
                StudentAppRoot()
            }
        }
    }
}

enum class StudentNavScreen(val title: String, val icon: ImageVector) {
    DASHBOARD("Dashboard", Icons.Default.Dashboard),
    ATTENDANCE("Attendance", Icons.Default.FactCheck),
    ASSIGNMENTS("Assignments", Icons.Default.Assignment),
    FEES("Fees", Icons.Default.Payment)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentAppRoot() {
    var selectedScreen by remember { mutableStateOf(StudentNavScreen.DASHBOARD) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(selectedScreen.title, fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = Color.White
                )
            )
        },
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                StudentNavScreen.values().forEach { screen ->
                    NavigationBarItem(
                        selected = selectedScreen == screen,
                        onClick = { selectedScreen = screen },
                        icon = { Icon(screen.icon, contentDescription = screen.title) },
                        label = { Text(screen.title) }
                    )
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            when (selectedScreen) {
                StudentNavScreen.DASHBOARD -> StudentDashboardScreen()
                StudentNavScreen.ATTENDANCE -> StudentAttendanceScreen()
                StudentNavScreen.ASSIGNMENTS -> StudentAssignmentsScreen()
                StudentNavScreen.FEES -> StudentFeeScreen()
            }
        }
    }
}

@Composable
fun StudentDashboardScreen() {
    val sampleBatches = remember {
        listOf(
            CourseBatch("b1", "Grade 10 Mathematics", "Math", "Mr. Kingslin", "05:00 PM - 06:30 PM", 18, "Room 101"),
            CourseBatch("b2", "Physics Fundamentals", "Physics", "Dr. Wilson", "06:45 PM - 08:00 PM", 14, "Lab 2"),
            CourseBatch("b3", "Chemistry & Reactions", "Chemistry", "Ms. Stella", "Tomorrow 04:00 PM", 12, "Room 104")
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Welcome back, Student!", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("Class 10th - State Board Batch | Attendance: 94.5%", color = Color.White.copy(alpha = 0.9f))
                }
            }
        }

        item {
            Text("Your Scheduled Classes", fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
        }

        items(sampleBatches) { batch ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(batch.title, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text("Instructor: ${batch.teacherName}", color = Color.Gray, fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("Time: ${batch.scheduleTime}", color = MaterialTheme.colorScheme.secondary, fontSize = 13.sp)
                    }
                    Button(
                        onClick = { /* Launch Live Session or View Details */ },
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Enter")
                    }
                }
            }
        }
    }
}

@Composable
fun StudentAttendanceScreen() {
    val sampleRecords = remember {
        listOf(
            AttendanceRecord("a1", "b1", "s1", "Self", "2026-08-28", AttendanceStatus.PRESENT),
            AttendanceRecord("a2", "b1", "s1", "Self", "2026-08-27", AttendanceStatus.PRESENT),
            AttendanceRecord("a3", "b1", "s1", "Self", "2026-08-26", AttendanceStatus.LATE, notes = "Late by 10 mins"),
            AttendanceRecord("a4", "b1", "s1", "Self", "2026-08-25", AttendanceStatus.ABSENT, notes = "Sick leave notified")
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F5E9))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Total Attendance Percentage", fontWeight = FontWeight.Medium)
                    Text("92.8%", fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32), fontSize = 18.sp)
                }
            }
        }

        items(sampleRecords) { record ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(record.date, fontWeight = FontWeight.Bold)
                        if (record.notes.isNotBlank()) {
                            Text(record.notes, fontSize = 12.sp, color = Color.Gray)
                        }
                    }
                    val statusColor = when (record.status) {
                        AttendanceStatus.PRESENT -> Color(0xFF2E7D32)
                        AttendanceStatus.ABSENT -> Color(0xFFC62828)
                        AttendanceStatus.LATE -> Color(0xFFEF6C00)
                        AttendanceStatus.EXCUSED -> Color(0xFF1565C0)
                    }
                    Text(record.status.name, color = statusColor, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun StudentAssignmentsScreen() {
    val assignments = remember {
        listOf(
            Assignment("as1", "b1", "Trigonometry Exercise 4.2", "Complete questions 1 to 15 with full derivations.", "Tomorrow, 11:59 PM", 25, false),
            Assignment("as2", "b2", "Optics Ray Diagrams", "Draw convex and concave mirror reflections.", "2026-08-30", 20, true, 19),
            Assignment("as3", "b3", "Chemical Equilibrium Worksheet", "Practice worksheet on Le Chatelier's principle.", "2026-09-02", 30, false)
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(assignments) { item ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(10.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(item.title, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text(
                            if (item.isSubmitted) "Submitted (${item.scoreEarned}/${item.maxScore})" else "Pending",
                            color = if (item.isSubmitted) Color(0xFF2E7D32) else Color(0xFFD32F2F),
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(item.description, color = Color.DarkGray, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Due: ${item.dueDate}", fontSize = 12.sp, color = Color.Gray)
                }
            }
        }
    }
}

@Composable
fun StudentFeeScreen() {
    val fees = remember {
        listOf(
            FeeRecord("inv-08-26", "s1", "Self", "August 2026", 1500.0, 1500.0, FeePaymentStatus.PAID, "2026-08-10"),
            FeeRecord("inv-09-26", "s1", "Self", "September 2026", 1500.0, 0.0, FeePaymentStatus.PENDING, "2026-09-10")
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(fees) { fee ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(10.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(fee.monthYear, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text("Due Date: ${fee.dueDate}", color = Color.Gray, fontSize = 13.sp)
                        Text("Amount: ₹${fee.amountDue}", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                    }
                    Text(
                        fee.status.name,
                        fontWeight = FontWeight.Bold,
                        color = if (fee.status == FeePaymentStatus.PAID) Color(0xFF2E7D32) else Color(0xFFEF6C00)
                    )
                }
            }
        }
    }
}
