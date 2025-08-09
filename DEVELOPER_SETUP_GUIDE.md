# LinkedIn Headshot Generator - Developer Setup Guide

## 🎯 Quick Start for New Developers

This comprehensive guide will get you from zero to a fully functional development environment in under 25 minutes, optimized for iOS-first development.

## 📋 Prerequisites

### System Requirements
- **Operating System**: macOS 12.0+ (strongly recommended for iOS development), Windows 10+, or Ubuntu 20.04+
- **Node.js**: 18.x or 20.x LTS versions
- **Package Manager**: npm 8+ or Yarn 1.22+
- **Git**: 2.30+ with SSH keys configured
- **Docker**: 20.10+ with Docker Compose 2.0+

### Development Tools
- **Code Editor**: VS Code with React Native extensions
- **Database Tools**: TablePlus, Sequel Pro, or VS Code PostgreSQL extension
- **API Testing**: Postman, Insomnia, or HTTPie
- **Image Tools**: ImageOptim, TinyPNG for asset optimization

### Mobile Development Environment

#### For iOS Development (Primary Platform - macOS Required)
- **Xcode**: 14.0+ with iOS SDK 16+
- **CocoaPods**: Latest version via RubyGems/Bundler
- **iOS Simulator**: iOS 16.0+ recommended
- **Apple Developer Account**: For device testing and App Store distribution
- **Ruby**: 2.7+ for CocoaPods and Fastlane

#### For Android Development (Secondary Platform)
- **Java Development Kit (JDK)**: Version 11
- **Android Studio**: Latest stable version with Android SDK
- **Android SDK**: API levels 31, 32, 33
- **Android Emulator**: Pixel device with API 31+

## 🚀 Environment Setup

### Step 1: Clone Repository and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/yourusername/linkedin-headshot-generator.git
cd linkedin-headshot-generator

# Install mobile app dependencies
cd LinkedInHeadshotApp
npm install

# Install CocoaPods dependencies (macOS only)
bundle install
cd ios && bundle exec pod install && cd ..

# Install backend dependencies
cd ../backend
npm install

# Return to project root
cd ..
```

### Step 2: Development Environment Configuration

#### Backend Environment Variables
Create `/backend/.env`:

```env
# Development Configuration
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001
DEBUG=linkedin-headshot:*

# Database Configuration
DATABASE_URL=postgresql://headshot_dev:headshot_dev_password@localhost:5432/linkedin_headshots_dev
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
REDIS_URL=redis://localhost:6379/1

# AI Services - Replicate
REPLICATE_API_TOKEN=r8_your_replicate_api_token_here
REPLICATE_MODEL_VERSION=ac732df83cea7fff18b8472768c88ad041fa750ff7682a21adb345661601bdfc
REPLICATE_WEBHOOK_SECRET=your_webhook_secret_here

# Cloud Storage - Cloudinary
CLOUDINARY_CLOUD_NAME=your_dev_cloudinary_name
CLOUDINARY_API_KEY=your_dev_api_key
CLOUDINARY_API_SECRET=your_dev_api_secret
CLOUDINARY_UPLOAD_PRESET=linkedin_headshots_dev
CLOUDINARY_FOLDER=headshots/development

# Payment Processing - Stripe (Test Mode)
STRIPE_PUBLISHABLE_KEY=pk_test_51your_stripe_test_key
STRIPE_SECRET_KEY=sk_test_51your_stripe_test_secret
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret

# RevenueCat Integration
REVENUECAT_API_KEY_IOS=your_ios_api_key
REVENUECAT_API_KEY_ANDROID=your_android_api_key
REVENUECAT_WEBHOOK_SECRET=your_revenuecat_webhook_secret

# Analytics - Development
MIXPANEL_TOKEN=your_dev_mixpanel_token
MIXPANEL_DEBUG=true

# Security - Development Keys
JWT_SECRET=your_development_jwt_secret_min_32_chars
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your_refresh_token_secret_min_32_chars
REFRESH_TOKEN_EXPIRES_IN=7d
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Rate Limiting (Development - Relaxed)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_FREE_TIER_MAX=10

# File Upload
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/heic
TEMP_UPLOAD_DIR=./temp/uploads
PROCESSING_TIMEOUT_MS=120000

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=10mb
LOG_MAX_FILES=5

# Email (Development - Ethereal)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_ethereal_user
SMTP_PASS=your_ethereal_pass
EMAIL_FROM=noreply@linkedinheadshots.com

# Development Features
ENABLE_DEBUG_ROUTES=true
ENABLE_MOCK_AI_RESPONSES=false
ENABLE_DEVELOPMENT_CORS=true
DISABLE_RATE_LIMITING=false
ENABLE_REQUEST_LOGGING=true

# Photo Storage & Cleanup
PHOTO_STORAGE_DAYS=30
CLEANUP_INTERVAL_HOURS=24
AUTO_DELETE_TEMP_FILES=true
```

#### Mobile App Environment Variables
Create `/LinkedInHeadshotApp/.env`:

```env
# API Configuration
API_BASE_URL=http://localhost:3001
API_TIMEOUT_MS=60000
API_RETRY_ATTEMPTS=3

# Platform Configuration (iOS Primary)
IOS_BUILD_CONFIGURATION=Debug
IOS_SCHEME=LinkedInHeadshotApp
ANDROID_BUILD_VARIANT=debug

# RevenueCat Configuration
REVENUECAT_API_KEY_IOS=your_ios_api_key
REVENUECAT_API_KEY_ANDROID=your_android_api_key
REVENUECAT_DEBUG_MODE=true

# Analytics Configuration
MIXPANEL_TOKEN=your_dev_mixpanel_token
ANALYTICS_ENDPOINT=http://localhost:3001/api/v1/analytics
ENABLE_ANALYTICS=true
ANALYTICS_DEBUG=true

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_CRASH_REPORTING=true
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_BIOMETRIC_AUTH=false
ENABLE_PUSH_NOTIFICATIONS=false

# Development Configuration
DEBUG_MODE=true
LOG_LEVEL=debug
ENABLE_FLIPPER=true
ENABLE_REACTOTRON=true
SHOW_PERFORMANCE_OVERLAY=false

# Security Configuration (Relaxed for Development)
ENABLE_SSL_PINNING=false
TRUST_ALL_CERTIFICATES=true
ENABLE_ROOT_DETECTION=false

# Storage Configuration
ASYNC_STORAGE_SIZE_MB=50
CACHE_TTL_HOURS=24
AUTO_CLEANUP_CACHE=true

# Image Processing
IMAGE_QUALITY=0.8
MAX_IMAGE_SIZE_MB=8
ENABLE_IMAGE_COMPRESSION=true

# Deep Linking & Universal Links
URL_SCHEME=linkedinheadshot
UNIVERSAL_LINK_DOMAIN=dev.linkedinheadshots.com

# Development URLs
WEB_DEMO_URL=http://localhost:3000
BACKEND_HEALTH_CHECK=http://localhost:3001/api/v1/health
```

### Step 3: Database and Services Setup

#### Using Docker (Recommended)
```bash
# Start PostgreSQL and Redis containers
cd backend
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
docker-compose logs -f postgres

# Run database migrations
npm run migrate

# Optional: Seed with sample data
npm run seed
```

#### Docker Development Configuration
Create `/backend/docker-compose.dev.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: linkedin_headshots_dev
      POSTGRES_USER: headshot_dev
      POSTGRES_PASSWORD: headshot_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data
    command: redis-server --appendonly yes

volumes:
  postgres_dev_data:
  redis_dev_data:
```

#### Using Local Installation (macOS)
```bash
# Install PostgreSQL and Redis
brew install postgresql redis
brew services start postgresql
brew services start redis

# Create database and user
psql postgres -c "CREATE DATABASE linkedin_headshots_dev;"
psql postgres -c "CREATE USER headshot_dev WITH PASSWORD 'headshot_dev_password';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE linkedin_headshots_dev TO headshot_dev;"

# Run migrations
cd backend
npm run migrate
```

### Step 4: External Service Configuration

#### Replicate AI Setup
1. Visit [Replicate](https://replicate.com/)
2. Create account and generate API token
3. Add credit to account (minimum $10 recommended)
4. Copy API token to `.env` file
5. Test API connection:
   ```bash
   curl -H "Authorization: Token $REPLICATE_API_TOKEN" \
        https://api.replicate.com/v1/models
   ```

#### Cloudinary Setup
1. Visit [Cloudinary Console](https://cloudinary.com/console)
2. Create account and get API credentials
3. Create upload preset for development:
   - Preset name: `linkedin_headshots_dev`
   - Folder: `headshots/development`
   - Resource type: `image`
   - Access mode: `public`
4. Copy credentials to `.env` file

#### RevenueCat Setup
1. Visit [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Create new project for iOS/Android
3. Configure products:
   - `photo_pack_5` - $4.99
   - `photo_pack_10` - $7.99
   - `monthly_unlimited` - $9.99/month
4. Get API keys for iOS and Android
5. Set up webhook URL: `http://localhost:3001/api/v1/webhooks/revenuecat`

#### Stripe Setup (for Web Payments)
1. Visit [Stripe Dashboard](https://dashboard.stripe.com/)
2. Switch to "Test Mode"
3. Create products matching RevenueCat offerings
4. Set up webhook endpoint:
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe
   
   # Forward webhook events
   stripe listen --forward-to localhost:3001/api/v1/webhooks/stripe
   ```

### Step 5: Development Tools Configuration

#### VS Code Extensions for React Native
Create `.vscode/extensions.json`:
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "msjsdiag.vscode-react-native",
    "ms-vscode.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "humao.rest-client",
    "ckolkman.vscode-postgres",
    "ms-vscode.vscode-docker",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

#### VS Code Settings
Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/ios/build/**": true,
    "**/ios/Pods/**": true,
    "**/android/build/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/ios/build": true,
    "**/ios/Pods": true,
    "**/android/build": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  },
  "reactNative.packager.port": 8081,
  "reactNative.android.runArguments.device": [
    "--port", "8081"
  ]
}
```

#### Xcode Configuration (iOS Development)
```bash
# Set up iOS development team and signing
# Open ios/LinkedInHeadshotApp.xcworkspace in Xcode
# Select project -> Signing & Capabilities
# Choose your development team
# Enable automatic signing

# Configure iOS Simulator
# Xcode -> Window -> Devices and Simulators
# Add iPhone 14 Pro (iOS 16.x) simulator
```

#### React Native Debugging Tools
```bash
# Install React Developer Tools
npm install -g react-devtools

# Install Flipper (macOS)
brew install --cask flipper

# Start Flipper and connect your simulator/device
open -a Flipper
```

## 🔧 Development Workflow

### Daily Development Commands

#### Backend Development
```bash
cd backend

# Start development server with hot reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Database operations
npm run migrate        # Run pending migrations
npm run migrate:rollback  # Rollback last migration
npm run migrate:reset  # Reset database
npm run seed          # Seed with sample data

# Code quality checks
npm run lint          # ESLint
npm run type-check    # TypeScript
npm run format        # Prettier

# Generate API documentation
npm run docs:generate
```

#### Mobile App Development
```bash
cd LinkedInHeadshotApp

# Start Metro bundler
npm start

# iOS Development (Primary)
npm run ios                           # Default simulator
npm run ios -- --simulator="iPhone 14 Pro"  # Specific simulator
npm run ios -- --device             # Physical device

# Android Development
npm run android                      # Default emulator
npm run android -- --device         # Physical device

# Development utilities
npm start -- --reset-cache          # Clear Metro cache
npm run pods-install                 # Update CocoaPods
npm run clean-ios                    # Clean iOS build
npm run clean-android               # Clean Android build
```

### Demo System Development
```bash
# Start complete development environment
./start-demo.sh

# This starts:
# - Backend API (port 3001)
# - Web demo (port 3000) 
# - Database services
# - Redis cache

# Access demo at http://localhost:3000
# Mobile app connects to http://localhost:3001

# Stop all services
./stop-demo.sh
```

### Testing Workflow

#### Backend Testing
```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Test specific endpoint
npm test -- --testPathPattern=photos.test.js

# Integration tests
npm run test:integration

# Load testing
npm run test:load

# API endpoint testing
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

#### Mobile App Testing
```bash
cd LinkedInHeadshotApp

# Unit tests
npm test

# Component tests
npm run test:component

# E2E tests (iOS)
npm run test:e2e:ios

# E2E tests (Android)
npm run test:e2e:android

# Test specific component
npm test -- PhotoCapture.test.jsx

# Performance tests
npm run test:performance
```

### Debugging Setup

#### iOS Debugging (Primary Platform)
```bash
# Debug in Xcode
# Open ios/LinkedInHeadshotApp.xcworkspace
# Set breakpoints in Swift/Objective-C code
# Use Xcode debugger for native issues

# Debug JavaScript in Chrome DevTools
# Shake device/simulator -> Debug -> Debug with Chrome

# Debug with Safari Web Inspector
# Safari -> Develop -> Simulator -> JSContext

# Use Flipper for comprehensive debugging
# Network inspector, database viewer, crash reporter
```

#### React Native Debugging
```bash
# Enable debugging menu
# iOS: Cmd+D in simulator
# Android: Cmd+M in emulator

# Remote debugging options:
# - Debug with Chrome DevTools
# - Start Remote JS Debugging
# - Enable Hot Reloading
# - Enable Live Reload

# Use React Developer Tools
react-devtools

# Flipper debugging (automatic when enabled)
open -a Flipper
```

### Performance Optimization

#### iOS Performance Monitoring
```bash
# Monitor app performance in Xcode
# Product -> Profile -> Choose "Time Profiler"

# Monitor memory usage
# Debug -> Debug Workflow -> View Memory Graph

# Network performance in Flipper
# Network plugin shows all API calls
```

#### React Native Performance
```bash
# Performance monitor overlay
# Enable in development builds
# Shows FPS, memory usage, bridge utilization

# Bundle analyzer
npx react-native-bundle-visualizer

# Performance profiling
npm run performance-test
```

## 🎨 Asset Management

### Image Assets
```bash
# iOS Assets (high priority)
# Add images to ios/LinkedInHeadshotApp/Images.xcassets/
# Use @1x, @2x, @3x naming convention

# Android Assets
# Add images to android/app/src/main/res/drawable-*/

# Optimize images for mobile
npx react-native-image-resizer-cli resize ./assets/images/ --width 300 --quality 0.8
```

### Style Template Assets
```bash
# Add style preview images to assets/style-previews/
# Naming convention: {style_name}_preview.jpg
# Recommended size: 300x300px, optimized for mobile
```

## 🚀 Build and Deployment

### Development Builds

#### iOS Development Build
```bash
cd LinkedInHeadshotApp

# Build for iOS simulator
npx react-native run-ios --configuration Debug

# Build for physical device
npx react-native run-ios --device --configuration Debug

# Generate development IPA
cd ios
xcodebuild -workspace LinkedInHeadshotApp.xcworkspace \
           -scheme LinkedInHeadshotApp \
           -configuration Debug \
           -archivePath build/LinkedInHeadshotApp.xcarchive \
           archive
```

#### Android Development Build
```bash
cd LinkedInHeadshotApp

# Debug APK
cd android
./gradlew assembleDebug

# Install on connected device
./gradlew installDebug

# Generate signed APK for testing
./gradlew assembleRelease  # Requires keystore setup
```

### Production Build Preparation
```bash
# iOS Production
# 1. Configure release signing in Xcode
# 2. Archive and upload to App Store Connect
# 3. Configure In-App Purchases
# 4. Submit for review

# Android Production
# 1. Generate signed AAB
# 2. Upload to Google Play Console
# 3. Configure In-App Billing
# 4. Submit for review
```

## 🔍 Monitoring and Debugging

### Development Monitoring

#### API Monitoring
```bash
# Monitor API health
curl http://localhost:3001/api/v1/health

# Monitor generation queue
curl http://localhost:3001/api/v1/admin/queue-status

# Monitor database performance
docker exec -it linkedin-headshots-postgres \
  psql -U headshot_dev -d linkedin_headshots_dev \
  -c "SELECT * FROM pg_stat_activity;"
```

#### Mobile App Monitoring
```bash
# iOS Console Logs
# Xcode -> Window -> Devices and Simulators
# Select device -> Open Console

# Android Logs
adb logcat | grep LinkedInHeadshot

# React Native Logs
npx react-native log-ios     # iOS logs
npx react-native log-android # Android logs
```

### Error Tracking and Analytics

#### Development Error Tracking
```javascript
// Errors are logged to console and Flipper in development
// Production error tracking uses Sentry (configure in production)
```

#### Analytics Verification
```bash
# Verify analytics events in Mixpanel
# Check debug events at https://mixpanel.com/project/your-project/events

# Test analytics locally
curl -X POST http://localhost:3001/api/v1/analytics/track \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"event":"test_event","properties":{"source":"development"}}'
```

## 🔒 Security and Privacy

### Development Security Setup

#### API Security Testing
```bash
# Test API security headers
curl -I http://localhost:3001/api/v1/health

# Test rate limiting
for i in {1..10}; do
  curl http://localhost:3001/api/v1/auth/login
done

# Test JWT token validation
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:3001/api/v1/users/profile
```

#### Photo Privacy Verification
```bash
# Verify photo deletion after expiry
# Check database for expired photos
# Verify Cloudinary cleanup

# Test photo access controls
# Attempt to access photo with wrong user token
```

## 📱 Platform-Specific Setup

### iOS-Specific Configuration

#### Bundle Identifier and Provisioning
```bash
# Configure in Xcode:
# Project -> General -> Bundle Identifier: com.yourcompany.linkedinheadshot
# Signing & Capabilities -> Team: Your Development Team
# Capabilities: In-App Purchase, Push Notifications (if needed)
```

#### iOS Privacy Settings
Add to `ios/LinkedInHeadshotApp/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to capture photos for professional headshot generation.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs photo library access to select photos for professional headshot generation.</string>
```

### Android-Specific Configuration

#### Package Name and Signing
```bash
# Configure in android/app/build.gradle:
# applicationId "com.yourcompany.linkedinheadshot"

# Generate debug keystore (if needed)
keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000
```

#### Android Permissions
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
```

## 📞 Development Support

### Troubleshooting Common Issues

#### Metro Bundler Issues
```bash
# Clear all caches
cd LinkedInHeadshotApp
rm -rf node_modules
npm install
npx react-native start --reset-cache

# Clear iOS build
cd ios
rm -rf build Pods Podfile.lock
bundle exec pod install
cd ..

# Clear Android build
cd android
./gradlew clean
cd ..
```

#### iOS Build Issues
```bash
# Common iOS fixes
cd ios
rm -rf build Pods Podfile.lock ~/Library/Developer/Xcode/DerivedData
bundle exec pod install --repo-update
cd ..

# Fix CocoaPods issues
bundle exec pod deintegrate
bundle exec pod install
```

#### Backend Connection Issues
```bash
# Check backend status
curl http://localhost:3001/api/v1/health

# Check Docker services
docker-compose ps

# Reset database
docker-compose down -v
docker-compose up -d
cd backend && npm run migrate && npm run seed
```

### Development Resources

- **API Documentation**: http://localhost:3001/docs (when backend running)
- **Storybook**: Component library documentation
- **Demo System**: http://localhost:3000 (complete web demo)
- **Database Admin**: Use TablePlus or preferred PostgreSQL client
- **Redis Admin**: Use RedisInsight or command line tools

### Getting Help

- **Team Documentation**: Check `/docs` directory
- **GitHub Issues**: Create detailed issue for bugs
- **Code Reviews**: Create PR with clear description
- **Architecture Questions**: Schedule meeting with team lead

---

## ✅ Setup Verification Checklist

Verify your development environment with these tests:

```bash
# 1. Node.js and npm
node --version  # Should be 18.x or 20.x
npm --version   # Should be 8.x+

# 2. React Native CLI
npx react-native --version

# 3. iOS development (macOS only)
xcodebuild -version
pod --version

# 4. Backend services
cd backend
npm run migrate  # Should complete without errors
npm run dev      # Should start on port 3001

# 5. Test API endpoint
curl http://localhost:3001/api/v1/health

# 6. Mobile app dependencies
cd ../LinkedInHeadshotApp
npm install      # Should complete without errors
cd ios && bundle exec pod install && cd ..  # iOS only

# 7. Start mobile app
npm start        # Metro bundler should start
npm run ios      # iOS simulator should launch

# 8. Run tests
npm test         # All tests should pass

# 9. Check code quality
npm run lint     # No linting errors

# 10. Demo system (optional)
./start-demo.sh  # All services should start
curl http://localhost:3000  # Web demo should respond
```

🎉 **Congratulations! Your LinkedIn Headshot Generator development environment is ready for building professional AI-powered photo features!**

### Next Steps
1. Familiarize yourself with the codebase structure
2. Review the API documentation at http://localhost:3001/docs
3. Try generating your first headshot using the demo system
4. Explore the mobile app in iOS Simulator
5. Review the testing framework and write your first test