#!/usr/bin/env node
/**
 * Android Permissions Validation Script
 * Validates your Android configuration for media permissions
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Android Media Permissions Configuration...\n');

// Check app.json configuration
function validateAppJson() {
  console.log('📱 Checking app.json configuration...');
  
  try {
    const appJsonPath = path.join(__dirname, '../app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    const requiredPermissions = [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_IMAGES'
    ];
    
    const androidConfig = appJson.expo?.android;
    if (!androidConfig) {
      console.log('❌ No android configuration found in app.json');
      return false;
    }
    
    const permissions = androidConfig.permissions || [];
    const missingPermissions = requiredPermissions.filter(perm => !permissions.includes(perm));
    
    if (missingPermissions.length === 0) {
      console.log('✅ All required permissions present in app.json');
      console.log(`   Found ${permissions.length} permissions configured`);
    } else {
      console.log('⚠️ Missing permissions in app.json:');
      missingPermissions.forEach(perm => console.log(`   - ${perm}`));
    }
    
    // Check SDK versions
    if (androidConfig.compileSdkVersion && androidConfig.targetSdkVersion) {
      console.log(`✅ SDK versions configured: compile=${androidConfig.compileSdkVersion}, target=${androidConfig.targetSdkVersion}`);
    } else {
      console.log('⚠️ SDK versions not explicitly set (will use defaults)');
    }
    
    return missingPermissions.length === 0;
  } catch (error) {
    console.log('❌ Error reading app.json:', error.message);
    return false;
  }
}

// Check Android manifest
function validateAndroidManifest() {
  console.log('\n📄 Checking Android manifest...');
  
  try {
    const manifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');
    
    if (!fs.existsSync(manifestPath)) {
      console.log('⚠️ Android manifest not found (normal for Expo managed workflow)');
      return true; // This is OK for managed workflow
    }
    
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    
    const requiredPermissions = [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_IMAGES'
    ];
    
    const foundPermissions = requiredPermissions.filter(perm => 
      manifestContent.includes(perm)
    );
    
    console.log(`✅ Found ${foundPermissions.length}/${requiredPermissions.length} required permissions in manifest`);
    
    // Check for granular permissions
    if (manifestContent.includes('READ_MEDIA_IMAGES')) {
      console.log('✅ Android 13+ granular permissions configured');
    } else {
      console.log('⚠️ Android 13+ granular permissions not found');
    }
    
    // Check for maxSdkVersion attributes
    if (manifestContent.includes('maxSdkVersion="32"') || manifestContent.includes('maxSdkVersion="28"')) {
      console.log('✅ Legacy permission restrictions configured');
    } else {
      console.log('⚠️ Legacy permission restrictions not configured');
    }
    
    return foundPermissions.length === requiredPermissions.length;
  } catch (error) {
    console.log('❌ Error reading Android manifest:', error.message);
    return false;
  }
}

// Check package.json dependencies
function validateDependencies() {
  console.log('\n📦 Checking package.json dependencies...');
  
  try {
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredDeps = {
      'expo-image-picker': '~16.1.4',
      'expo-media-library': '~17.1.7',
      'expo-file-system': '~18.1.11'
    };
    
    const dependencies = packageJson.dependencies || {};
    
    let allGood = true;
    Object.entries(requiredDeps).forEach(([dep, expectedVersion]) => {
      const installedVersion = dependencies[dep];
      if (installedVersion) {
        console.log(`✅ ${dep}: ${installedVersion}`);
        
        // Check if version supports Android 13+
        if (dep === 'expo-media-library' && installedVersion.includes('17.')) {
          console.log('   ✅ Version supports Android 13+ permissions');
        }
      } else {
        console.log(`❌ Missing dependency: ${dep}`);
        allGood = false;
      }
    });
    
    return allGood;
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    return false;
  }
}

// Check permission service
function validatePermissionService() {
  console.log('\n🔧 Checking permission service...');
  
  try {
    const servicePath = path.join(__dirname, '../src/services/mediaPermissionService.js');
    
    if (fs.existsSync(servicePath)) {
      console.log('✅ Media permission service found');
      
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      // Check for key features
      const features = [
        { name: 'Android API detection', pattern: 'Platform.Version' },
        { name: 'Expo Go detection', pattern: 'Constants.appOwnership' },
        { name: 'Granular permissions support', pattern: 'supportsGranularPermissions' },
        { name: 'Permission strategy', pattern: 'getPermissionStrategy' }
      ];
      
      features.forEach(feature => {
        if (serviceContent.includes(feature.pattern)) {
          console.log(`   ✅ ${feature.name} implemented`);
        } else {
          console.log(`   ⚠️ ${feature.name} missing`);
        }
      });
      
      return true;
    } else {
      console.log('❌ Media permission service not found');
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking permission service:', error.message);
    return false;
  }
}

// Check EAS configuration
function validateEasConfig() {
  console.log('\n🏗️ Checking EAS configuration...');
  
  try {
    const easJsonPath = path.join(__dirname, '../eas.json');
    
    if (fs.existsSync(easJsonPath)) {
      const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
      
      if (easJson.build?.development) {
        console.log('✅ Development build profile configured');
        
        if (easJson.build.development.developmentClient) {
          console.log('   ✅ Development client enabled');
        }
        
        if (easJson.build.development.android) {
          console.log('   ✅ Android development configuration found');
        }
      } else {
        console.log('⚠️ Development build profile not configured');
      }
      
      return true;
    } else {
      console.log('⚠️ EAS configuration not found');
      return false;
    }
  } catch (error) {
    console.log('❌ Error reading eas.json:', error.message);
    return false;
  }
}

// Run all validations
async function runValidation() {
  const results = {
    appJson: validateAppJson(),
    manifest: validateAndroidManifest(),
    dependencies: validateDependencies(),
    permissionService: validatePermissionService(),
    easConfig: validateEasConfig()
  };
  
  console.log('\n📊 Validation Summary:');
  console.log('========================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([check, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${check}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  
  console.log(`\n🎯 Overall: ${passed}/${total} checks passed`);
  
  if (passed === total) {
    console.log('\n🎉 All validations passed! Your Android media permissions are properly configured.');
    console.log('\n📱 Next steps:');
    console.log('1. Test in Expo Go (limited functionality on Android 13+)');
    console.log('2. Create development build: npm run dev-build:android');
    console.log('3. Install APK on device for full testing');
  } else {
    console.log('\n⚠️ Some validations failed. Please review the issues above.');
  }
  
  console.log('\n📚 For detailed guidance, see: ANDROID_MEDIA_PERMISSIONS_GUIDE.md');
}

// Run the validation
runValidation().catch(console.error);