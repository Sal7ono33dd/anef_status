plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val pplxApiKey = (project.findProperty("PPLX_API_KEY") as String?)
    ?: ""

android {
    namespace = "com.naturalisation.tracker"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.naturalisation.tracker"
        minSdk = 26
        targetSdk = 35
        versionCode = 3
        versionName = "1.1.0"
        buildConfigField("String", "PPLX_API_KEY", "\"$pplxApiKey\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
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
        viewBinding = true
        buildConfig = true
    }

    packaging {
        resources {
            // BouncyCastle jars expose the same multi-release OSGI manifest entry.
            pickFirsts += "META-INF/versions/9/OSGI-INF/MANIFEST.MF"
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.2.1")
    implementation("androidx.work:work-runtime-ktx:2.10.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.bouncycastle:bcprov-jdk18on:1.78.1")
    implementation("org.bouncycastle:bcpkix-jdk18on:1.78.1")
}
