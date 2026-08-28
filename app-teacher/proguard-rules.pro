# Retrofit & OkHttp rules
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }

# Serialization models
-keepclassmembers class com.tuition.core.network.** { *; }
-keep class com.tuition.core.network.** { *; }
