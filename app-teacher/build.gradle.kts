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
}
