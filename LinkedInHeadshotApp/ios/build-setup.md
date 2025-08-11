# iOS Build Setup - LinkedIn Headshot Generator

## Prerequisites (macOS Required)

### 1. Xcode Installation
```bash
# Install latest Xcode from Mac App Store
# Minimum version: Xcode 14.0+ for professional image processing features

# Install Xcode Command Line Tools
xcode-select --install

# Verify installation
xcode-select -p
xcrun --show-sdk-path
xcodebuild -version
```

### 2. CocoaPods Setup for Professional Features
```bash
# Install CocoaPods for iOS dependency management
sudo gem install cocoapods

# Install professional image processing dependencies
cd LinkedInHeadshotApp/ios
pod install

# If installation fails, update repositories:
pod repo update
pod install --repo-update

# Verify installation
pod --version
```

### 3. Professional App Certificate Setup

#### Option A: Development Signing
1. Open `ios/LinkedInHeadshotApp.xcworkspace` in Xcode
2. Select project in navigator
3. Navigate to "Signing & Capabilities" tab
4. Enable "Automatically manage signing"
5. Select your Apple Developer team

#### Option B: Production Distribution
```bash
# Professional distribution requires:
# 1. Apple Developer Program membership ($99/year)
# 2. Distribution certificate from developer.apple.com
# 3. App Store provisioning profile
# 4. App ID: com.yourcompany.linkedinheadshotgenerator

# Create App ID with capabilities:
# - Associated Domains (LinkedIn integration)
# - In-App Purchase (premium features)
# - Push Notifications (professional updates)
```

### 4. Professional Bundle Configuration
Configure in Xcode project settings:
- **Bundle Identifier**: `com.yourcompany.linkedinheadshotgenerator`
- **Display Name**: "LinkedIn Headshot Generator"
- **Version**: "1.5.0" 
- **Build Number**: Increment for each submission
- **Minimum iOS Version**: 13.0+ (for professional image processing)

## Build Commands

### Development Build
```bash
# From LinkedInHeadshotApp directory
cd LinkedInHeadshotApp
npm run ios

# Specific simulator for testing
npx react-native run-ios --simulator="iPhone 15 Pro"

# Build for physical device (requires provisioning)
npx react-native run-ios --device "Your iPhone Name"
```

### Production Build
```bash
# Command line production build
cd LinkedInHeadshotApp/ios
xcodebuild -workspace LinkedInHeadshotApp.xcworkspace \
  -scheme LinkedInHeadshotApp \
  -configuration Release \
  -archivePath build/LinkedInHeadshotApp.xcarchive \
  archive

# Or use Xcode GUI:
# 1. Open ios/LinkedInHeadshotApp.xcworkspace
# 2. Select "Any iOS Device"
# 3. Product → Archive
# 4. Distribute to App Store
```

## Professional iOS Configuration

### 1. Info.plist for Professional Features
```xml
<!-- Professional Camera and Photo Access -->
<key>NSCameraUsageDescription</key>
<string>LinkedIn Headshot Generator needs camera access to capture professional headshots.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Access your photo library to select and enhance photos for professional LinkedIn profiles.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Save your professional headshots to your photo library.</string>

<!-- Professional Face Recognition -->
<key>NSFaceIDUsageDescription</key>
<string>Use Face ID to securely access your professional headshot collection and premium features.</string>

<!-- Network Access for AI Processing -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSAllowsArbitraryLoadsInWebContent</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <!-- LinkedIn domain for professional integration -->
        <key>linkedin.com</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <true/>
        </dict>
    </dict>
</dict>

<!-- Professional URL Schemes -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>LinkedIn Headshot Generator</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>linkedinheadshot</string>
            <string>linkedin-headshot</string>
        </array>
    </dict>
</array>

<!-- LinkedIn Integration -->
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>linkedin</string>
    <string>linkedin-oauth2</string>
</array>

<!-- Professional Export Features -->
<key>UTExportedTypeDeclarations</key>
<array>
    <dict>
        <key>UTTypeIdentifier</key>
        <string>com.yourcompany.linkedinheadshot.professional</string>
        <key>UTTypeDescription</key>
        <string>Professional LinkedIn Headshot</string>
        <key>UTTypeConformsTo</key>
        <array>
            <string>public.image</string>
        </array>
        <key>UTTypeTagSpecification</key>
        <dict>
            <key>public.filename-extension</key>
            <array>
                <string>lhp</string>
            </array>
        </dict>
    </dict>
</array>
```

### 2. Required iOS Capabilities
Enable in Xcode → Signing & Capabilities:

- **Associated Domains**: 
  - `applinks:linkedinheadshotgenerator.com`
  - `webcredentials:linkedin.com`
  
- **Background App Refresh**: For AI processing completion

- **Push Notifications**: Professional update alerts

- **In-App Purchase**: Premium professional features

- **Keychain Sharing**: Secure credential storage

- **Camera and Microphone**: Professional photo capture

### 3. Professional Build Optimization
```objc
// Build Settings for Professional App
ENABLE_BITCODE = NO  // Required for React Native
DEAD_CODE_STRIPPING = YES  // Optimize app size
STRIP_INSTALLED_PRODUCT = YES  // Remove debug symbols in release
GCC_OPTIMIZATION_LEVEL = s  // Optimize for size
SWIFT_OPTIMIZATION_LEVEL = -O  // Maximum Swift optimization
VALIDATE_PRODUCT = YES  // Enable professional validation

// Professional Image Processing
CLANG_ENABLE_MODULES = YES
CLANG_ENABLE_OBJC_ARC = YES
ENABLE_STRICT_OBJC_MSGSEND = YES

// Memory and Performance
GCC_OPTIMIZATION_LEVEL = s
SWIFT_COMPILATION_MODE = wholemodule
```

## Professional Mock Configuration

### 1. Professional AI Service Mock
```typescript
// src/services/mock/ProfessionalAIService.ios.ts
export class ProfessionalAIServiceIOS {
  static async generateProfessionalHeadshot(imageUri: string, style: string) {
    // Simulate professional AI processing with realistic timing
    const processingTime = Math.random() * 3000 + 2000; // 2-5 seconds
    
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    const professionalResults = {
      enhancedImage: imageUri, // Would be enhanced in real implementation
      professionalScore: Math.random() * 1.5 + 8.5, // 8.5-10.0 range
      improvements: this.generateProfessionalImprovements(style),
      style: style,
      linkedinOptimized: true,
      businessAppropriate: true,
      qualityMetrics: {
        lighting: Math.random() * 0.5 + 9.5,
        composition: Math.random() * 0.5 + 9.0,
        professionalism: Math.random() * 0.3 + 9.7,
        linkedinCompliance: 10.0
      }
    };
    
    return professionalResults;
  }
  
  private static generateProfessionalImprovements(style: string): string[] {
    const improvements = {
      corporate: [
        "Enhanced professional lighting for corporate environments",
        "Optimized background for business contexts",
        "Adjusted composition for executive presence"
      ],
      creative: [
        "Balanced professionalism with creative industry standards",
        "Enhanced visual appeal while maintaining business appropriateness",
        "Optimized for creative professional networks"
      ],
      executive: [
        "Maximized authoritative presence and leadership qualities",
        "Enhanced gravitas and professional credibility",
        "Optimized for C-suite and senior management contexts"
      ]
    };
    
    return improvements[style] || improvements.corporate;
  }
}
```

### 2. LinkedIn Integration Mock
```typescript
// src/services/mock/LinkedInIntegrationMock.ios.ts
export class LinkedInMockService {
  static async authenticateLinkedIn(): Promise<{success: boolean, profile?: any}> {
    // Mock LinkedIn OAuth flow
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      profile: {
        id: 'mock_linkedin_id',
        firstName: 'Professional',
        lastName: 'User',
        headline: 'Senior Professional',
        industry: 'Technology',
        location: 'San Francisco Bay Area',
        profilePicture: null // Would be replaced with generated headshot
      }
    };
  }
  
  static async updateProfilePicture(headshotUri: string): Promise<{success: boolean}> {
    // Mock profile picture update
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      success: true
    };
  }
}
```

### 3. Professional Style Templates
```typescript
// src/config/professional-styles.ios.ts
export const ProfessionalStylesIOS = {
  corporate: {
    name: 'Corporate Professional',
    description: 'Conservative, traditional business look',
    backgroundColor: '#f8f9fa',
    lighting: 'soft-front',
    composition: 'centered-formal',
    clothing: 'business-formal'
  },
  
  creative: {
    name: 'Creative Professional', 
    description: 'Modern, approachable professional',
    backgroundColor: '#ffffff',
    lighting: 'natural-side',
    composition: 'rule-of-thirds',
    clothing: 'business-casual'
  },
  
  executive: {
    name: 'Executive Leadership',
    description: 'Authoritative, leadership-focused',
    backgroundColor: '#2c3e50',
    lighting: 'dramatic-key',
    composition: 'power-pose',
    clothing: 'executive-formal'
  }
};
```

## Troubleshooting Professional Features

### Common iOS Issues
1. **CocoaPods Professional Dependencies**:
   ```bash
   cd ios
   pod deintegrate
   rm -rf ~/Library/Developer/Xcode/DerivedData
   pod install --repo-update
   ```

2. **Professional Image Processing Memory Issues**:
   ```bash
   # Increase memory allocation in Xcode Build Settings
   OTHER_LDFLAGS = -ObjC
   ENABLE_BITCODE = NO
   ```

3. **LinkedIn URL Scheme Conflicts**:
   ```bash
   # Verify URL schemes in Info.plist don't conflict
   # Test deep linking with custom scheme
   ```

### Verification for Professional Features
```bash
# Check Xcode and tools
xcode-select -p
xcodebuild -version
pod --version

# Verify iOS capabilities
cd ios && xcodebuild -showBuildSettings

# Test professional image processing
cd ios && xcodebuild -workspace LinkedInHeadshotApp.xcworkspace \
  -scheme LinkedInHeadshotApp \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  test
```

## App Store Submission Preparation

### Professional App Review Checklist
- [ ] Professional AI processing works with mock services
- [ ] LinkedIn integration UI functions (mock mode)
- [ ] Professional style templates load correctly
- [ ] Camera capture and photo selection work
- [ ] Professional quality scoring displays properly
- [ ] Export functionality saves enhanced images
- [ ] Premium features show appropriate upgrade flows
- [ ] App handles offline usage gracefully
- [ ] Professional branding and icons are consistent
- [ ] Privacy policy mentions professional data usage
- [ ] App description emphasizes professional use case

### Final Professional Build Process
```bash
# Complete professional build workflow
cd LinkedInHeadshotApp

# Clean build environment
rm -rf node_modules ios/build ios/Pods
npm install
cd ios && pod install && cd ..

# Run professional quality checks
npm run test
npm run lint

# Build professional archive
cd ios
xcodebuild clean
xcodebuild -workspace LinkedInHeadshotApp.xcworkspace \
  -scheme LinkedInHeadshotApp \
  -configuration Release \
  -archivePath build/LinkedInHeadshotApp.xcarchive \
  archive

# Verify professional archive
xcodebuild -exportArchive \
  -archivePath build/LinkedInHeadshotApp.xcarchive \
  -exportPath build/export \
  -exportOptionsPlist exportOptions.plist
```

### Export Options Plist
```xml
<!-- exportOptions.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>destination</key>
    <string>upload</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
    <key>stripSwiftSymbols</key>
    <true/>
</dict>
</plist>
```

This configuration creates professional-grade iOS builds optimized for LinkedIn headshot generation with comprehensive professional features, proper mock services for API-free testing, and App Store-ready distribution configuration.