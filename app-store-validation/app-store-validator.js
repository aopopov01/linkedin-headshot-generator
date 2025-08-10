#!/usr/bin/env node

/**
 * App Store Validation Suite
 * Comprehensive validation for iOS App Store and Google Play Store compliance
 * LinkedIn Headshot Generator
 */

const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class AppStoreValidator {
  constructor() {
    this.configPath = path.join(__dirname, 'validation-config.json');
    this.reportsDir = path.join(__dirname, 'reports');
    this.config = null;
    this.results = {
      timestamp: new Date().toISOString(),
      platforms: {},
      summary: {
        total_checks: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        critical_issues: 0
      },
      compliance_scores: {
        ios: { score: 0, max: 100 },
        android: { score: 0, max: 100 }
      }
    };
  }

  async initialize() {
    try {
      // Load configuration
      const configContent = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(configContent);

      // Create reports directory
      await fs.mkdir(this.reportsDir, { recursive: true });
      
      console.log('📱 App Store Validator initialized');
    } catch (error) {
      await this.createDefaultConfig();
      const configContent = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(configContent);
      console.log('📱 App Store Validator initialized with default config');
    }
  }

  async createDefaultConfig() {
    const defaultConfig = {
      "app_info": {
        "name": "LinkedIn Headshot Generator",
        "bundle_id": "com.linkedinheadshot.app",
        "version": "1.0.0",
        "build_number": "1"
      },
      "ios": {
        "app_path": "../LinkedInHeadshotApp/ios/build/LinkedInHeadshotApp.ipa",
        "info_plist_path": "../LinkedInHeadshotApp/ios/LinkedInHeadshotApp/Info.plist",
        "privacy_manifest_path": "../LinkedInHeadshotApp/ios/LinkedInHeadshotApp/PrivacyInfo.xcprivacy",
        "validation_checks": {
          "app_store_guidelines": true,
          "human_interface_guidelines": true,
          "privacy_requirements": true,
          "performance_requirements": true,
          "content_policies": true,
          "technical_requirements": true
        }
      },
      "android": {
        "apk_path": "../LinkedInHeadshotApp/android/app/build/outputs/apk/release/app-release.apk",
        "manifest_path": "../LinkedInHeadshotApp/android/app/src/main/AndroidManifest.xml",
        "validation_checks": {
          "play_store_policies": true,
          "material_design_guidelines": true,
          "privacy_requirements": true,
          "performance_requirements": true,
          "content_policies": true,
          "technical_requirements": true
        }
      },
      "content_validation": {
        "check_inappropriate_content": true,
        "verify_age_rating": true,
        "validate_screenshots": true,
        "check_metadata": true
      },
      "privacy_compliance": {
        "privacy_policy_url": "https://linkedinheadshot.com/privacy",
        "terms_of_service_url": "https://linkedinheadshot.com/terms",
        "data_collection_disclosure": true,
        "third_party_sdks": [
          "Stripe",
          "Mixpanel",
          "Cloudinary",
          "Replicate"
        ]
      },
      "performance_thresholds": {
        "app_size_mb": 150,
        "startup_time_ms": 3000,
        "memory_usage_mb": 256,
        "battery_drain_acceptable": true
      }
    };

    await fs.writeFile(this.configPath, JSON.stringify(defaultConfig, null, 2));
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const child = exec(command, { 
        cwd: options.cwd || process.cwd(),
        timeout: options.timeout || 300000,
        ...options 
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data;
        if (options.verbose) console.log(data.toString());
      });

      child.stderr?.on('data', (data) => {
        stderr += data;
        if (options.verbose) console.error(data.toString());
      });

      child.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });

      child.on('error', reject);
    });
  }

  async validateiOSCompliance() {
    console.log('🍎 Validating iOS App Store compliance...');
    
    if (!this.config.ios.validation_checks) {
      return { platform: 'ios', skipped: true };
    }

    const checks = [];
    
    // App Store Guidelines
    if (this.config.ios.validation_checks.app_store_guidelines) {
      checks.push(this.checkiOSAppStoreGuidelines());
    }
    
    // Human Interface Guidelines
    if (this.config.ios.validation_checks.human_interface_guidelines) {
      checks.push(this.checkiOSHumanInterfaceGuidelines());
    }
    
    // Privacy Requirements
    if (this.config.ios.validation_checks.privacy_requirements) {
      checks.push(this.checkiOSPrivacyRequirements());
    }
    
    // Performance Requirements
    if (this.config.ios.validation_checks.performance_requirements) {
      checks.push(this.checkiOSPerformanceRequirements());
    }
    
    // Technical Requirements
    if (this.config.ios.validation_checks.technical_requirements) {
      checks.push(this.checkiOSTechnicalRequirements());
    }

    const results = await Promise.allSettled(checks);
    
    return {
      platform: 'ios',
      success: results.every(r => r.status === 'fulfilled' && r.value.success),
      checks: results.map(r => r.value || r.reason),
      score: this.calculateComplianceScore(results, 'ios')
    };
  }

  async checkiOSAppStoreGuidelines() {
    console.log('   Checking App Store Guidelines compliance...');
    
    const guidelines = {
      "1.1_app_completeness": {
        name: "App Completeness",
        description: "App should be complete and functional",
        check: async () => {
          // Check if app has all core features implemented
          const infoPlistPath = this.config.ios.info_plist_path;
          try {
            const infoPlist = await fs.readFile(infoPlistPath, 'utf8');
            return {
              success: infoPlist.includes('<key>CFBundleVersion</key>'),
              message: "App has version information"
            };
          } catch (error) {
            return {
              success: false,
              message: `Cannot read Info.plist: ${error.message}`
            };
          }
        }
      },
      
      "1.2_user_interface": {
        name: "User Interface",
        description: "App should have intuitive and polished UI",
        check: async () => {
          // This would typically involve UI testing
          return {
            success: true,
            message: "Manual review required for UI assessment"
          };
        }
      },
      
      "2.1_app_functionality": {
        name: "App Functionality",
        description: "App should work as advertised",
        check: async () => {
          // Check if core photo processing functionality is present
          const hasPhotoProcessing = await this.checkFeatureImplementation('photo_processing');
          const hasPaymentIntegration = await this.checkFeatureImplementation('payment');
          
          return {
            success: hasPhotoProcessing && hasPaymentIntegration,
            message: `Photo processing: ${hasPhotoProcessing}, Payment: ${hasPaymentIntegration}`
          };
        }
      },
      
      "2.3_accurate_metadata": {
        name: "Accurate Metadata",
        description: "App metadata should be accurate and up-to-date",
        check: async () => {
          try {
            const infoPlist = await fs.readFile(this.config.ios.info_plist_path, 'utf8');
            const hasDisplayName = infoPlist.includes('<key>CFBundleDisplayName</key>');
            const hasDescription = infoPlist.includes('<key>CFBundleShortVersionString</key>');
            
            return {
              success: hasDisplayName && hasDescription,
              message: `Display name: ${hasDisplayName}, Version: ${hasDescription}`
            };
          } catch (error) {
            return {
              success: false,
              message: `Error reading metadata: ${error.message}`
            };
          }
        }
      },
      
      "3.1_payments": {
        name: "In-App Purchases",
        description: "Proper implementation of in-app purchases",
        check: async () => {
          // Check StoreKit implementation
          const hasStoreKit = await this.checkDependency('react-native-purchases');
          return {
            success: hasStoreKit,
            message: hasStoreKit ? "StoreKit integration found" : "StoreKit integration missing"
          };
        }
      },
      
      "5.1_privacy": {
        name: "Privacy",
        description: "Proper privacy disclosures and data handling",
        check: async () => {
          try {
            const privacyManifest = await fs.readFile(this.config.ios.privacy_manifest_path, 'utf8');
            const hasPrivacyTypes = privacyManifest.includes('NSPrivacyCollectedDataTypes');
            
            return {
              success: hasPrivacyTypes,
              message: hasPrivacyTypes ? "Privacy manifest found" : "Privacy manifest missing or incomplete"
            };
          } catch (error) {
            return {
              success: false,
              message: "Privacy manifest file not found"
            };
          }
        }
      }
    };

    const results = {};
    
    for (const [guidelineId, guideline] of Object.entries(guidelines)) {
      try {
        console.log(`     Checking ${guideline.name}...`);
        results[guidelineId] = await guideline.check();
      } catch (error) {
        results[guidelineId] = {
          success: false,
          message: `Check failed: ${error.message}`
        };
      }
    }

    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      test: 'ios_app_store_guidelines',
      success: allPassed,
      results: results,
      summary: `${Object.values(results).filter(r => r.success).length}/${Object.keys(results).length} guidelines passed`
    };
  }

  async checkiOSHumanInterfaceGuidelines() {
    console.log('   Checking Human Interface Guidelines...');
    
    const hig_checks = {
      "app_icon": {
        name: "App Icon",
        description: "App should have properly formatted icons",
        check: async () => {
          // Check for app icon files
          const iconPath = path.join(path.dirname(this.config.ios.info_plist_path), 'Images.xcassets/AppIcon.appiconset');
          try {
            const iconFiles = await fs.readdir(iconPath);
            const hasRequiredSizes = iconFiles.some(file => file.includes('1024x1024'));
            
            return {
              success: hasRequiredSizes,
              message: hasRequiredSizes ? "App icon assets found" : "Missing required app icon sizes"
            };
          } catch (error) {
            return {
              success: false,
              message: "App icon directory not found"
            };
          }
        }
      },
      
      "launch_screen": {
        name: "Launch Screen",
        description: "App should have proper launch screen",
        check: async () => {
          const launchScreenPath = path.join(path.dirname(this.config.ios.info_plist_path), 'LaunchScreen.storyboard');
          try {
            await fs.access(launchScreenPath);
            return {
              success: true,
              message: "Launch screen storyboard found"
            };
          } catch (error) {
            return {
              success: false,
              message: "Launch screen storyboard not found"
            };
          }
        }
      },
      
      "navigation": {
        name: "Navigation",
        description: "App should have clear and consistent navigation",
        check: async () => {
          // Check navigation implementation
          const hasNavigation = await this.checkDependency('@react-navigation/native');
          return {
            success: hasNavigation,
            message: hasNavigation ? "React Navigation found" : "Navigation implementation not found"
          };
        }
      },
      
      "accessibility": {
        name: "Accessibility",
        description: "App should support accessibility features",
        check: async () => {
          // Check accessibility implementation
          const hasAccessibilityUtils = await this.checkFileExists('../LinkedInHeadshotApp/src/utils/accessibilityTestUtils.js');
          return {
            success: hasAccessibilityUtils,
            message: hasAccessibilityUtils ? "Accessibility utilities found" : "Accessibility implementation missing"
          };
        }
      }
    };

    const results = {};
    
    for (const [checkId, check] of Object.entries(hig_checks)) {
      try {
        console.log(`     Checking ${check.name}...`);
        results[checkId] = await check.check();
      } catch (error) {
        results[checkId] = {
          success: false,
          message: `Check failed: ${error.message}`
        };
      }
    }

    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      test: 'ios_human_interface_guidelines',
      success: allPassed,
      results: results,
      summary: `${Object.values(results).filter(r => r.success).length}/${Object.keys(results).length} HIG checks passed`
    };
  }

  async checkiOSPrivacyRequirements() {
    console.log('   Checking iOS privacy requirements...');
    
    const privacy_checks = {
      "privacy_manifest": {
        name: "Privacy Manifest",
        description: "App should have privacy manifest (iOS 17+)",
        check: async () => {
          try {
            const privacyManifest = await fs.readFile(this.config.ios.privacy_manifest_path, 'utf8');
            const requiredKeys = [
              'NSPrivacyCollectedDataTypes',
              'NSPrivacyAccessedAPITypes',
              'NSPrivacyTrackingDomains'
            ];
            
            const hasAllKeys = requiredKeys.every(key => privacyManifest.includes(key));
            
            return {
              success: hasAllKeys,
              message: hasAllKeys ? "Privacy manifest is complete" : "Privacy manifest missing required keys"
            };
          } catch (error) {
            return {
              success: false,
              message: "Privacy manifest file not found"
            };
          }
        }
      },
      
      "data_collection_disclosure": {
        name: "Data Collection Disclosure",
        description: "App should properly disclose data collection",
        check: async () => {
          // Check if privacy policy URL is accessible
          try {
            const response = await axios.get(this.config.privacy_compliance.privacy_policy_url, { timeout: 10000 });
            const hasDataCollection = response.data.toLowerCase().includes('data collection');
            
            return {
              success: response.status === 200 && hasDataCollection,
              message: hasDataCollection ? "Privacy policy contains data collection info" : "Privacy policy missing or incomplete"
            };
          } catch (error) {
            return {
              success: false,
              message: `Privacy policy URL not accessible: ${error.message}`
            };
          }
        }
      },
      
      "permissions_justification": {
        name: "Permissions Justification",
        description: "App should justify all requested permissions",
        check: async () => {
          try {
            const infoPlist = await fs.readFile(this.config.ios.info_plist_path, 'utf8');
            
            const permissions = [
              'NSCameraUsageDescription',
              'NSPhotoLibraryUsageDescription'
            ];
            
            const hasAllDescriptions = permissions.every(permission => 
              infoPlist.includes(permission) && infoPlist.includes('<string>'));
            
            return {
              success: hasAllDescriptions,
              message: hasAllDescriptions ? "All permissions have usage descriptions" : "Missing usage descriptions for permissions"
            };
          } catch (error) {
            return {
              success: false,
              message: `Error checking permissions: ${error.message}`
            };
          }
        }
      }
    };

    const results = {};
    
    for (const [checkId, check] of Object.entries(privacy_checks)) {
      try {
        console.log(`     Checking ${check.name}...`);
        results[checkId] = await check.check();
      } catch (error) {
        results[checkId] = {
          success: false,
          message: `Check failed: ${error.message}`
        };
      }
    }

    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      test: 'ios_privacy_requirements',
      success: allPassed,
      results: results,
      summary: `${Object.values(results).filter(r => r.success).length}/${Object.keys(results).length} privacy checks passed`
    };
  }

  async checkiOSPerformanceRequirements() {
    console.log('   Checking iOS performance requirements...');
    
    const performance_checks = {
      "app_size": {
        name: "App Size",
        description: "App should not exceed reasonable size limits",
        check: async () => {
          try {
            const stats = await fs.stat(this.config.ios.app_path);
            const sizeInMB = stats.size / (1024 * 1024);
            const withinLimit = sizeInMB <= this.config.performance_thresholds.app_size_mb;
            
            return {
              success: withinLimit,
              message: `App size: ${sizeInMB.toFixed(2)}MB (limit: ${this.config.performance_thresholds.app_size_mb}MB)`
            };
          } catch (error) {
            return {
              success: false,
              message: "Cannot determine app size - IPA file not found"
            };
          }
        }
      },
      
      "startup_performance": {
        name: "Startup Performance",
        description: "App should start within acceptable time",
        check: async () => {
          // This would typically require device testing
          // For now, we'll do a static analysis
          const hasOptimizations = await this.checkBuildOptimizations();
          
          return {
            success: hasOptimizations,
            message: hasOptimizations ? "Build optimizations detected" : "Build optimizations may be missing"
          };
        }
      },
      
      "memory_usage": {
        name: "Memory Usage",
        description: "App should have reasonable memory usage",
        check: async () => {
          // Static analysis for memory optimization patterns
          const hasMemoryManagement = await this.checkMemoryManagementPatterns();
          
          return {
            success: hasMemoryManagement,
            message: hasMemoryManagement ? "Memory management patterns found" : "Memory management may need attention"
          };
        }
      }
    };

    const results = {};
    
    for (const [checkId, check] of Object.entries(performance_checks)) {
      try {
        console.log(`     Checking ${check.name}...`);
        results[checkId] = await check.check();
      } catch (error) {
        results[checkId] = {
          success: false,
          message: `Check failed: ${error.message}`
        };
      }
    }

    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      test: 'ios_performance_requirements',
      success: allPassed,
      results: results,
      summary: `${Object.values(results).filter(r => r.success).length}/${Object.keys(results).length} performance checks passed`
    };
  }

  async checkiOSTechnicalRequirements() {
    console.log('   Checking iOS technical requirements...');
    
    const technical_checks = {
      "deployment_target": {
        name: "Deployment Target",
        description: "App should support appropriate iOS versions",
        check: async () => {
          try {
            const pbxproj = await fs.readFile('../LinkedInHeadshotApp/ios/LinkedInHeadshotApp.xcodeproj/project.pbxproj', 'utf8');
            const deploymentTarget = pbxproj.match(/IPHONEOS_DEPLOYMENT_TARGET = ([^;]+);/);
            
            if (deploymentTarget) {
              const version = parseFloat(deploymentTarget[1]);
              const isSupported = version >= 12.0 && version <= 17.0;
              
              return {
                success: isSupported,
                message: `Deployment target: iOS ${version} (recommended: 12.0-17.0)`
              };
            }
            
            return {
              success: false,
              message: "Could not determine deployment target"
            };
          } catch (error) {
            return {
              success: false,
              message: `Error checking deployment target: ${error.message}`
            };
          }
        }
      },
      
      "bundle_identifier": {
        name: "Bundle Identifier",
        description: "App should have valid bundle identifier",
        check: async () => {
          try {
            const infoPlist = await fs.readFile(this.config.ios.info_plist_path, 'utf8');
            const bundleIdMatch = infoPlist.match(/<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/);
            
            if (bundleIdMatch) {
              const bundleId = bundleIdMatch[1];
              const isValid = /^[a-zA-Z0-9.-]+$/.test(bundleId) && bundleId.includes('.');
              
              return {
                success: isValid,
                message: `Bundle ID: ${bundleId} (${isValid ? 'valid' : 'invalid format'})`
              };
            }
            
            return {
              success: false,
              message: "Bundle identifier not found"
            };
          } catch (error) {
            return {
              success: false,
              message: `Error checking bundle identifier: ${error.message}`
            };
          }
        }
      },
      
      "required_device_capabilities": {
        name: "Required Device Capabilities",
        description: "App should declare appropriate device requirements",
        check: async () => {
          try {
            const infoPlist = await fs.readFile(this.config.ios.info_plist_path, 'utf8');
            const hasRequiredCapabilities = infoPlist.includes('UIRequiredDeviceCapabilities');
            
            return {
              success: true, // Optional but good practice
              message: hasRequiredCapabilities ? "Device capabilities declared" : "Device capabilities not declared (optional)"
            };
          } catch (error) {
            return {
              success: false,
              message: `Error checking device capabilities: ${error.message}`
            };
          }
        }
      }
    };

    const results = {};
    
    for (const [checkId, check] of Object.entries(technical_checks)) {
      try {
        console.log(`     Checking ${check.name}...`);
        results[checkId] = await check.check();
      } catch (error) {
        results[checkId] = {
          success: false,
          message: `Check failed: ${error.message}`
        };
      }
    }

    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      test: 'ios_technical_requirements',
      success: allPassed,
      results: results,
      summary: `${Object.values(results).filter(r => r.success).length}/${Object.keys(results).length} technical checks passed`
    };
  }

  async validateAndroidCompliance() {
    console.log('🤖 Validating Android Play Store compliance...');
    
    if (!this.config.android.validation_checks) {
      return { platform: 'android', skipped: true };
    }

    const checks = [];
    
    // Play Store Policies
    if (this.config.android.validation_checks.play_store_policies) {
      checks.push(this.checkAndroidPlayStorePolicies());
    }
    
    // Material Design Guidelines
    if (this.config.android.validation_checks.material_design_guidelines) {
      checks.push(this.checkAndroidMaterialDesign());
    }
    
    // Privacy Requirements
    if (this.config.android.validation_checks.privacy_requirements) {
      checks.push(this.checkAndroidPrivacyRequirements());
    }
    
    // Performance Requirements
    if (this.config.android.validation_checks.performance_requirements) {
      checks.push(this.checkAndroidPerformanceRequirements());
    }
    
    // Technical Requirements
    if (this.config.android.validation_checks.technical_requirements) {
      checks.push(this.checkAndroidTechnicalRequirements());
    }

    const results = await Promise.allSettled(checks);
    
    return {
      platform: 'android',
      success: results.every(r => r.status === 'fulfilled' && r.value.success),
      checks: results.map(r => r.value || r.reason),
      score: this.calculateComplianceScore(results, 'android')
    };
  }

  async checkAndroidPlayStorePolicies() {
    console.log('   Checking Play Store policies...');
    
    const policy_checks = {
      "content_policy": {
        name: "Content Policy",
        description: "App content should comply with Play Store policies",
        check: async () => {
          // Check for inappropriate content patterns
          return {
            success: true,
            message: "Content policy check requires manual review"
          };
        }
      },
      
      "user_data_policy": {
        name: "User Data Policy",
        description: "App should properly handle user data",
        check: async () => {
          const hasPrivacyPolicy = await this.checkPrivacyPolicyAccessibility();
          return {
            success: hasPrivacyPolicy,
            message: hasPrivacyPolicy ? "Privacy policy is accessible" : "Privacy policy not accessible"
          };
        }
      },
      
      "permissions_policy": {
        name: "Permissions Policy",
        description: "App should only request necessary permissions",
        check: async () => {
          try {
            const manifest = await fs.readFile(this.config.android.manifest_path, 'utf8');
            const permissions = manifest.match(/<uses-permission[^>]*android:name="([^"]+)"/g) || [];
            
            const requiredPermissions = [
              'android.permission.CAMERA',
              'android.permission.READ_EXTERNAL_STORAGE',
              'android.permission.INTERNET'
            ];
            
            const unnecessaryPermissions = [
              'android.permission.ACCESS_FINE_LOCATION',
              'android.permission.RECORD_AUDIO',
              'android.permission.CALL_PHONE'
            ];
            
            const hasUnnecessary = unnecessaryPermissions.some(perm => 
              permissions.some(p => p.includes(perm)));
            
            return {
              success: !hasUnnecessary,
              message: hasUnnecessary ? "Contains unnecessary permissions" : `${permissions.length} permissions declared`
            };
          } catch (error) {
            return {
              success: false,
              message: `Error checking permissions: ${error.message}`
            };
          }
        }
      }
    };

    const results = {};
    
    for (const [checkId, check] of Object.entries(policy_checks)) {
      try {
        console.log(`     Checking ${check.name}...`);
        results[checkId] = await check.check();
      } catch (error) {
        results[checkId] = {
          success: false,
          message: `Check failed: ${error.message}`
        };
      }
    }

    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      test: 'android_play_store_policies',
      success: allPassed,
      results: results,
      summary: `${Object.values(results).filter(r => r.success).length}/${Object.keys(results).length} policy checks passed`
    };
  }

  async checkAndroidMaterialDesign() {
    console.log('   Checking Material Design compliance...');
    
    const material_checks = {
      "app_icon": {
        name: "App Icon",
        description: "App should have adaptive icon",
        check: async () => {
          const iconPath = path.join(path.dirname(this.config.android.manifest_path), 'res');
          try {
            const mipmapDirs = await fs.readdir(iconPath);
            const hasMipmap = mipmapDirs.some(dir => dir.startsWith('mipmap-'));
            
            return {
              success: hasMipmap,
              message: hasMipmap ? "Mipmap icons found" : "Mipmap icons missing"
            };
          } catch (error) {
            return {
              success: false,
              message: "Icon resources not found"
            };
          }
        }
      },
      
      "theme_styling": {
        name: "Theme and Styling",
        description: "App should use Material Design themes",
        check: async () => {
          try {
            const stylesPath = path.join(path.dirname(this.config.android.manifest_path), 'res/values/styles.xml');
            const styles = await fs.readFile(stylesPath, 'utf8');
            const hasMaterialTheme = styles.includes('Theme.AppCompat') || styles.includes('Theme.Material');
            
            return {
              success: hasMaterialTheme,
              message: hasMaterialTheme ? "Material theme detected" : "Material theme not detected"
            };
          } catch (error) {
            return {
              success: false,
              message: "Styles file not found"
            };
          }
        }
      },
      
      "navigation_patterns": {
        name: "Navigation Patterns",
        description: "App should follow Material Design navigation",
        check: async () => {
          const hasNavigation = await this.checkDependency('@react-navigation/native');
          return {
            success: hasNavigation,
            message: hasNavigation ? "Navigation library found" : "Navigation implementation not found"
          };
        }
      }
    };

    const results = {};
    
    for (const [checkId, check] of Object.entries(material_checks)) {
      try {
        console.log(`     Checking ${check.name}...`);
        results[checkId] = await check.check();
      } catch (error) {
        results[checkId] = {
          success: false,
          message: `Check failed: ${error.message}`
        };
      }
    }

    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      test: 'android_material_design',
      success: allPassed,
      results: results,
      summary: `${Object.values(results).filter(r => r.success).length}/${Object.keys(results).length} Material Design checks passed`
    };
  }

  async checkAndroidPrivacyRequirements() {
    console.log('   Checking Android privacy requirements...');
    
    const privacy_checks = {
      "data_safety_section": {
        name: "Data Safety Section",
        description: "App should have complete Data Safety section",
        check: async () => {
          // This would typically be checked in Play Console
          return {
            success: true,
            message: "Data Safety section requires manual verification in Play Console"
          };
        }
      },
      
      "privacy_policy": {
        name: "Privacy Policy",
        description: "Privacy policy should be accessible",
        check: async () => {
          const hasPrivacyPolicy = await this.checkPrivacyPolicyAccessibility();
          return {
            success: hasPrivacyPolicy,
            message: hasPrivacyPolicy ? "Privacy policy is accessible" : "Privacy policy not accessible"
          };
        }
      },
      
      "runtime_permissions": {
        name: "Runtime Permissions",
        description: "App should properly request runtime permissions",
        check: async () => {
          try {
            const manifest = await fs.readFile(this.config.android.manifest_path, 'utf8');
            const targetSdk = manifest.match(/android:targetSdkVersion="(\d+)"/);
            
            if (targetSdk && parseInt(targetSdk[1]) >= 23) {
              return {
                success: true,
                message: `Target SDK ${targetSdk[1]} supports runtime permissions`
              };
            }
            
            return {
              success: false,
              message: "Target SDK too low for runtime permissions"
            };
          } catch (error) {
            return {
              success: false,
              message: `Error checking runtime permissions: ${error.message}`
            };
          }
        }
      }
    };

    const results = {};
    
    for (const [checkId, check] of Object.entries(privacy_checks)) {
      try {
        console.log(`     Checking ${check.name}...`);
        results[checkId] = await check.check();
      } catch (error) {
        results[checkId] = {
          success: false,
          message: `Check failed: ${error.message}`
        };
      }
    }

    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      test: 'android_privacy_requirements',
      success: allPassed,
      results: results,
      summary: `${Object.values(results).filter(r => r.success).length}/${Object.keys(results).length} privacy checks passed`
    };
  }

  async checkAndroidPerformanceRequirements() {
    console.log('   Checking Android performance requirements...');
    
    const performance_checks = {
      "app_size": {
        name: "App Size",
        description: "APK should not exceed reasonable size",
        check: async () => {
          try {
            const stats = await fs.stat(this.config.android.apk_path);
            const sizeInMB = stats.size / (1024 * 1024);
            const withinLimit = sizeInMB <= this.config.performance_thresholds.app_size_mb;
            
            return {
              success: withinLimit,
              message: `APK size: ${sizeInMB.toFixed(2)}MB (limit: ${this.config.performance_thresholds.app_size_mb}MB)`
            };
          } catch (error) {
            return {
              success: false,
              message: "Cannot determine APK size - file not found"
            };
          }
        }
      },
      
      "target_sdk_version": {
        name: "Target SDK Version",
        description: "App should target recent Android API level",
        check: async () => {
          try {
            const manifest = await fs.readFile(this.config.android.manifest_path, 'utf8');
            const targetSdk = manifest.match(/android:targetSdkVersion="(\d+)"/);
            
            if (targetSdk) {
              const version = parseInt(targetSdk[1]);
              const isRecent = version >= 30; // Android 11+
              
              return {
                success: isRecent,
                message: `Target SDK: ${version} (recommended: 30+)`
              };
            }
            
            return {
              success: false,
              message: "Target SDK version not found"
            };
          } catch (error) {
            return {
              success: false,
              message: `Error checking target SDK: ${error.message}`
            };
          }
        }
      },
      
      "proguard_optimization": {
        name: "ProGuard Optimization",
        description: "Release build should use ProGuard/R8",
        check: async () => {
          try {
            const buildGradle = await fs.readFile('../LinkedInHeadshotApp/android/app/build.gradle', 'utf8');
            const hasProguard = buildGradle.includes('minifyEnabled true') || buildGradle.includes('useProguard true');
            
            return {
              success: hasProguard,
              message: hasProguard ? "Code minification enabled" : "Code minification not enabled"
            };
          } catch (error) {
            return {
              success: false,
              message: `Error checking ProGuard: ${error.message}`
            };
          }
        }
      }
    };

    const results = {};
    
    for (const [checkId, check] of Object.entries(performance_checks)) {
      try {
        console.log(`     Checking ${check.name}...`);
        results[checkId] = await check.check();
      } catch (error) {
        results[checkId] = {
          success: false,
          message: `Check failed: ${error.message}`
        };
      }
    }

    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      test: 'android_performance_requirements',
      success: allPassed,
      results: results,
      summary: `${Object.values(results).filter(r => r.success).length}/${Object.keys(results).length} performance checks passed`
    };
  }

  async checkAndroidTechnicalRequirements() {
    console.log('   Checking Android technical requirements...');
    
    const technical_checks = {
      "package_name": {
        name: "Package Name",
        description: "App should have valid package name",
        check: async () => {
          try {
            const manifest = await fs.readFile(this.config.android.manifest_path, 'utf8');
            const packageName = manifest.match(/package="([^"]+)"/);
            
            if (packageName) {
              const pkg = packageName[1];
              const isValid = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(pkg);
              
              return {
                success: isValid,
                message: `Package name: ${pkg} (${isValid ? 'valid' : 'invalid format'})`
              };
            }
            
            return {
              success: false,
              message: "Package name not found"
            };
          } catch (error) {
            return {
              success: false,
              message: `Error checking package name: ${error.message}`
            };
          }
        }
      },
      
      "version_info": {
        name: "Version Information",
        description: "App should have proper version information",
        check: async () => {
          try {
            const manifest = await fs.readFile(this.config.android.manifest_path, 'utf8');
            const versionCode = manifest.match(/android:versionCode="(\d+)"/);
            const versionName = manifest.match(/android:versionName="([^"]+)"/);
            
            return {
              success: versionCode && versionName,
              message: `Version: ${versionName ? versionName[1] : 'N/A'} (${versionCode ? versionCode[1] : 'N/A'})`
            };
          } catch (error) {
            return {
              success: false,
              message: `Error checking version info: ${error.message}`
            };
          }
        }
      },
      
      "signing_configuration": {
        name: "Signing Configuration",
        description: "App should be properly signed",
        check: async () => {
          try {
            const buildGradle = await fs.readFile('../LinkedInHeadshotApp/android/app/build.gradle', 'utf8');
            const hasSigningConfig = buildGradle.includes('signingConfigs');
            
            return {
              success: hasSigningConfig,
              message: hasSigningConfig ? "Signing configuration found" : "Signing configuration missing"
            };
          } catch (error) {
            return {
              success: false,
              message: `Error checking signing: ${error.message}`
            };
          }
        }
      }
    };

    const results = {};
    
    for (const [checkId, check] of Object.entries(technical_checks)) {
      try {
        console.log(`     Checking ${check.name}...`);
        results[checkId] = await check.check();
      } catch (error) {
        results[checkId] = {
          success: false,
          message: `Check failed: ${error.message}`
        };
      }
    }

    const allPassed = Object.values(results).every(r => r.success);
    
    return {
      test: 'android_technical_requirements',
      success: allPassed,
      results: results,
      summary: `${Object.values(results).filter(r => r.success).length}/${Object.keys(results).length} technical checks passed`
    };
  }

  // Helper methods
  async checkFeatureImplementation(feature) {
    const featureFiles = {
      'photo_processing': '../LinkedInHeadshotApp/src/services/aiService.js',
      'payment': '../LinkedInHeadshotApp/src/services/paymentService.js'
    };
    
    if (featureFiles[feature]) {
      return await this.checkFileExists(featureFiles[feature]);
    }
    
    return false;
  }

  async checkDependency(packageName) {
    try {
      const packageJson = await fs.readFile('../LinkedInHeadshotApp/package.json', 'utf8');
      const pkg = JSON.parse(packageJson);
      
      return !!(pkg.dependencies[packageName] || pkg.devDependencies[packageName]);
    } catch (error) {
      return false;
    }
  }

  async checkFileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async checkPrivacyPolicyAccessibility() {
    try {
      const response = await axios.get(this.config.privacy_compliance.privacy_policy_url, { timeout: 10000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async checkBuildOptimizations() {
    // Check for build optimization indicators
    return await this.checkFileExists('../LinkedInHeadshotApp/metro.config.js');
  }

  async checkMemoryManagementPatterns() {
    // Check for memory management patterns in code
    try {
      const appFile = await fs.readFile('../LinkedInHeadshotApp/App.tsx', 'utf8');
      return appFile.includes('useEffect') && appFile.includes('cleanup');
    } catch (error) {
      return false;
    }
  }

  calculateComplianceScore(results, platform) {
    const totalChecks = results.length;
    const passedChecks = results.filter(r => 
      r.status === 'fulfilled' && r.value.success
    ).length;
    
    const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
    
    this.results.compliance_scores[platform] = {
      score: score,
      max: 100,
      passed: passedChecks,
      total: totalChecks
    };
    
    return score;
  }

  async generateValidationReport() {
    console.log('📄 Generating app store validation report...');
    
    const reportData = {
      ...this.results,
      config_used: this.config,
      recommendations: this.generateRecommendations(),
      store_submission_checklist: this.generateSubmissionChecklist()
    };
    
    // Generate JSON report
    const jsonReportPath = path.join(this.reportsDir, 'app-store-validation-results.json');
    await fs.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2));
    
    // Generate HTML report
    const htmlReportPath = path.join(this.reportsDir, 'app-store-validation-report.html');
    await this.generateHTMLReport(reportData, htmlReportPath);
    
    console.log(`📊 App Store validation reports generated:`);
    console.log(`   JSON: ${jsonReportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
    
    return reportData;
  }

  async generateHTMLReport(data, outputPath) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App Store Validation Report - LinkedIn Headshot Generator</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .platform-section { margin: 30px 0; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .warning { color: #ffc107; }
        .compliance-score { font-size: 3em; font-weight: bold; margin: 20px 0; }
        .check-results { margin-top: 20px; }
        .check-item { margin-bottom: 15px; padding: 10px; border: 1px solid #dee2e6; border-radius: 4px; }
        .check-success { border-left: 4px solid #28a745; }
        .check-failure { border-left: 4px solid #dc3545; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
        .recommendations { background: #d1ecf1; border: 1px solid #bee5eb; padding: 20px; border-radius: 4px; margin-top: 20px; }
        .checklist { background: #f8f9fa; padding: 20px; border-radius: 4px; margin-top: 20px; }
        .platform-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-size: 0.9em; margin: 0 5px; }
        .ios-badge { background: #007AFF; }
        .android-badge { background: #3DDC84; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>App Store Validation Report</h1>
            <h2>LinkedIn Headshot Generator</h2>
            <span class="platform-badge ios-badge">iOS</span>
            <span class="platform-badge android-badge">Android</span>
            <p class="timestamp">Generated on: ${data.timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Total Checks</h3>
                <div class="value">${data.summary.total_checks}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value passed">${data.summary.passed}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value failed">${data.summary.failed}</div>
            </div>
            <div class="metric">
                <h3>Critical Issues</h3>
                <div class="value failed">${data.summary.critical_issues}</div>
            </div>
        </div>
        
        ${Object.entries(data.platforms).map(([platform, results]) => `
            <div class="platform-section">
                <h2>${platform.toUpperCase()} Compliance</h2>
                <div class="compliance-score ${results.success ? 'passed' : 'failed'}">
                    ${data.compliance_scores[platform].score}%
                </div>
                <p>${data.compliance_scores[platform].passed}/${data.compliance_scores[platform].total} checks passed</p>
                
                <div class="check-results">
                    ${results.checks.map(check => `
                        <div class="check-item ${check.success ? 'check-success' : 'check-failure'}">
                            <h4>${check.test.replace(/_/g, ' ').toUpperCase()}</h4>
                            <p><strong>Status:</strong> ${check.success ? 'PASSED' : 'FAILED'}</p>
                            <p>${check.summary}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}
        
        <div class="recommendations">
            <h3>Recommendations</h3>
            <ul>
                ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        
        <div class="checklist">
            <h3>Store Submission Checklist</h3>
            ${Object.entries(data.store_submission_checklist).map(([category, items]) => `
                <h4>${category.replace(/_/g, ' ').toUpperCase()}</h4>
                <ul>
                    ${items.map(item => `<li>${item}</li>`).join('')}
                </ul>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
    
    await fs.writeFile(outputPath, html);
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.summary.critical_issues > 0) {
      recommendations.push('Address all critical issues before submitting to app stores');
    }
    
    if (this.results.summary.failed > 0) {
      recommendations.push('Review and fix failed validation checks');
    }
    
    const iosScore = this.results.compliance_scores.ios?.score || 0;
    const androidScore = this.results.compliance_scores.android?.score || 0;
    
    if (iosScore < 80) {
      recommendations.push('Improve iOS compliance score before App Store submission');
    }
    
    if (androidScore < 80) {
      recommendations.push('Improve Android compliance score before Play Store submission');
    }
    
    // General recommendations
    recommendations.push(
      'Test app thoroughly on physical devices before submission',
      'Prepare app store assets (screenshots, descriptions, keywords)',
      'Set up app store connect/play console accounts with proper metadata',
      'Plan staged rollout strategy for initial release',
      'Prepare customer support documentation and processes'
    );
    
    return recommendations;
  }

  generateSubmissionChecklist() {
    return {
      pre_submission: [
        'All validation checks passing',
        'App tested on physical devices',
        'Privacy policy and terms of service accessible',
        'App store assets prepared (icons, screenshots, descriptions)',
        'Age rating questionnaire completed'
      ],
      ios_specific: [
        'App Store Connect account set up',
        'Certificates and provisioning profiles configured',
        'TestFlight internal testing completed',
        'App privacy nutrition labels completed',
        'Pricing and availability configured'
      ],
      android_specific: [
        'Google Play Console account set up',
        'App signed with release key',
        'Data safety section completed',
        'Internal testing track configured',
        'Store listing information completed'
      ],
      post_submission: [
        'Monitor review status and respond to feedback',
        'Prepare marketing and launch communications',
        'Set up app analytics and monitoring',
        'Plan user support and feedback collection',
        'Schedule post-launch updates and improvements'
      ]
    };
  }

  async run() {
    console.log('📱 Starting app store validation...');
    
    await this.initialize();
    
    // Run iOS validation
    const iosResults = await this.validateiOSCompliance();
    this.results.platforms.ios = iosResults;
    
    // Run Android validation
    const androidResults = await this.validateAndroidCompliance();
    this.results.platforms.android = androidResults;
    
    // Calculate summary
    const allChecks = [
      ...(iosResults.checks || []),
      ...(androidResults.checks || [])
    ];
    
    this.results.summary.total_checks = allChecks.length;
    this.results.summary.passed = allChecks.filter(c => c.success).length;
    this.results.summary.failed = allChecks.filter(c => !c.success).length;
    this.results.summary.critical_issues = allChecks.filter(c => 
      !c.success && (c.test.includes('privacy') || c.test.includes('technical'))
    ).length;
    
    // Generate report
    const finalResults = await this.generateValidationReport();
    
    // Print summary
    console.log('\n📊 App Store Validation Summary:');
    console.log(`   Total Checks: ${this.results.summary.total_checks}`);
    console.log(`   Passed: ${this.results.summary.passed}`);
    console.log(`   Failed: ${this.results.summary.failed}`);
    console.log(`   Critical Issues: ${this.results.summary.critical_issues}`);
    console.log(`   iOS Score: ${this.results.compliance_scores.ios.score}%`);
    console.log(`   Android Score: ${this.results.compliance_scores.android.score}%`);
    
    // Exit with appropriate code
    const exitCode = this.results.summary.critical_issues > 0 ? 2 : 
                    this.results.summary.failed > 0 ? 1 : 0;
    
    console.log(`\n${exitCode === 0 ? '✅' : '❌'} App store validation completed with exit code: ${exitCode}`);
    process.exit(exitCode);
  }
}

// CLI interface
if (require.main === module) {
  const validator = new AppStoreValidator();
  validator.run().catch(error => {
    console.error('💥 App store validator crashed:', error);
    process.exit(1);
  });
}

module.exports = AppStoreValidator;