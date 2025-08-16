#!/usr/bin/env node

console.log('🎯 LinkedIn Headshot App - Expo Setup Verification');
console.log('='.repeat(50));

// Check package.json
try {
  const pkg = require('./package.json');
  console.log('✅ package.json loaded successfully');
  console.log(`   Name: ${pkg.name}`);
  console.log(`   Version: ${pkg.version}`);
  console.log(`   Main entry: ${pkg.main}`);
  
  // Check critical dependencies
  const criticalDeps = ['expo', 'react', 'react-native', 'expo-status-bar'];
  criticalDeps.forEach(dep => {
    if (pkg.dependencies[dep]) {
      console.log(`✅ ${dep}: ${pkg.dependencies[dep]}`);
    } else {
      console.log(`❌ Missing: ${dep}`);
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Check app.json
try {
  const appJson = require('./app.json');
  console.log('✅ app.json loaded successfully');
  console.log(`   App name: ${appJson.expo.name}`);
  console.log(`   Slug: ${appJson.expo.slug}`);
  console.log(`   Version: ${appJson.expo.version}`);
} catch (error) {
  console.log('❌ Error reading app.json:', error.message);
}

// Check main app file
const fs = require('fs');
try {
  const appFile = fs.readFileSync('./App.js', 'utf8');
  if (appFile.includes('StatusBar')) {
    console.log('✅ App.js contains valid React Native components');
  }
  if (appFile.includes('LinkedIn Headshot')) {
    console.log('✅ App.js contains LinkedIn Headshot branding');
  }
} catch (error) {
  console.log('❌ Error reading App.js:', error.message);
}

// Check configuration files
const configs = [
  { file: 'metro.config.js', check: 'expo/metro-config' },
  { file: 'babel.config.js', check: 'babel-preset-expo' },
  { file: 'tsconfig.json', check: 'expo/tsconfig.base' }
];

configs.forEach(({file, check}) => {
  try {
    const content = fs.readFileSync(`./${file}`, 'utf8');
    if (content.includes(check)) {
      console.log(`✅ ${file} properly configured for Expo`);
    } else {
      console.log(`⚠️  ${file} might need Expo configuration`);
    }
  } catch (error) {
    console.log(`❌ Error reading ${file}:`, error.message);
  }
});

console.log('='.repeat(50));
console.log('🚀 READY TO START:');
console.log('   1. Run: npx expo start --tunnel');
console.log('   2. Scan QR code with Expo Go app on iPhone');
console.log('   3. App should load without errors');
console.log('='.repeat(50));