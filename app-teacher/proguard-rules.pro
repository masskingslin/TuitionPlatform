# Keep standard Android/Compose classes safe
-keep class androidx.** { *; }
-keep class android.support.** { *; }

# Keep Retrofit and Gson networking classes safe from scrambling
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.tuition.core.network.** { *; }
-keep class retrofit2.** { *; }
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
