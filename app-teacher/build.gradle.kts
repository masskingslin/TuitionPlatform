plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.tuition.teacher"
    compileSdk = 34
    
    defaultConfig {
        applicationId = "com.tuition.teacher"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true // Hides API keys
    }
    
    composeOptions { 
        kotlinCompilerExtensionVersion = "1.4.3" 
    }

    buildTypes {
        release {
            isMinifyEnabled = true // Scrambles the code for security
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = true // Test the scrambling even while developing
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}

dependencies {
    implementation(project(":core-ui"))
    implementation(project(":core-network"))
    
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.activity:activity-compose:1.7.2")
    implementation("androidx.compose.material3:material3:1.1.1")
}
