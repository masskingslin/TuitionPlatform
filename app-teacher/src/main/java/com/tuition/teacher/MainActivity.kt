package com.tuition.teacher

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
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

class TeacherViewModel : ViewModel() {
    private val _batches = MutableStateFlow<List<TuitionBatch>>(emptyList())
    val batches: StateFlow<List<TuitionBatch>> = _batches.asStateFlow()

    private val _assignments = MutableStateFlow<List<Assignment>>(emptyList())
    val assignments: StateFlow<List<Assignment>> = _assignments.asStateFlow()

    private val _students = MutableStateFlow<List<UserProfile>>(emptyList())
    val students: StateFlow<List<UserProfile>> = _students.asStateFlow()

    private val _attendanceMap = MutableStateFlow<Map<String, AttendanceStatus>>(emptyMap())
    val attendanceMap: StateFlow<Map<String, AttendanceStatus>> = _attendanceMap.asStateFlow()

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
                teacherName = "Kingslin",
                scheduleTime = "Mon, Wed, Fri - 5:30 PM",
                monthlyFee = 1500.0,
                enrolledStudents = 24,
                maxCapacity = 30,
                meetingUrl = "https://meet.google.com/abc-defg-hij",
                isLiveNow = false
            ),
            TuitionBatch(
                id = "b2",
                title = "Class 12 - Pure Physics",
                subject = "Physics",
                grade = "Grade 12",
                teacherName = "Kingslin",
                scheduleTime = "Daily - 7:00 PM",
                monthlyFee = 2000.0,
                enrolledStudents = 19,
                maxCapacity = 25,
                meetingUrl = null,
                isLiveNow = false
            )
        )

        _students.value = listOf(
            UserProfile(id = "s1", name = "Rahul Sharma", email = "rahul@tuition.com", phone = "9876543210", role = UserRole.STUDENT),
            UserProfile(id = "s2", name = "Priya Nathan", email = "priya@tuition.com", phone = "9876543211", role = UserRole.STUDENT),
            UserProfile(id = "s3", name = "Anand Kumar", email = "anand@tuition.com", phone = "9876543212", role = UserRole.STUDENT),
            UserProfile(id = "s4", name = "Sneha Patel", email = "sneha@tuition.com", phone = "9876543213", role = UserRole.STUDENT)
        )

        _assignments.value = listOf(
            Assignment(
                id = "a1",
                batchId = "b1",
                title = "Quadratic Equations Problem Set 4",
                description = "24 Submissions • 18 Graded",
                dueDate = "Tomorrow, 8:00 PM",
                totalMarks = 50,
                status = SubmissionStatus.SUBMITTED
            )
        )

        _attendanceMap.value = _students.value.associate { it.id to AttendanceStatus.PRESENT }
    }

    fun toggleLiveClass(batchId: String) {
        viewModelScope.launch {
            _batches.value = _batches.value.map {
                if (it.id == batchId) it.copy(isLiveNow = !it.isLiveNow) else it
            }
        }
    }

    fun addBatch(title: String, subject: String, grade: String, fee: Double, time: String) {
        val newBatch = TuitionBatch(
            id = "b_${System.currentTimeMillis()}",
            title = title,
            subject = subject,
            grade = grade,
            teacherName = "Kingslin",
            scheduleTime = time,
            monthlyFee = fee,
            enrolledStudents = 0,
            maxCapacity = 30
        )
        _batches.value = _batches.value + newBatch
    }

    fun updateStudentAttendance(studentId: String, status: AttendanceStatus) {
        _attendanceMap.value = _attendanceMap.value.toMutableMap().apply {
            put(studentId, status)
        }
    }

    fun createAssignment(batchId: String, title: String, description: String, dueDate: String, marks: Int) {
        val newAssignment = Assignment(
            id = "a_${System.currentTimeMillis()}",
            batchId = batchId,
            title = title,
            description = description,
            dueDate = dueDate,
            totalMarks = marks,
            status = SubmissionStatus.PENDING
        )
        _assignments.value = _assignments.value + newAssignment
    }
}

sealed class TeacherScreen(val title: String, val icon: ImageVector) {
    object Dashboard : TeacherScreen("Dashboard", Icons.Default.Dashboard)
    object Batches : TeacherScreen("Batches", Icons.Default.Class)
    object Attendance : TeacherScreen("Attendance", Icons.Default.Checklist)
    object Assignments : TeacherScreen("Assignments", Icons.Default.AssignmentTurnedIn)
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(
                colorScheme = lightColorScheme(
                    primary = Color(0xFF2E7D32),
                    primaryContainer = Color(0xFFE8F5E9),
                    secondary = Color(0xFF1565C0),
                    surface = Color(0xFFFAFAFA)
                )
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.surface
                ) {
                    val viewModel: TeacherViewModel = viewModel()
                    TeacherMainScreen(viewModel)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherMainScreen(viewModel: TeacherViewModel) {
    var selectedScreen by remember { mutableStateOf<TeacherScreen>(TeacherScreen.Dashboard) }

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
                            text = "Teacher Management Suite",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { /* Settings / Broadcast */ }) {
                        Icon(Icons.Default.Campaign, contentDescription = "Broadcast")
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar {
                val screens = listOf(
                    TeacherScreen.Dashboard,
                    TeacherScreen.Batches,
                    TeacherScreen.Attendance,
                    TeacherScreen.Assignments
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
                is TeacherScreen.Dashboard -> TeacherDashboardScreen(viewModel)
                is TeacherScreen.Batches -> TeacherBatchesScreen(viewModel)
                is TeacherScreen.Attendance -> TeacherAttendanceScreen(viewModel)
                is TeacherScreen.Assignments -> TeacherAssignmentsScreen(viewModel)
            }
        }
    }
}

@Composable
fun TeacherDashboardScreen(viewModel: TeacherViewModel) {
    val batches by viewModel.batches.collectAsState()
    val students by viewModel.students.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Metric Counters
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Active Batches", fontSize = 12.sp, fontWeight = FontWeight.Medium)
                        Text("${batches.size}", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20))
                    }
                }
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFE3F2FD))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Total Students", fontSize = 12.sp, fontWeight = FontWeight.Medium)
                        Text("${batches.sumOf { it.enrolledStudents }}", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0D47A1))
                    }
                }
            }
        }

        item {
            Text(
                text = "Today's Schedule & Live Control",
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
            )
        }

        items(batches) { batch ->
            Card(
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .padding(16.dp)
                        .fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = batch.title, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text(text = "⏰ ${batch.scheduleTime}", fontSize = 12.sp, color = Color.Gray)
                        Text(text = "👥 ${batch.enrolledStudents} enrolled", fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                    }

                    Button(
                        onClick = { viewModel.toggleLiveClass(batch.id) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (batch.isLiveNow) Color.Red else Color(0xFF2E7D32)
                        ),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (batch.isLiveNow) "End Live" else "Start Live")
                    }
                }
            }
        }
    }
}

@Composable
fun TeacherBatchesScreen(viewModel: TeacherViewModel) {
    val batches by viewModel.batches.collectAsState()
    var showDialog by remember { mutableStateOf(false) }

    var title by remember { mutableStateOf("") }
    var subject by remember { mutableStateOf("") }
    var grade by remember { mutableStateOf("") }
    var fee by remember { mutableStateOf("") }
    var time by remember { mutableStateOf("") }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showDialog = true },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Batch", tint = Color.White)
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Text(
                    text = "Manage All Batches",
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
                            Text(batch.title, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text("₹${batch.monthlyFee.toInt()}/mo", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        }
                        Text("Subject: ${batch.subject} • ${batch.grade}", fontSize = 13.sp)
                        Text("Timing: ${batch.scheduleTime}", fontSize = 12.sp, color = Color.Gray)
                    }
                }
            }
        }
    }

    if (showDialog) {
        AlertDialog(
            onDismissRequest = { showDialog = false },
            title = { Text("Create New Batch") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Batch Title") })
                    OutlinedTextField(value = subject, onValueChange = { subject = it }, label = { Text("Subject") })
                    OutlinedTextField(value = grade, onValueChange = { grade = it }, label = { Text("Grade / Standard") })
                    OutlinedTextField(value = fee, onValueChange = { fee = it }, label = { Text("Monthly Fee (₹)") })
                    OutlinedTextField(value = time, onValueChange = { time = it }, label = { Text("Schedule (e.g. Mon-Wed 6 PM)") })
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (title.isNotBlank() && subject.isNotBlank()) {
                            viewModel.addBatch(title, subject, grade, fee.toDoubleOrNull() ?: 1000.0, time)
                            showDialog = false
                            title = ""; subject = ""; grade = ""; fee = ""; time = ""
                        }
                    }
                ) {
                    Text("Create")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDialog = false }) { Text("Cancel") }
            }
        )
    }
}

@Composable
fun TeacherAttendanceScreen(viewModel: TeacherViewModel) {
    val students by viewModel.students.collectAsState()
    val attendanceMap by viewModel.attendanceMap.collectAsState()
    val context = LocalContext.current

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Digital Attendance Register", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text("Class 10 - Mathematics", fontSize = 13.sp, color = Color.Gray)
                }
                Button(
                    onClick = {
                        Toast.makeText(context, "Attendance synced to cloud!", Toast.LENGTH_SHORT).show()
                    },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Save")
                }
            }
        }

        items(students) { student ->
            val status = attendanceMap[student.id] ?: AttendanceStatus.PRESENT
            Card(
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .padding(12.dp)
                        .fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(student.name, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                        Text(student.phone, fontSize = 12.sp, color = Color.Gray)
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        FilterChip(
                            selected = status == AttendanceStatus.PRESENT,
                            onClick = { viewModel.updateStudentAttendance(student.id, AttendanceStatus.PRESENT) },
                            label = { Text("P") }
                        )
                        FilterChip(
                            selected = status == AttendanceStatus.ABSENT,
                            onClick = { viewModel.updateStudentAttendance(student.id, AttendanceStatus.ABSENT) },
                            label = { Text("A") }
                        )
                        FilterChip(
                            selected = status == AttendanceStatus.LATE,
                            onClick = { viewModel.updateStudentAttendance(student.id, AttendanceStatus.LATE) },
                            label = { Text("L") }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun TeacherAssignmentsScreen(viewModel: TeacherViewModel) {
    val assignments by viewModel.assignments.collectAsState()
    var showCreateDialog by remember { mutableStateOf(false) }

    var title by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }
    var due by remember { mutableStateOf("") }
    var marks by remember { mutableStateOf("50") }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showCreateDialog = true },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Create Assignment", tint = Color.White)
            }
        }
    ) 