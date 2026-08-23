plugins {
    id("com.android.application")
}

android {
    namespace = "com.dnest.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.dnest.app"
        minSdk = 26
        targetSdk = 36
        versionCode = 5
        versionName = "1.4"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
