package com.tuition.student

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
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
                    StudentAppRouter()
                }
            }
        }
    }
}

@Composable
fun StudentAppRouter() {
    var isLoggedIn by remember { mutableStateOf(false) }

    if (isLoggedIn) {
        StudentDashboardScreen(onLogout = { isLoggedIn = false })
    } else {
        AuthScreen(onLoginSuccess = { isLoggedIn = true })
    }
}

@Composable
fun AuthScreen(onLoginSuccess: () -> Unit) {
    var isRegistering by remember { mutableStateOf(false) }
    var mobileNumber by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var fullName by remember { mutableStateOf("") }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = if (isRegistering) "Student Registration" else "Student Login",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.padding(bottom = 32.dp)
        )

        if (isRegistering) {
            OutlinedTextField(
                value = fullName,
                onValueChange = { fullName = it },
                label = { Text("Full Name") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
            )
        }

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
                // Placeholder: API Call happens here
                println("API Request -> Auth Triggered")
                onLoginSuccess()
            },
            modifier = Modifier.fillMaxWidth().height(50.dp)
        ) {
            Text(if (isRegistering) "Create Account" else "Login")
        }

        Spacer(modifier = Modifier.height(16.dp))

        TextButton(onClick = { isRegistering = !isRegistering }) {
            Text(if (isRegistering) "Already have an account? Login" else "New student? Register here")
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentDashboardScreen(onLogout: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Dashboard") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                ),
                actions = {
                    IconButton(onClick = { println("Open Notifications") }) {
                        Icon(Icons.Default.Notifications, contentDescription = "Alerts")
                    }
                    TextButton(onClick = onLogout) {
                        Text("Logout")
                    }
                }
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text(
                    text = "Welcome back, Student!",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }
            
            // Attendance Summary Card
            item {
                DashboardCard(
                    title = "Attendance Overview",
                    icon = Icons.Default.DateRange,
                    content = "You have attended 18 out of 20 classes this month.",
                    highlightText = "90% Present",
                    highlightColor = Color(0xFF4CAF50) // Green
                )
            }

            // Fee Summary Card
            item {
                DashboardCard(
                    title = "Fee Status",
                    icon = Icons.Default.Info,
                    content = "Your tuition fee for the month of May is pending.",
                    highlightText = "Due: ₹1500",
                    highlightColor = MaterialTheme.colorScheme.error // Red
                )
            }
            
            // Recent Activity / Next Class Card
            item {
                DashboardCard(
                    title = "Upcoming Class",
                    icon = Icons.Default.CheckCircle,
                    content = "Mathematics - Chapter 4 (Quadratic Equations)",
                    highlightText = "Today at 5:00 PM",
                    highlightColor = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@Composable
fun DashboardCard(
    title: String, 
    icon: androidx.compose.ui.graphics.vector.ImageVector, 
    content: String, 
    highlightText: String, 
    highlightColor: Color
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(end = 8.dp)
                )
                Text(text = title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = content, style = MaterialTheme.typography.bodyMedium)
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = highlightText,
                style = MaterialTheme.typography.labelLarge,
                color = highlightColor,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
