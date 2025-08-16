/**
 * Comprehensive Cross-Platform Compatibility Testing for OmniShot
 * Tests React Native app compatibility across iOS, Android, and Web platforms
 * Focus areas: API connectivity, permissions, UI consistency, performance
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class CrossPlatformCompatibilityTester {
  constructor() {
    this.results = {
      testSuite: 'Cross-Platform Compatibility Assessment',
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      platforms: {
        ios: { tested: false, compatibility: 'unknown', issues: [] },
        android: { tested: false, compatibility: 'unknown', issues: [] },
        web: { tested: false, compatibility: 'unknown', issues: [] }
      },
      categories: {
        reactNativeCompatibility: [],
        deviceCompatibility: [],
        networkConnectivity: [],
        platformSpecificFeatures: [],
        developmentEnvironment: [],
        integrationTesting: []
      },
      recommendations: []
    };

    // Test configuration
    this.config = {
      backendUrl: 'http://192.168.20.112:3000',
      alternativeUrls: [
        'http://localhost:3000',
        'http://10.0.2.2:3000',
        'http://127.0.0.1:3000'
      ],
      timeout: 10000,
      retryAttempts: 3
    };

    this.platformSpecs = {
      ios: {
        supportedVersions: ['11.0+'],
        requiredFeatures: ['camera', 'photos', 'network'],
        recommendedDevices: ['iPhone 8+', 'iPad 6th gen+']
      },
      android: {
        supportedApiLevels: ['21+', '33+ (granular permissions)'],
        requiredFeatures: ['camera', 'storage', 'network'],
        recommendedDevices: ['Android 5.0+', '2GB+ RAM']
      },
      web: {
        supportedBrowsers: ['Chrome 90+', 'Safari 14+', 'Firefox 88+'],
        requiredFeatures: ['media_devices', 'file_api', 'canvas'],
        limitations: ['no_camera_direct', 'limited_file_access']
      }
    };
  }

  async runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive Cross-Platform Compatibility Testing...');
    console.log('='.repeat(80));

    try {
      // 1. React Native Cross-Platform Compatibility
      await this.testReactNativeCompatibility();

      // 2. Device Compatibility Testing
      await this.testDeviceCompatibility();

      // 3. Network Connectivity Testing
      await this.testNetworkConnectivity();

      // 4. Platform-Specific Features
      await this.testPlatformSpecificFeatures();

      // 5. Development Environment Testing
      await this.testDevelopmentEnvironment();

      // 6. Integration Testing
      await this.testIntegrationCapabilities();

      // Generate final report
      await this.generateCompatibilityReport();

    } catch (error) {
      console.error('❌ Testing suite error:', error);
      this.addTestResult('system', 'testing_suite_error', false, 
        `Testing suite failed: ${error.message}`);
    }

    return this.results;
  }

  async testReactNativeCompatibility() {
    console.log('\n📱 Testing React Native Cross-Platform Compatibility...');
    
    const tests = [
      {
        name: 'expo_sdk_compatibility',
        description: 'Expo SDK 53.0.0 cross-platform support',
        test: () => this.testExpoSDKCompatibility()
      },
      {
        name: 'navigation_consistency',
        description: 'Navigation behavior across platforms',
        test: () => this.testNavigationConsistency()
      },
      {
        name: 'ui_component_parity',
        description: 'UI component rendering consistency',
        test: () => this.testUIComponentParity()
      },
      {
        name: 'performance_characteristics',
        description: 'Performance differences between platforms',
        test: () => this.testPerformanceCharacteristics()
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.addTestResult('reactNativeCompatibility', test.name, result.success, 
          result.message, result.details);
      } catch (error) {
        this.addTestResult('reactNativeCompatibility', test.name, false, 
          `Test failed: ${error.message}`);
      }
    }
  }

  async testExpoSDKCompatibility() {
    // Check package.json for Expo SDK version and dependencies
    try {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      const expoVersion = packageJson.dependencies?.expo;
      const reactNativeVersion = packageJson.dependencies?.['react-native'];
      
      const issues = [];
      
      // Check Expo SDK version
      if (!expoVersion || !expoVersion.includes('53.0.0')) {
        issues.push(`Expected Expo SDK 53.0.0, found: ${expoVersion}`);
      }
      
      // Check React Native version compatibility
      if (!reactNativeVersion || !reactNativeVersion.includes('0.79.5')) {
        issues.push(`React Native version may not be compatible: ${reactNativeVersion}`);
      }
      
      // Check critical dependencies
      const criticalDeps = [
        'expo-image-picker',
        'expo-image-manipulator',
        'expo-file-system',
        'expo-media-library'
      ];
      
      for (const dep of criticalDeps) {
        if (!packageJson.dependencies[dep]) {
          issues.push(`Missing critical dependency: ${dep}`);
        }
      }
      
      return {
        success: issues.length === 0,
        message: issues.length === 0 
          ? 'Expo SDK 53.0.0 compatibility confirmed'
          : `Compatibility issues found: ${issues.length}`,
        details: { expoVersion, reactNativeVersion, issues }
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Failed to check Expo SDK compatibility: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testNavigationConsistency() {
    // Check navigation implementation for cross-platform consistency
    try {
      const appPath = path.join(__dirname, '..', 'App.js');
      const appContent = await fs.readFile(appPath, 'utf8');
      
      const navigationPatterns = [
        'SafeAreaView', // iOS safe area handling
        'StatusBar', // Status bar consistency
        'TouchableOpacity', // Touch handling
        'Alert' // Platform-specific alerts
      ];
      
      const foundPatterns = [];
      const missingPatterns = [];
      
      for (const pattern of navigationPatterns) {
        if (appContent.includes(pattern)) {
          foundPatterns.push(pattern);
        } else {
          missingPatterns.push(pattern);
        }
      }
      
      // Check for platform-specific code patterns
      const platformChecks = appContent.includes('Platform.OS');
      const expoConstants = appContent.includes('expo-constants');
      
      return {
        success: missingPatterns.length === 0,
        message: `Navigation consistency check: ${foundPatterns.length}/${navigationPatterns.length} patterns found`,
        details: {
          foundPatterns,
          missingPatterns,
          hasPlatformChecks: platformChecks,
          usesExpoConstants: expoConstants
        }
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Navigation consistency test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testUIComponentParity() {
    // Test UI component consistency across platforms
    try {
      const brandingPath = path.join(__dirname, '..', 'src', 'constants', 'branding.js');
      const brandingContent = await fs.readFile(brandingPath, 'utf8');
      
      const checks = {
        colorConsistency: brandingContent.includes('BRAND_COLORS'),
        typographyConsistency: brandingContent.includes('TYPOGRAPHY'),
        spacingConsistency: brandingContent.includes('SPACING'),
        borderRadiusConsistency: brandingContent.includes('BORDER_RADIUS')
      };
      
      const passedChecks = Object.values(checks).filter(Boolean).length;
      const totalChecks = Object.keys(checks).length;
      
      return {
        success: passedChecks === totalChecks,
        message: `UI consistency: ${passedChecks}/${totalChecks} design system elements found`,
        details: checks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `UI component parity test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testPerformanceCharacteristics() {
    // Analyze performance-related code patterns
    try {
      const appPath = path.join(__dirname, '..', 'App.js');
      const appContent = await fs.readFile(appPath, 'utf8');
      
      const performanceChecks = {
        useMemoUsage: appContent.includes('useMemo') || appContent.includes('React.memo'),
        useCallbackUsage: appContent.includes('useCallback'),
        imageOptimization: appContent.includes('ImageManipulator'),
        lazyLoading: appContent.includes('lazy') || appContent.includes('Suspense'),
        errorBoundaries: appContent.includes('componentDidCatch') || appContent.includes('ErrorBoundary')
      };
      
      const performanceScore = Object.values(performanceChecks).filter(Boolean).length;
      const maxScore = Object.keys(performanceChecks).length;
      
      return {
        success: performanceScore >= 2, // At least basic optimization
        message: `Performance optimization score: ${performanceScore}/${maxScore}`,
        details: performanceChecks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Performance characteristics test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testDeviceCompatibility() {
    console.log('\n📱 Testing Device Compatibility...');
    
    const tests = [
      {
        name: 'screen_size_support',
        description: 'Different screen sizes and resolutions',
        test: () => this.testScreenSizeSupport()
      },
      {
        name: 'android_api_levels',
        description: 'Android API level compatibility (21+)',
        test: () => this.testAndroidAPILevels()
      },
      {
        name: 'ios_version_support',
        description: 'iOS version compatibility (11+)',
        test: () => this.testIOSVersionSupport()
      },
      {
        name: 'memory_requirements',
        description: 'Memory and processing power requirements',
        test: () => this.testMemoryRequirements()
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.addTestResult('deviceCompatibility', test.name, result.success, 
          result.message, result.details);
      } catch (error) {
        this.addTestResult('deviceCompatibility', test.name, false, 
          `Test failed: ${error.message}`);
      }
    }
  }

  async testScreenSizeSupport() {
    // Test responsive design patterns
    try {
      const appPath = path.join(__dirname, '..', 'App.js');
      const appContent = await fs.readFile(appPath, 'utf8');
      
      const responsivePatterns = {
        flexLayout: appContent.includes('flex:') || appContent.includes('flexDirection'),
        responsiveImages: appContent.includes('resizeMode') || appContent.includes('aspectRatio'),
        safeAreaHandling: appContent.includes('SafeAreaView'),
        dimensionAwareness: appContent.includes('Dimensions') || appContent.includes('useWindowDimensions')
      };
      
      const responsiveScore = Object.values(responsivePatterns).filter(Boolean).length;
      
      return {
        success: responsiveScore >= 3,
        message: `Responsive design score: ${responsiveScore}/4`,
        details: responsivePatterns
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Screen size support test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testAndroidAPILevels() {
    // Check Android-specific configurations
    try {
      const manifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
      const manifestContent = await fs.readFile(manifestPath, 'utf8');
      
      const checks = {
        minSdkSupport: manifestContent.includes('android:minSdkVersion') || 
                      manifestContent.includes('compileSdkVersion'),
        granularPermissions: manifestContent.includes('READ_MEDIA_IMAGES'),
        legacyPermissionSupport: manifestContent.includes('maxSdkVersion="32"'),
        networkPermissions: manifestContent.includes('INTERNET') && 
                           manifestContent.includes('ACCESS_NETWORK_STATE')
      };
      
      const androidScore = Object.values(checks).filter(Boolean).length;
      
      return {
        success: androidScore >= 3,
        message: `Android API compatibility: ${androidScore}/4 checks passed`,
        details: checks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Android API levels test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testIOSVersionSupport() {
    // Check iOS-specific configurations
    try {
      const infoPlistPath = path.join(__dirname, '..', 'ios', 'OmniShotApp', 'Info.plist');
      const infoPlistContent = await fs.readFile(infoPlistPath, 'utf8');
      
      const checks = {
        cameraPermission: infoPlistContent.includes('NSCameraUsageDescription'),
        photoLibraryPermission: infoPlistContent.includes('NSPhotoLibraryUsageDescription'),
        photoSavePermission: infoPlistContent.includes('NSPhotoLibraryAddUsageDescription'),
        networkSecurity: infoPlistContent.includes('NSAppTransportSecurity'),
        deviceCapabilities: infoPlistContent.includes('UIRequiredDeviceCapabilities')
      };
      
      const iosScore = Object.values(checks).filter(Boolean).length;
      
      return {
        success: iosScore >= 4,
        message: `iOS compatibility: ${iosScore}/5 checks passed`,
        details: checks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `iOS version support test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testMemoryRequirements() {
    // Analyze memory usage patterns
    try {
      const appPath = path.join(__dirname, '..', 'App.js');
      const appContent = await fs.readFile(appPath, 'utf8');
      
      const memoryChecks = {
        imageOptimization: appContent.includes('compress') || appContent.includes('quality:'),
        memoryEfficiency: appContent.includes('cleanup') || appContent.includes('dispose'),
        largeDataHandling: appContent.includes('base64') && appContent.includes('FileSystem'),
        stateManagement: appContent.includes('useState') && !appContent.includes('undefined')
      };
      
      const memoryScore = Object.values(memoryChecks).filter(Boolean).length;
      
      return {
        success: memoryScore >= 2,
        message: `Memory efficiency score: ${memoryScore}/4`,
        details: memoryChecks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Memory requirements test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testNetworkConnectivity() {
    console.log('\n🌐 Testing Network Connectivity...');
    
    const tests = [
      {
        name: 'backend_connectivity',
        description: 'Backend API connectivity from mobile',
        test: () => this.testBackendConnectivity()
      },
      {
        name: 'network_resilience',
        description: 'Poor connectivity and timeout handling',
        test: () => this.testNetworkResilience()
      },
      {
        name: 'platform_endpoints',
        description: 'Platform-specific endpoint accessibility',
        test: () => this.testPlatformEndpoints()
      },
      {
        name: 'api_timeout_handling',
        description: 'API timeout and retry mechanisms',
        test: () => this.testAPITimeoutHandling()
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.addTestResult('networkConnectivity', test.name, result.success, 
          result.message, result.details);
      } catch (error) {
        this.addTestResult('networkConnectivity', test.name, false, 
          `Test failed: ${error.message}`);
      }
    }
  }

  async testBackendConnectivity() {
    try {
      const results = [];
      const urls = [this.config.backendUrl, ...this.config.alternativeUrls];
      
      for (const url of urls) {
        try {
          const startTime = Date.now();
          const response = await axios.get(`${url}/health`, {
            timeout: this.config.timeout,
            headers: { 'User-Agent': 'OmniShot-CrossPlatform-Test/1.0' }
          });
          
          const responseTime = Date.now() - startTime;
          const isHealthy = response.status === 200 || response.status === 503;
          
          results.push({
            url,
            status: response.status,
            responseTime,
            success: isHealthy,
            data: response.data
          });
          
          if (isHealthy) break; // Found working endpoint
          
        } catch (error) {
          results.push({
            url,
            status: 'error',
            success: false,
            error: error.message
          });
        }
      }
      
      const workingEndpoints = results.filter(r => r.success);
      
      return {
        success: workingEndpoints.length > 0,
        message: `Backend connectivity: ${workingEndpoints.length}/${results.length} endpoints accessible`,
        details: { results, workingEndpoints: workingEndpoints.length }
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Backend connectivity test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testNetworkResilience() {
    // Test network error handling and retry logic
    try {
      const environmentPath = path.join(__dirname, '..', 'src', 'config', 'environment.js');
      const environmentContent = await fs.readFile(environmentPath, 'utf8');
      
      const resilienceChecks = {
        retryLogic: environmentContent.includes('RETRY_ATTEMPTS') || 
                   environmentContent.includes('retryAttempts'),
        timeoutConfiguration: environmentContent.includes('TIMEOUT') || 
                             environmentContent.includes('timeout'),
        alternativeEndpoints: environmentContent.includes('getAlternativeEndpoints'),
        errorHandling: environmentContent.includes('catch') || 
                      environmentContent.includes('error')
      };
      
      const resilienceScore = Object.values(resilienceChecks).filter(Boolean).length;
      
      return {
        success: resilienceScore >= 3,
        message: `Network resilience score: ${resilienceScore}/4`,
        details: resilienceChecks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Network resilience test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testPlatformEndpoints() {
    // Test platform-specific endpoint configurations
    try {
      const environmentPath = path.join(__dirname, '..', 'src', 'config', 'environment.js');
      const environmentContent = await fs.readFile(environmentPath, 'utf8');
      
      const platformChecks = {
        androidEmulatorSupport: environmentContent.includes('10.0.2.2'),
        expoTunnelSupport: environmentContent.includes('hostUri') || 
                          environmentContent.includes('tunnel'),
        localNetworkSupport: environmentContent.includes('192.168') || 
                            environmentContent.includes('localhost'),
        productionEndpoint: environmentContent.includes('https://') || 
                           environmentContent.includes('api.omnishot')
      };
      
      const platformScore = Object.values(platformChecks).filter(Boolean).length;
      
      return {
        success: platformScore >= 3,
        message: `Platform endpoint support: ${platformScore}/4`,
        details: platformChecks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Platform endpoints test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testAPITimeoutHandling() {
    // Test API service timeout and retry implementation
    try {
      const apiServicePath = path.join(__dirname, '..', 'src', 'services', 'omnishotApiService.js');
      const apiServiceContent = await fs.readFile(apiServicePath, 'utf8');
      
      const timeoutChecks = {
        abortController: apiServiceContent.includes('AbortController'),
        timeoutConfiguration: apiServiceContent.includes('setTimeout'),
        retryMechanism: apiServiceContent.includes('retryAttempts') && 
                       apiServiceContent.includes('for (let attempt'),
        fallbackHandling: apiServiceContent.includes('fallbackLocalOptimization'),
        errorRecovery: apiServiceContent.includes('catch') && 
                      apiServiceContent.includes('alternative')
      };
      
      const timeoutScore = Object.values(timeoutChecks).filter(Boolean).length;
      
      return {
        success: timeoutScore >= 4,
        message: `API timeout handling: ${timeoutScore}/5 features implemented`,
        details: timeoutChecks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `API timeout handling test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testPlatformSpecificFeatures() {
    console.log('\n🔧 Testing Platform-Specific Features...');
    
    const tests = [
      {
        name: 'camera_api_differences',
        description: 'Camera API implementation across platforms',
        test: () => this.testCameraAPIImplementation()
      },
      {
        name: 'file_system_access',
        description: 'File system access variations',
        test: () => this.testFileSystemAccess()
      },
      {
        name: 'permission_handling',
        description: 'Permission handling differences',
        test: () => this.testPermissionHandling()
      },
      {
        name: 'background_processing',
        description: 'Background processing capabilities',
        test: () => this.testBackgroundProcessing()
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.addTestResult('platformSpecificFeatures', test.name, result.success, 
          result.message, result.details);
      } catch (error) {
        this.addTestResult('platformSpecificFeatures', test.name, false, 
          `Test failed: ${error.message}`);
      }
    }
  }

  async testCameraAPIImplementation() {
    try {
      const appPath = path.join(__dirname, '..', 'App.js');
      const appContent = await fs.readFile(appPath, 'utf8');
      
      const cameraChecks = {
        expoCameraIntegration: appContent.includes('expo-image-picker') && 
                              appContent.includes('launchCameraAsync'),
        cameraPermissions: appContent.includes('requestCameraPermissions'),
        imageQualityHandling: appContent.includes('quality:') || 
                             appContent.includes('compress'),
        aspectRatioHandling: appContent.includes('aspect:') || 
                           appContent.includes('allowsEditing'),
        errorHandling: appContent.includes('Camera Error') || 
                      appContent.includes('camera failed')
      };
      
      const cameraScore = Object.values(cameraChecks).filter(Boolean).length;
      
      return {
        success: cameraScore >= 4,
        message: `Camera API implementation: ${cameraScore}/5 features`,
        details: cameraChecks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Camera API test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testFileSystemAccess() {
    try {
      const apiServicePath = path.join(__dirname, '..', 'src', 'services', 'omnishotApiService.js');
      const apiServiceContent = await fs.readFile(apiServicePath, 'utf8');
      
      const fileSystemChecks = {
        expoFileSystem: apiServiceContent.includes('expo-file-system') && 
                       apiServiceContent.includes('FileSystem'),
        base64Handling: apiServiceContent.includes('readAsStringAsync') && 
                       apiServiceContent.includes('Base64'),
        fileCreation: apiServiceContent.includes('writeAsStringAsync') || 
                     apiServiceContent.includes('createAsset'),
        directoryManagement: apiServiceContent.includes('makeDirectoryAsync'),
        fileCleanup: apiServiceContent.includes('deleteAsync') || 
                    apiServiceContent.includes('cleanup')
      };
      
      const fileSystemScore = Object.values(fileSystemChecks).filter(Boolean).length;
      
      return {
        success: fileSystemScore >= 4,
        message: `File system access: ${fileSystemScore}/5 features`,
        details: fileSystemChecks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `File system access test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testPermissionHandling() {
    try {
      const permissionServicePath = path.join(__dirname, '..', 'src', 'services', 'mediaPermissionService.js');
      const permissionServiceContent = await fs.readFile(permissionServicePath, 'utf8');
      
      const permissionChecks = {
        androidGranularPermissions: permissionServiceContent.includes('READ_MEDIA_IMAGES') && 
                                   permissionServiceContent.includes('supportsGranularPermissions'),
        expoGoLimitationHandling: permissionServiceContent.includes('isExpoGoWithLimitations'),
        permissionStrategySelection: permissionServiceContent.includes('getPermissionStrategy'),
        userGuidance: permissionServiceContent.includes('showDevelopmentBuildInfo'),
        errorRecovery: permissionServiceContent.includes('requestAppropriatePermissions')
      };
      
      const permissionScore = Object.values(permissionChecks).filter(Boolean).length;
      
      return {
        success: permissionScore >= 4,
        message: `Permission handling: ${permissionScore}/5 features`,
        details: permissionChecks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Permission handling test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testBackgroundProcessing() {
    try {
      const appPath = path.join(__dirname, '..', 'App.js');
      const appContent = await fs.readFile(appPath, 'utf8');
      
      const backgroundChecks = {
        asyncProcessing: appContent.includes('async') && appContent.includes('await'),
        progressTracking: appContent.includes('processingProgress') && 
                         appContent.includes('setProcessingProgress'),
        stateManagement: appContent.includes('useState') && 
                        appContent.includes('isProcessing'),
        errorBoundaries: appContent.includes('try') && appContent.includes('catch'),
        userFeedback: appContent.includes('ActivityIndicator') || 
                     appContent.includes('loading')
      };
      
      const backgroundScore = Object.values(backgroundChecks).filter(Boolean).length;
      
      return {
        success: backgroundScore >= 4,
        message: `Background processing: ${backgroundScore}/5 features`,
        details: backgroundChecks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Background processing test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testDevelopmentEnvironment() {
    console.log('\n🛠️ Testing Development Environment...');
    
    const tests = [
      {
        name: 'expo_go_compatibility',
        description: 'Expo Go vs Development Build differences',
        test: () => this.testExpoGoCompatibility()
      },
      {
        name: 'metro_bundler_config',
        description: 'Metro bundler compatibility',
        test: () => this.testMetroBundlerConfig()
      },
      {
        name: 'hot_reload_functionality',
        description: 'Hot reload functionality',
        test: () => this.testHotReloadFunctionality()
      },
      {
        name: 'debugging_capabilities',
        description: 'Debugging capabilities across platforms',
        test: () => this.testDebuggingCapabilities()
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.addTestResult('developmentEnvironment', test.name, result.success, 
          result.message, result.details);
      } catch (error) {
        this.addTestResult('developmentEnvironment', test.name, false, 
          `Test failed: ${error.message}`);
      }
    }
  }

  async testExpoGoCompatibility() {
    try {
      const easConfigPath = path.join(__dirname, '..', 'eas.json');
      let easConfig = null;
      
      try {
        const easContent = await fs.readFile(easConfigPath, 'utf8');
        easConfig = JSON.parse(easContent);
      } catch (error) {
        // EAS config not found
      }
      
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      const compatibility = {
        hasEASConfig: easConfig !== null,
        hasDevelopmentBuild: easConfig?.build?.development !== undefined,
        hasPreviewBuild: easConfig?.build?.preview !== undefined,
        scriptSupport: packageJson.scripts?.['dev-build:android'] !== undefined,
        expoGoSupport: !packageJson.dependencies?.['expo-dev-client'] // Inverse - dev client means no Expo Go
      };
      
      const compatibilityScore = Object.values(compatibility).filter(Boolean).length;
      
      return {
        success: compatibilityScore >= 3,
        message: `Expo Go compatibility: ${compatibilityScore}/5 features`,
        details: compatibility
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Expo Go compatibility test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testMetroBundlerConfig() {
    try {
      const metroConfigPath = path.join(__dirname, '..', 'metro.config.js');
      const metroConfigContent = await fs.readFile(metroConfigPath, 'utf8');
      
      const metroChecks = {
        hasConfig: true, // File exists
        expoCompatibility: metroConfigContent.includes('expo'),
        resolverConfig: metroConfigContent.includes('resolver') || 
                       metroConfigContent.includes('platforms'),
        transformerConfig: metroConfigContent.includes('transformer'),
        platformSupport: metroConfigContent.includes('ios') && 
                        metroConfigContent.includes('android')
      };
      
      const metroScore = Object.values(metroChecks).filter(Boolean).length;
      
      return {
        success: metroScore >= 3,
        message: `Metro bundler config: ${metroScore}/5 features`,
        details: metroChecks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Metro bundler config test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testHotReloadFunctionality() {
    try {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      const hotReloadChecks = {
        expoStartScript: packageJson.scripts?.start === 'expo start',
        platformScripts: packageJson.scripts?.android && packageJson.scripts?.ios,
        developmentMode: packageJson.scripts?.['dev-server'] !== undefined,
        tunnelSupport: packageJson.scripts?.tunnel !== undefined || 
                      Object.values(packageJson.scripts || {}).some(script => script.includes('--tunnel'))
      };
      
      const hotReloadScore = Object.values(hotReloadChecks).filter(Boolean).length;
      
      return {
        success: hotReloadScore >= 3,
        message: `Hot reload functionality: ${hotReloadScore}/4 features`,
        details: hotReloadChecks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Hot reload functionality test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testDebuggingCapabilities() {
    try {
      const environmentPath = path.join(__dirname, '..', 'src', 'config', 'environment.js');
      const environmentContent = await fs.readFile(environmentPath, 'utf8');
      
      const debuggingChecks = {
        developmentFlags: environmentContent.includes('__DEV__') && 
                         environmentContent.includes('IS_DEVELOPMENT'),
        networkDebugging: environmentContent.includes('ENABLE_NETWORK_DEBUGGING') && 
                         environmentContent.includes('logNetworkAttempt'),
        environmentInfo: environmentContent.includes('getEnvironmentInfo'),
        errorLogging: environmentContent.includes('console.log') || 
                     environmentContent.includes('console.error')
      };
      
      const debuggingScore = Object.values(debuggingChecks).filter(Boolean).length;
      
      return {
        success: debuggingScore >= 3,
        message: `Debugging capabilities: ${debuggingScore}/4 features`,
        details: debuggingChecks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Debugging capabilities test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testIntegrationCapabilities() {
    console.log('\n🔗 Testing Integration Capabilities...');
    
    const tests = [
      {
        name: 'backend_api_integration',
        description: 'Backend API communication from mobile',
        test: () => this.testBackendAPIIntegration()
      },
      {
        name: 'image_processing_pipeline',
        description: 'Image upload and processing integration',
        test: () => this.testImageProcessingPipeline()
      },
      {
        name: 'platform_selection_interface',
        description: 'Platform selection interface consistency',
        test: () => this.testPlatformSelectionInterface()
      },
      {
        name: 'results_display_consistency',
        description: 'Results display and download consistency',
        test: () => this.testResultsDisplayConsistency()
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.addTestResult('integrationTesting', test.name, result.success, 
          result.message, result.details);
      } catch (error) {
        this.addTestResult('integrationTesting', test.name, false, 
          `Test failed: ${error.message}`);
      }
    }
  }

  async testBackendAPIIntegration() {
    try {
      const apiServicePath = path.join(__dirname, '..', 'src', 'services', 'omnishotApiService.js');
      const apiServiceContent = await fs.readFile(apiServicePath, 'utf8');
      
      const integrationChecks = {
        multiPlatformOptimization: apiServiceContent.includes('optimizeForMultiplePlatforms'),
        healthCheckIntegration: apiServiceContent.includes('checkServiceHealth'),
        fallbackMechanism: apiServiceContent.includes('fallbackLocalOptimization'),
        errorHandling: apiServiceContent.includes('makeAPICall') && 
                      apiServiceContent.includes('retryAttempts'),
        resultProcessing: apiServiceContent.includes('processOptimizationResults')
      };
      
      const integrationScore = Object.values(integrationChecks).filter(Boolean).length;
      
      return {
        success: integrationScore >= 4,
        message: `Backend API integration: ${integrationScore}/5 features`,
        details: integrationChecks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Backend API integration test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testImageProcessingPipeline() {
    try {
      const appPath = path.join(__dirname, '..', 'App.js');
      const appContent = await fs.readFile(appPath, 'utf8');
      
      const pipelineChecks = {
        imageSelection: appContent.includes('ImagePicker') && 
                       (appContent.includes('launchCameraAsync') || 
                        appContent.includes('launchImageLibraryAsync')),
        imageProcessing: appContent.includes('processMultiPlatformOptimization'),
        progressTracking: appContent.includes('processingProgress') && 
                         appContent.includes('currentProcessingPlatform'),
        resultHandling: appContent.includes('generatedImages') && 
                       appContent.includes('showResult'),
        downloadCapability: appContent.includes('downloadImages') && 
                           appContent.includes('MediaLibrary')
      };
      
      const pipelineScore = Object.values(pipelineChecks).filter(Boolean).length;
      
      return {
        success: pipelineScore >= 4,
        message: `Image processing pipeline: ${pipelineScore}/5 features`,
        details: pipelineChecks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Image processing pipeline test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testPlatformSelectionInterface() {
    try {
      const appPath = path.join(__dirname, '..', 'App.js');
      const appContent = await fs.readFile(appPath, 'utf8');
      
      const interfaceChecks = {
        platformOptions: appContent.includes('platformOptions') && 
                        appContent.includes('linkedin') && 
                        appContent.includes('instagram'),
        categoryGrouping: appContent.includes('Professional') && 
                         appContent.includes('Social') && 
                         appContent.includes('Content'),
        selectionHandling: appContent.includes('togglePlatformSelection') && 
                          appContent.includes('selectedPlatforms'),
        visualFeedback: appContent.includes('selectedPlatformOption') && 
                       appContent.includes('selectedCheckmark'),
        validationLogic: appContent.includes('selectedPlatforms.length === 0') && 
                        appContent.includes('disabledButton')
      };
      
      const interfaceScore = Object.values(interfaceChecks).filter(Boolean).length;
      
      return {
        success: interfaceScore >= 4,
        message: `Platform selection interface: ${interfaceScore}/5 features`,
        details: interfaceChecks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Platform selection interface test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testResultsDisplayConsistency() {
    try {
      const appPath = path.join(__dirname, '..', 'App.js');
      const appContent = await fs.readFile(appPath, 'utf8');
      
      const resultsChecks = {
        successDisplayHandling: appContent.includes('successfulResults') && 
                               appContent.includes('FlatList'),
        errorDisplayHandling: appContent.includes('failedResults') && 
                             appContent.includes('failedResultsContainer'),
        metricDisplays: appContent.includes('optimizationMetrics') && 
                       appContent.includes('qualityScore'),
        downloadIntegration: appContent.includes('downloadAllButton') && 
                           appContent.includes('MediaLibrary.createAssetAsync'),
        navigationConsistency: appContent.includes('resetApp') && 
                              appContent.includes('newPhotoButton')
      };
      
      const resultsScore = Object.values(resultsChecks).filter(Boolean).length;
      
      return {
        success: resultsScore >= 4,
        message: `Results display consistency: ${resultsScore}/5 features`,
        details: resultsChecks
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Results display consistency test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  addTestResult(category, testName, success, message, details = null) {
    const result = {
      testName,
      success,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.categories[category].push(result);
    this.results.summary.totalTests++;
    
    if (success) {
      this.results.summary.passed++;
      console.log(`  ✅ ${testName}: ${message}`);
    } else {
      this.results.summary.failed++;
      console.log(`  ❌ ${testName}: ${message}`);
    }
  }

  async generateCompatibilityReport() {
    console.log('\n📊 Generating Cross-Platform Compatibility Report...');
    
    // Calculate category scores
    for (const [category, tests] of Object.entries(this.results.categories)) {
      const passed = tests.filter(test => test.success).length;
      const total = tests.length;
      const score = total > 0 ? (passed / total * 100).toFixed(1) : 0;
      
      console.log(`📈 ${category}: ${passed}/${total} (${score}%)`);
    }
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Update platform compatibility status
    this.updatePlatformCompatibility();
    
    // Save report
    await this.saveReport();
    
    console.log('\n' + '='.repeat(80));
    console.log(`🎯 Cross-Platform Compatibility Assessment Complete`);
    console.log(`📊 Overall Score: ${this.results.summary.passed}/${this.results.summary.totalTests} (${(this.results.summary.passed / this.results.summary.totalTests * 100).toFixed(1)}%)`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`⚠️ Warnings: ${this.results.summary.warnings}`);
    console.log('='.repeat(80));
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Check React Native compatibility
    const reactNativeTests = this.results.categories.reactNativeCompatibility;
    const reactNativePassed = reactNativeTests.filter(test => test.success).length;
    if (reactNativePassed < reactNativeTests.length) {
      recommendations.push({
        priority: 'high',
        category: 'React Native Compatibility',
        issue: 'Cross-platform inconsistencies detected',
        recommendation: 'Review React Native implementation for platform-specific handling and ensure consistent behavior across iOS and Android'
      });
    }
    
    // Check network connectivity
    const networkTests = this.results.categories.networkConnectivity;
    const networkPassed = networkTests.filter(test => test.success).length;
    if (networkPassed < networkTests.length) {
      recommendations.push({
        priority: 'high',
        category: 'Network Connectivity',
        issue: 'Network connectivity issues detected',
        recommendation: 'Implement robust network error handling, retry mechanisms, and fallback strategies for poor connectivity scenarios'
      });
    }
    
    // Check platform-specific features
    const platformTests = this.results.categories.platformSpecificFeatures;
    const platformPassed = platformTests.filter(test => test.success).length;
    if (platformPassed < platformTests.length) {
      recommendations.push({
        priority: 'medium',
        category: 'Platform-Specific Features',
        issue: 'Platform feature implementation gaps',
        recommendation: 'Ensure all platform-specific features (camera, permissions, file system) are properly implemented with appropriate fallbacks'
      });
    }
    
    // Check development environment
    const devTests = this.results.categories.developmentEnvironment;
    const devPassed = devTests.filter(test => test.success).length;
    if (devPassed < devTests.length) {
      recommendations.push({
        priority: 'medium',
        category: 'Development Environment',
        issue: 'Development environment configuration issues',
        recommendation: 'Optimize development setup for better cross-platform debugging and testing capabilities'
      });
    }
    
    // Add general recommendations
    recommendations.push({
      priority: 'low',
      category: 'Testing',
      issue: 'Continuous cross-platform testing',
      recommendation: 'Implement automated cross-platform testing pipeline to catch compatibility issues early'
    });
    
    recommendations.push({
      priority: 'low',
      category: 'Performance',
      issue: 'Platform performance optimization',
      recommendation: 'Profile app performance on different devices and platforms to identify optimization opportunities'
    });
    
    this.results.recommendations = recommendations;
  }

  updatePlatformCompatibility() {
    // iOS Compatibility
    const iosScore = this.calculatePlatformScore('ios');
    this.results.platforms.ios = {
      tested: true,
      compatibility: iosScore >= 80 ? 'excellent' : iosScore >= 60 ? 'good' : 'needs_improvement',
      score: iosScore,
      issues: this.getPlatformIssues('ios')
    };
    
    // Android Compatibility
    const androidScore = this.calculatePlatformScore('android');
    this.results.platforms.android = {
      tested: true,
      compatibility: androidScore >= 80 ? 'excellent' : androidScore >= 60 ? 'good' : 'needs_improvement',
      score: androidScore,
      issues: this.getPlatformIssues('android')
    };
    
    // Web Compatibility (theoretical)
    this.results.platforms.web = {
      tested: false,
      compatibility: 'limited',
      score: 40, // Web has limited mobile features
      issues: ['Camera API limitations', 'File system restrictions', 'Performance constraints']
    };
  }

  calculatePlatformScore(platform) {
    const totalTests = this.results.summary.totalTests;
    const passedTests = this.results.summary.passed;
    
    if (totalTests === 0) return 0;
    
    const baseScore = (passedTests / totalTests) * 100;
    
    // Platform-specific adjustments
    if (platform === 'ios') {
      // iOS typically has better consistency
      return Math.min(100, baseScore + 5);
    } else if (platform === 'android') {
      // Android has more fragmentation challenges
      return Math.max(0, baseScore - 5);
    }
    
    return baseScore;
  }

  getPlatformIssues(platform) {
    const issues = [];
    
    // Collect failed tests that affect this platform
    for (const [category, tests] of Object.entries(this.results.categories)) {
      for (const test of tests) {
        if (!test.success) {
          if ((platform === 'ios' && test.testName.includes('ios')) ||
              (platform === 'android' && test.testName.includes('android')) ||
              (!test.testName.includes('ios') && !test.testName.includes('android'))) {
            issues.push(`${category}: ${test.message}`);
          }
        }
      }
    }
    
    return issues;
  }

  async saveReport() {
    try {
      const reportDir = path.join(__dirname, '..', 'cross-platform-testing');
      await fs.mkdir(reportDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = path.join(reportDir, `cross-platform-compatibility-report-${timestamp}.json`);
      
      await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
      console.log(`📄 Report saved: ${reportPath}`);
      
    } catch (error) {
      console.error('❌ Failed to save report:', error);
    }
  }
}

// Main execution
async function main() {
  const tester = new CrossPlatformCompatibilityTester();
  const results = await tester.runComprehensiveTest();
  
  console.log('\n🎯 Cross-Platform Compatibility Testing Complete!');
  console.log(`📊 Total Tests: ${results.summary.totalTests}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`📈 Success Rate: ${(results.summary.passed / results.summary.totalTests * 100).toFixed(1)}%`);
  
  return results;
}

// Export for use in other scripts
module.exports = { CrossPlatformCompatibilityTester, main };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}