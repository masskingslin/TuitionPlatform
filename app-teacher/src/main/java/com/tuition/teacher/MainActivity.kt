package com.tuition.teacher

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
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
                    primary = Color(0xFF00695C),
                    secondary = Color(0xFF0288D1),
                    background = Color(0xFFF4F6F8),
                    surface = Color.White
                )
            ) {
                TeacherAppRoot()
            }
        }
    }
}

enum class TeacherNavScreen(val title: String, val icon: ImageVector) {
    BATCHES("Batches", Icons.Default.Class),
    ATTENDANCE("Mark Attendance", Icons.Default.CheckCircle),
    HOMEWORK("Assignments", Icons.Default.AddBox),
    FEE_TRACKER("Fee Tracker", Icons.Default.ReceiptLong)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherAppRoot() {
    var selectedScreen by remember { mutableStateOf(TeacherNavScreen.BATCHES) }

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
                TeacherNavScreen.values().forEach { screen ->
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
                TeacherNavScreen.BATCHES -> TeacherBatchesScreen()
                TeacherNavScreen.ATTENDANCE -> TeacherAttendanceScreen()
                TeacherNavScreen.HOMEWORK -> TeacherAssignmentsScreen()
                TeacherNavScreen.FEE_TRACKER -> TeacherFeeTrackerScreen()
            }
        }
    }
}

@Composable
fun TeacherBatchesScreen() {
    val batches = remember {
        listOf(
            CourseBatch("b1", "Grade 10 - Mathematics", "Math", "Instructor", "05:00 PM - 06:30 PM", 18, "Room 101"),
            CourseBatch("b2", "Grade 11 - Advanced Calculus", "Math", "Instructor", "06:45 PM - 08:00 PM", 12, "Room 102"),
            CourseBatch("b3", "Grade 9 - Foundation Science", "Science", "Instructor", "Tomorrow 04:00 PM", 22, "Room 101")
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Teacher Console", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("3 Active Batches • 52 Enrolled Students", color = Color.White.copy(alpha = 0.9f))
                }
            }
        }

        items(batches) { batch ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(batch.title, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Badge { Text("${batch.activeStudentCount} Students") }
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("Timing: ${batch.scheduleTime}", color = Color.DarkGray, fontSize = 13.sp)
                    Text("Location/Link: ${batch.roomOrMeetingLink}", color = Color.Gray, fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
fun TeacherAttendanceScreen() {
    val students = remember {
        mutableStateListOf(
            Pair("Aravind Kumar", AttendanceStatus.PRESENT),
            Pair("Divya Sharma", AttendanceStatus.PRESENT),
            Pair("Ganesh Raman", AttendanceStatus.ABSENT),
            Pair("Kavitha Selvam", AttendanceStatus.PRESENT),
            Pair("Pradeep Raj", AttendanceStatus.LATE)
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text("Grade 10 - Mathematics (Today)", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        Spacer(modifier = Modifier.height(12.dp))

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(students.size) { index ->
                val (name, status) = students[index]
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(name, fontWeight = FontWeight.Medium)
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            FilterChip(
                                selected = status == AttendanceStatus.PRESENT,
                                onClick = { students[index] = Pair(name, AttendanceStatus.PRESENT) },
                                label = { Text("P") }
                            )
                            FilterChip(
                                selected = status == AttendanceStatus.ABSENT,
                                onClick = { students[index] = Pair(name, AttendanceStatus.ABSENT) },
                                label = { Text("A") }
                            )
                            FilterChip(
                                selected = status == AttendanceStatus.LATE,
                                onClick = { students[index] = Pair(name, AttendanceStatus.LATE) },
                                label = { Text("L") }
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))
        Button(
            onClick = { /* Submit attendance payload */ },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text("Save & Notify Parents")
        }
    }
}

@Composable
fun TeacherAssignmentsScreen() {
    var assignmentTitle by remember { mutableStateOf("") }
    var assignmentDesc by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Create New Homework / Task", fontWeight = FontWeight.Bold, fontSize = 18.sp)

        OutlinedTextField(
            value = assignmentTitle,
            onValueChange = { assignmentTitle = it },
            label = { Text("Assignment Title") },
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = assignmentDesc,
            onValueChange = { assignmentDesc = it },
            label = { Text("Instructions & Problems") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 3
        )

        Button(
            onClick = {
                assignmentTitle = ""
                assignmentDesc = ""
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(8.dp)
        ) {
            Icon(Icons.Default.Upload, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Publish to Batch")
        }
    }
}

@Composable
fun TeacherFeeTrackerScreen() {
    val feeRecords = remember {
        listOf(
            FeeRecord("inv-01", "s1", "Aravind Kumar", "August 2026", 1500.0, 1500.0, FeePaymentStatus.PAID, "2026-08-10"),
            FeeRecord("inv-02", "s2", "Divya Sharma", "August 2026", 1500.0, 1500.0, FeePaymentStatus.PAID, "2026-08-10"),
            FeeRecord("inv-03", "s3", "Ganesh Raman", "August 2026", 1500.0, 0.0, FeePaymentStatus.OVERDUE, "2026-08-10"),
            FeeRecord("inv-04", "s4", "Kavitha Selvam", "August 2026", 1500.0, 0.0, FeePaymentStatus.PENDING, "2026-08-15")
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFECEFF1))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Total Collected: ₹3,000", fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32))
                    Text("Pending: ₹3,000", fontWeight = FontWeight.Bold, color = Color(0xFFC62828))
                }
            }
        }

        items(feeRecords) { fee ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(fee.studentName, fontWeight = FontWeight.Bold)
                        Text("Invoice: ${fee.invoiceId} • ₹${fee.amountDue}", fontSize = 13.sp, color = Color.Gray)
                    }
                    Text(
                        fee.status.name,
                        fontWeight = FontWeight.Bold,
                        color = when (fee.status) {
                            FeePaymentStatus.PAID -> Color(0xFF2E7D32)
                            FeePaymentStatus.PENDING -> Color(0xFFEF6C00)
                            FeePaymentStatus.OVERDUE -> Color(0xFFC62828)
                        }
                    )
                }
            }
        }
    }
}
