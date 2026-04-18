package com.tuition.teacher

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    TeacherAppRouter()
                }
            }
        }
    }
}

@Composable
fun TeacherAppRouter() {
    // This state controls which screen the teacher sees
    var isLoggedIn by remember { mutableStateOf(false) }

    if (isLoggedIn) {
        TeacherDashboardScreen(onLogout = { isLoggedIn = false })
    } else {
        TeacherLoginScreen(onLoginSuccess = { isLoggedIn = true })
    }
}

@Composable
fun TeacherLoginScreen(onLoginSuccess: () -> Unit) {
    var mobileNumber by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Teacher Portal",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.padding(bottom = 32.dp)
        )

        OutlinedTextField(
            value = mobileNumber,
            onValueChange = { mobileNumber = it },
            label = { Text("Mobile Number") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
        )

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)
        )

        Button(
            onClick = { 
                // TODO: Connect to Node.js API to verify credentials
                onLoginSuccess() 
            },
            modifier = Modifier.fillMaxWidth().height(50.dp)
        ) {
            Text("Secure Login")
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherDashboardScreen(onLogout: () -> Unit) {
    // Mock data: Later this will be fetched from your MongoDB database
    val mockStudents = listOf(
        "Rahul Kumar" to "9876543210",
        "Priya Sharma" to "9123456789",
        "Amit Singh" to "9988776655"
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Student Management") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                ),
                actions = {
                    TextButton(onClick = onLogout) {
                        Text("Logout")
                    }
                }
            )
        }
    ) { paddingValues ->
        // LazyColumn is highly memory-efficient for scrolling long lists
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            items(mockStudents) { student ->
                StudentListItem(
                    name = student.first,
                    phone = student.second,
                    onEdit = { println("API Call -> Edit ${student.first}") },
                    onDelete = { println("API Call -> Delete ${student.first}") }
                )
            }
        }
    }
}

@Composable
fun StudentListItem(name: String, phone: String, onEdit: () -> Unit, onDelete: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = "Student Icon",
                    modifier = Modifier.size(40.dp).padding(end = 8.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
                Column {
                    Text(text = name, style = MaterialTheme.typography.titleMedium)
                    Text(text = phone, style = MaterialTheme.typography.bodyMedium)
                }
            }
            Row {
                IconButton(onClick = onEdit) {
                    Icon(imageVector = Icons.Default.Edit, contentDescription = "Edit Student")
                }
                IconButton(onClick = onDelete) {
                    Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete Student", tint = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}
