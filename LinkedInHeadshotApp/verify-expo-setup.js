#!/usr/bin/env node

/**
 * Verify Expo Setup Script
 * This script verifies that the LinkedIn Headshot app is properly configured for Expo
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Expo configuration for LinkedIn Headshot App...\n');

let allChecksPass = true;

// Check if required files exist
const requiredFiles = [
  'app.config.js',
  'App.js',
  'package.json',
  'babel.config.js',
  'metro.config.js'
];

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allChecksPass = false;
});

// Check if old React Native files are removed
const oldFiles = [
  'index.js'
];

console.log('\n🗑️  Checking old React Native files are removed...');
oldFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${!exists ? '✅' : '❌'} ${file} ${!exists ? 'removed' : 'still exists'}`);
  if (exists) allChecksPass = false;
});

// Check package.json dependencies
console.log('\n📦 Checking package.json dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDeps = [
    'expo',
    'expo-image-picker',
    'expo-image-manipulator',
    'expo-file-system',
    'react-native-gesture-handler',
    'react-native-screens',
    'react-native-safe-area-context'
  ];
  
  requiredDeps.forEach(dep => {
    const exists = packageJson.dependencies && packageJson.dependencies[dep];
    console.log(`  ${exists ? '✅' : '❌'} ${dep}`);
    if (!exists) allChecksPass = false;
  });
  
  // Check for problematic dependencies
  const problematicDeps = [
    'react-native-image-picker',
    '@bam.tech/react-native-image-resizer',
    'react-native-fs',
    'react-native-config'
  ];
  
  console.log('\n🚫 Checking for problematic dependencies...');
  problematicDeps.forEach(dep => {
    const exists = packageJson.dependencies && packageJson.dependencies[dep];
    console.log(`  ${!exists ? '✅' : '❌'} ${dep} ${!exists ? 'not present' : 'should be removed'}`);
    if (exists) allChecksPass = false;
  });
  
} catch (error) {
  console.log('  ❌ Could not read package.json');
  allChecksPass = false;
}

// Check app.config.js
console.log('\n⚙️  Checking app.config.js...');
try {
  const appConfig = fs.readFileSync('app.config.js', 'utf8');
  
  const requiredConfigs = [
    'jsEngine: "jsc"',
    'expo-image-picker',
    'expo-image-manipulator'
  ];
  
  requiredConfigs.forEach(config => {
    const exists = appConfig.includes(config);
    console.log(`  ${exists ? '✅' : '❌'} Contains: ${config}`);
    if (!exists) allChecksPass = false;
  });
  
} catch (error) {
  console.log('  ❌ Could not read app.config.js');
  allChecksPass = false;
}

console.log('\n' + '='.repeat(50));
if (allChecksPass) {
  console.log('🎉 All checks passed! App should work on iPhone via Expo Go.');
  console.log('\n📱 To test on iPhone:');
  console.log('1. Run: npx expo start');
  console.log('2. Scan QR code with iPhone Camera app');
  console.log('3. Open in Expo Go app');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  process.exit(1);
}