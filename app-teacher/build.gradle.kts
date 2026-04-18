android {
    namespace = "com.tuition.teacher"
    compileSdk = 34
    // ... (keep defaultConfig and compileOptions as they are) ...

    buildTypes {
        release {
            // This enables the code scrambling
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            // You can also enable it for debug builds to test the obfuscation
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
