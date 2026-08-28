package com.tuition.student

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.tuition.core.network.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class StudentViewModel : ViewModel() {
    private val _batches = MutableStateFlow<List<TuitionBatch>>(emptyList())
    val batches: StateFlow<List<TuitionBatch>> = _batches.asStateFlow()

    private val _assignments = MutableStateFlow<List<Assignment>>(emptyList())
    val assignments: StateFlow<List<Assignment>> = _assignments.asStateFlow()

    private val _announcements = MutableStateFlow<List<Announcement>>(emptyList())
    val announcements: StateFlow<List<Announcement>> = _announcements.asStateFlow()

    private val _attendancePercentage = MutableStateFlow(92)
    val attendancePercentage: StateFlow<Int> = _attendancePercentage.asStateFlow()

    init {
        loadMockData()
    }

    private fun loadMockData() {
        _batches.value = listOf(
            TuitionBatch(
                id = "b1",
                title = "Class 10 - Advanced Mathematics",
                subject = "Mathematics",
                grade = "Grade 10",
                teacherName = "Mr. Kingslin",
                scheduleTime = "Mon, Wed, Fri - 5:30 PM",
                monthlyFee = 1500.0,
                enrolledStudents = 24,
                meetingUrl = "https://meet.google.com/abc-defg-hij",
                isLiveNow = true
            ),
            TuitionBatch(
                id = "b2",
                title = "Class 10 - Physics & Chemistry",
                subject = "Science",
                grade = "Grade 10",
                teacherName = "Dr. Johnson",
                scheduleTime = "Tue, Thu, Sat - 6:00 PM",
                monthlyFee = 1800.0,
                enrolledStudents = 18,
                isLiveNow = false
            )
        )

        _assignments = MutableStateFlow(
            listOf(
                Assignment(
                    id = "a1",
                    batchId = "b1",
                    title = "Quadratic Equations Problem Set 4",
                    description = "Solve all questions from Exercise 4.2 in your notebook and upload clear photos.",
                    dueDate = "Tomorrow, 8:00 PM",
                    totalMarks = 50,
                    status = SubmissionStatus.PENDING
                ),
                Assignment(
                    id = "a2",
                    batchId = "b2",
                    title = "Refraction of Light - Ray Diagrams",
                    description = "Draw concave and convex lens focal points with exact measurements.",
                    dueDate = "Completed",
                    totalMarks = 25,
                    status = SubmissionStatus.GRADED,
                    obtainedMarks = 24,
                    teacherFeedback = "Excellent ray tracing! Neat labeling."
                )
            )
        )

        _announcements.value = listOf(
            Announcement(
                id = "an1",
                batchId = "b1",
                authorName = "Mr. Kingslin",
                title = "Special Revision Class this Sunday",
                content = "We will cover Trigonometric Identities from 10:00 AM to 12:30 PM. Please be on time.",
                timestamp = "Today, 10:30 AM",
                isHighPriority = true
            )
        )
    }

    fun submitHomework(assignmentId: String, content: String) {
        viewModelScope.launch {
            _assignments.value = _assignments.value.map {
                if (it.id == assignmentId) {
                    it.copy(status = SubmissionStatus.SUBMITTED)
                } else it
            }
        }
    }
}

sealed class StudentScreen(val title: String, val icon: ImageVector) {
    object Home : StudentScreen("Home", Icons.Default.Home)
    object Batches : StudentScreen("Batches", Icons.Default.MenuBook)
    object Homework : StudentScreen("Homework", Icons.Default.Assignment)
    object Attendance : StudentScreen("Attendance", Icons.Default.EventAvailable)
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(
                colorScheme = lightColorScheme(
                    primary = Color(0xFF1E88E5),
                    primaryContainer = Color(0xFFE3F2FD),
                    secondary = Color(0xFF00897B),
                    surface = Color(0xFFFBFBFE)
                )
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.surface
                ) {
                    val viewModel: StudentViewModel = viewModel()
                    StudentMainScreen(viewModel)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentMainScreen(viewModel: StudentViewModel) {
    var selectedScreen by remember { mutableStateOf<StudentScreen>(StudentScreen.Home) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Tuition Platform",
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp
                        )
                        Text(
                            text = "Student Portal",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { /* Notifications */ }) {
                        Icon(Icons.Default.Notifications, contentDescription = "Alerts")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        bottomBar = {
            NavigationBar {
                val screens = listOf(
                    StudentScreen.Home,
                    StudentScreen.Batches,
                    StudentScreen.Homework,
                    StudentScreen.Attendance
                )
                screens.forEach { screen ->
                    NavigationBarItem(
                        selected = selectedScreen == screen,
                        onClick = { selectedScreen = screen },
                        label = { Text(screen.title) },
                        icon = { Icon(screen.icon, contentDescription = screen.title) }
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
        ) {
            when (selectedScreen) {
                is StudentScreen.Home -> StudentHomeScreen(viewModel)
                is StudentScreen.Batches -> StudentBatchesScreen(viewModel)
                is StudentScreen.Homework -> StudentHomeworkScreen(viewModel)
                is StudentScreen.Attendance -> StudentAttendanceScreen(viewModel)
            }
        }
    }
}

@Composable
fun StudentHomeScreen(viewModel: StudentViewModel) {
    val batches by viewModel.batches.collectAsState()
    val announcements by viewModel.announcements.collectAsState()
    val attendancePct by viewModel.attendancePercentage.collectAsState()
    val context = LocalContext.current

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Quick Attendance & Stats Header
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .padding(20.dp)
                        .fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Overall Attendance",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Text(
                            text = "$attendancePct%",
                            fontSize = 32.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFF0D47A1)
                        )
                        Text(
                            text = "Status: Excellent",
                            fontSize = 12.sp,
                            color = Color(0xFF2E7D32)
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF1976D2)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.School, contentDescription = null, tint = Color.White)
                    }
                }
            }
        }

        // Live Class Alert
        val liveBatch = batches.firstOrNull { it.isLiveNow }
        if (liveBatch != null) {
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFEBEE)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .padding(16.dp)
                            .fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(12.dp)
                                    .clip(CircleShape)
                                    .background(Color.Red)
                            )
                            Column {
                                Text(
                                    text = "Class is Live Now!",
                                    color = Color.Red,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                Text(
                                    text = liveBatch.title,
                                    fontWeight = FontWeight.Medium,
                                    fontSize = 14.sp
                                )
                            }
                        }

                        Button(
                            onClick = {
                                liveBatch.meetingUrl?.let { url ->
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                                    context.startActivity(intent)
                                } ?: Toast.makeText(context, "No meeting URL provided", Toast.LENGTH_SHORT).show()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Red),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Join")
                        }
                    }
                }
            }
        }

        // Announcements Section
        item {
            Text(
                text = "Announcements",
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
            )
        }

        items(announcements) { notice ->
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = notice.title,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                        if (notice.isHighPriority) {
                            Badge(containerColor = Color(0xFFD32F2F)) {
                                Text("URGENT", color = Color.White, fontSize = 10.sp)
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(text = notice.content, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Posted by ${notice.authorName} • ${notice.timestamp}",
                        fontSize = 11.sp,
                        color = Color.Gray
                    )
                }
            }
        }
    }
}

@Composable
fun StudentBatchesScreen(viewModel: StudentViewModel) {
    val batches by viewModel.batches.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "My Enrolled Batches",
                fontWeight = FontWeight.Bold,
                fontSize = 20.sp
            )
        }

        items(batches) { batch ->
            Card(
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = batch.title,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Text(
                            text = "₹${batch.monthlyFee.toInt()}/mo",
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = "Subject: ${batch.subject} (${batch.grade})", fontSize = 13.sp)
                    Text(text = "Teacher: ${batch.teacherName}", fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "🕒 ${batch.scheduleTime}",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                        Text(
                            text = "👥 ${batch.enrolledStudents}/${batch.maxCapacity} Students",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun StudentHomeworkScreen(viewModel: StudentViewModel) {
    val assignments by viewModel.assignments.collectAsState()
    var selectedAssignmentForSubmit by remember { mutableStateOf<Assignment?>(null) }
    var submissionText by remember { mutableStateOf("") }
    val context = LocalContext.current

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "Homework & Assignments",
                fontWeight = FontWeight.Bold,
                fontSize = 20.sp
            )
        }

        items(assignments) { assignment ->
            Card(
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = assignment.title,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            modifier = Modifier.weight(1f)
                        )
                        when (assignment.status) {
                            SubmissionStatus.PENDING -> Badge(containerColor = Color(0xFFFFA000)) { Text("PENDING") }
                            SubmissionStatus.SUBMITTED -> Badge(containerColor = Color(0xFF1976D2)) { Text("SUBMITTED") }
                            SubmissionStatus.GRADED -> Badge(containerColor = Color(0xFF388E3C)) { Text("GRADED") }
                        }
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(text = assignment.description, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Due: ${assignment.dueDate} • Total Marks: ${assignment.totalMarks}",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )

if (assignment.status == SubmissionStatus.GRADED) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F5E9)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Column(modifier = Modifier.padding(8.dp)) {
                                Text(
                                    text = "Marks Scored: ${assignment.obtainedMarks} / ${assignment.totalMarks}",
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF2E7D32)
                                )
                                assignment.teacherFeedback?.let {
                                    Text(text = "Feedback: $it", fontSize = 12.sp)
                                }
                            }
                        }
                    } else if (assignment.status == SubmissionStatus.PENDING) {
                        Spacer(modifier = Modifier.height(10.dp))
                        Button(
                            onClick = { selectedAssignmentForSubmit = assignment },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Submit Assignment")
                        }
                    }
                }
            }
        }
    }

    if (selectedAssignmentForSubmit != null) {
        AlertDialog(
            onDismissRequest = { selectedAssignmentForSubmit = null },
            title = { Text("Submit: ${selectedAssignmentForSubmit?.title}") },
            text = {
                Column {
                    Text("Type solution notes or paste your cloud document link:")
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = submissionText,
                        onValueChange = { submissionText = it },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 4,
                        placeholder = { Text("Solution notes or Google Drive / PDF Link") }
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (submissionText.isNotBlank()) {
                            selectedAssignmentForSubmit?.id?.let { id ->
                                viewModel.submitHomework(id, submissionText)
                                Toast.makeText(context, "Submitted successfully!", Toast.LENGTH_SHORT).show()
                                submissionText = ""
                                selectedAssignmentForSubmit = null
                            }
                        }
                    }
                ) {
                    Text("Submit")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedAssignmentForSubmit = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun StudentAttendanceScreen(viewModel: StudentViewModel) {
    val attendancePct by viewModel.attendancePercentage.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Attendance Records",
            fontWeight = FontWeight.Bold,
            fontSize = 20.sp
        )

        Card(
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(text = "Current Month Summary", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                Spacer(modifier = Modifier.height(12.dp))
                LinearProgressIndicator(
                    progress = { attendancePct / 100f },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(10.dp)
                        .clip(CircleShape),
                    color = Color(0xFF2E7D32)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Present: 23 Days", fontSize = 13.sp)
                    Text(text = "Absent: 2 Days", fontSize = 13.sp)
                    Text(text = "$attendancePct%", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }
        }
    }
}