package com.tuition.student

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
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
            // Apply Material 3 Theme wrapping
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AuthScreen()
                }
            }
        }
    }
}

@Composable
fun AuthScreen() {
    // These variables "remember" what the user types into the text boxes
    var isRegistering by remember { mutableStateOf(false) }
    var mobileNumber by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var fullName by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Dynamic Title
        Text(
            text = if (isRegistering) "Student Registration" else "Student Login",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.padding(bottom = 32.dp)
        )

        // Only show "Full Name" if they are registering for a new account
        if (isRegistering) {
            OutlinedTextField(
                value = fullName,
                onValueChange = { fullName = it },
                label = { Text("Full Name") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
            )
        }

        // Mobile Number Input
        OutlinedTextField(
            value = mobileNumber,
            onValueChange = { mobileNumber = it },
            label = { Text("Mobile Number") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
        )

        // Password Input (Hides the text with dots)
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)
        )

        // Submit Button
        Button(
            onClick = {
                /* * TODO: Later we will connect this to the ApiService we just 
                 * created to send the data to the Node.js server! 
                 */
                if (isRegistering) {
                    println("API Call -> Registering: $mobileNumber")
                } else {
                    println("API Call -> Logging in: $mobileNumber")
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
        ) {
            Text(if (isRegistering) "Create Account" else "Login")
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Toggle button to switch between Login and Register
        TextButton(onClick = { isRegistering = !isRegistering }) {
            Text(if (isRegistering) "Already have an account? Login" else "New student? Register here")
        }
    }
}
