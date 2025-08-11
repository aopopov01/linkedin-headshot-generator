# LinkedIn Headshot Generator - Android Build Setup

## Prerequisites Required

### 1. Java Development Kit (JDK)
```bash
# Install OpenJDK 17 (recommended for React Native 0.72+)
sudo apt update
sudo apt install -y openjdk-17-jdk

# Set JAVA_HOME environment variable
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc

# Verify installation
java -version
javac -version
```

### 2. Android SDK Setup
```bash
# Download Android Studio or Command Line Tools
# Option 1: Android Studio (Recommended)
# Download from: https://developer.android.com/studio

# Option 2: Command Line Tools Only
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-9477386_latest.zip
mkdir -p ~/Android/Sdk/cmdline-tools
mv cmdline-tools ~/Android/Sdk/cmdline-tools/latest

# Set Android environment variables
export ANDROID_HOME=~/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# Add to ~/.bashrc for persistence
echo 'export ANDROID_HOME=~/Android/Sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin' >> ~/.bashrc
```

### 3. Install Required Android SDK Components
```bash
# Accept all licenses first
sdkmanager --licenses

# Install required SDK platforms and build tools
sdkmanager "platforms;android-33" "build-tools;33.0.0" "platform-tools"
sdkmanager "system-images;android-33;google_apis;x86_64"

# Install additional components for professional features
sdkmanager "extras;android;m2repository" "extras;google;m2repository"
```

### 4. Generate Release Signing Key
```bash
# Navigate to the app directory
cd LinkedInHeadshotApp/android/app

# Generate professional release keystore
keytool -genkey -v -keystore linkedin-headshot-release-key.keystore \
  -alias linkedin-headshot-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=LinkedIn Headshot Generator, OU=Mobile Development, O=Your Company, L=Your City, S=Your State, C=US"

# Important: Store these credentials securely
# - Keystore password
# - Key password  
# - Key alias: linkedin-headshot-key-alias
```

### 5. Configure Gradle Properties
Create `LinkedInHeadshotApp/android/gradle.properties`:
```properties
# Professional app signing configuration
MYAPP_RELEASE_STORE_FILE=linkedin-headshot-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=linkedin-headshot-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your_secure_keystore_password
MYAPP_RELEASE_KEY_PASSWORD=your_secure_key_password

# Gradle performance optimization
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.daemon=true

# Professional build optimization
android.useAndroidX=true
android.enableJetifier=true
android.enableR8.fullMode=true

# Professional image processing
android.enableAapt2=true
android.bundle.enableUncompressedNativeLibs=false
```

## Build Commands

### Development Build
```bash
# From project root
cd LinkedInHeadshotApp
npm run android

# Or directly with Gradle
cd android && ./gradlew assembleDebug
```

### Production Release Build
```bash
# APK build (for direct distribution)
cd LinkedInHeadshotApp/android && ./gradlew assembleRelease

# AAB build (recommended for Google Play Store)
cd LinkedInHeadshotApp/android && ./gradlew bundleRelease
```

### Professional Quality Checks
```bash
# Run all tests before building
cd LinkedInHeadshotApp
npm run test
npm run test:integration

# Check bundle analyzer
cd android && ./gradlew analyzeReleaseBundle

# Verify signing configuration
cd android && ./gradlew signingReport
```

## Output Locations
- **Debug APK**: `LinkedInHeadshotApp/android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `LinkedInHeadshotApp/android/app/build/outputs/apk/release/app-release.apk`
- **Release AAB**: `LinkedInHeadshotApp/android/app/build/outputs/bundle/release/app-release.aab`

## Professional Features Configuration

### Image Processing Optimization
Ensure native libraries are properly configured:
```gradle
// In android/app/build.gradle
android {
    packagingOptions {
        pickFirst '**/libc++_shared.so'
        pickFirst '**/libjsc.so'
    }
    
    bundle {
        language {
            enableSplit = true
        }
        density {
            enableSplit = true
        }
        abi {
            enableSplit = true
        }
    }
}
```

### Security Configuration
Add to `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false" />
    <debug-overrides>
        <trust-anchors>
            <certificates src="system"/>
            <certificates src="user"/>
        </trust-anchors>
    </debug-overrides>
</network-security-config>
```

## Troubleshooting Guide

### Common Build Issues
1. **Gradle Wrapper Permissions**:
   ```bash
   chmod +x LinkedInHeadshotApp/android/gradlew
   ```

2. **Memory Issues**:
   Add to `android/gradle.properties`:
   ```
   org.gradle.jvmargs=-Xmx6144m -XX:MaxMetaspaceSize=1024m
   ```

3. **Build Tools Version Mismatch**:
   Update in `android/app/build.gradle`:
   ```gradle
   buildToolsVersion = "33.0.0"
   ```

4. **Professional Image Libraries**:
   Clean and rebuild if native dependencies fail:
   ```bash
   cd android && ./gradlew clean && ./gradlew assembleRelease
   ```

### Verification Commands
```bash
# Verify Java setup
java -version
javac -version
echo $JAVA_HOME

# Verify Android SDK
sdkmanager --list_installed
echo $ANDROID_HOME

# Verify Gradle
cd LinkedInHeadshotApp/android && ./gradlew --version

# Test build environment
cd LinkedInHeadshotApp/android && ./gradlew clean
```

## Mock Configuration for Production-Ready Testing

Since API keys are not configured, verify mock services:

1. **Mock AI Service**: Check `src/services/ai/MockAIService.ts`
2. **Mock Image Processing**: Verify `src/services/image/MockImageProcessor.ts` 
3. **Offline Capabilities**: Test with network disabled
4. **Demo Mode**: Ensure professional demo images are included

### Demo Configuration
Verify these files exist:
- `assets/demo-images/professional-samples/`
- `src/config/demo.config.ts`
- `src/services/mock/professional-templates/`

## Professional App Store Preparation

### Build Verification Checklist
- [ ] Release build completes without errors
- [ ] App launches and core features work in mock mode
- [ ] Professional templates and demo content load
- [ ] Image processing (mock) generates results
- [ ] LinkedIn integration UI works (mock mode)
- [ ] Settings and preferences save/load properly
- [ ] App handles network offline gracefully
- [ ] No debug logs or development features in release
- [ ] Signing configuration is secure and valid
- [ ] App bundle size is optimized (<150MB)

### Final Build Command
```bash
# Complete professional release build
cd LinkedInHeadshotApp

# Clean everything first
cd android && ./gradlew clean && cd ..

# Install dependencies
npm install

# Run quality checks
npm run test
npm run lint

# Build production AAB for Play Store
cd android && ./gradlew bundleRelease

# Verify output
ls -la app/build/outputs/bundle/release/
```

This configuration creates production-ready Android builds with professional image processing capabilities, proper security configurations, and optimized performance for LinkedIn headshot generation.