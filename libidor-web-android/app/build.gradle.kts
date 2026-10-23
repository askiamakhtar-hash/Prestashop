import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Release signing reads keystore.properties (git-ignored) or LIBIDOR_* environment variables.
val keystoreProps = Properties().apply {
    val f = rootProject.file("keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}
fun signingValue(key: String, env: String): String? = keystoreProps.getProperty(key) ?: System.getenv(env)

android {
    namespace = "tech.libidor.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "tech.libidor.app"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        buildConfigField("String", "SITE_URL", "\"https://www.libidor.tech/\"")
    }

    signingConfigs {
        create("release") {
            val storePath = signingValue("storeFile", "LIBIDOR_KEYSTORE")
            if (storePath != null) {
                storeFile = rootProject.file(storePath)
                storePassword = signingValue("storePassword", "LIBIDOR_KEYSTORE_PASSWORD")
                keyAlias = signingValue("keyAlias", "LIBIDOR_KEY_ALIAS")
                keyPassword = signingValue("keyPassword", "LIBIDOR_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release").takeIf { it.storeFile != null }
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.core:core-splashscreen:1.0.1")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")
}
