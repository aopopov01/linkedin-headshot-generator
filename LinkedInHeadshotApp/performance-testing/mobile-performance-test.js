/**
 * OmniShot Mobile App Performance Testing
 * React Native/Expo app performance analysis
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class MobilePerformanceTest {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      appStructure: {},
      bundleAnalysis: {},
      startupPerformance: {},
      componentPerformance: {},
      networkPerformance: {},
      recommendations: []
    };
    this.projectRoot = path.resolve(__dirname, '..');
  }

  async runMobilePerformanceAnalysis() {
    console.log('📱 Starting Mobile App Performance Analysis...\n');
    
    try {
      // 1. Analyze app structure and dependencies
      await this.analyzeAppStructure();
      
      // 2. Bundle size analysis
      await this.analyzeBundleSize();
      
      // 3. Component performance analysis
      await this.analyzeComponentPerformance();
      
      // 4. Network request optimization analysis
      await this.analyzeNetworkPerformance();
      
      // 5. Startup performance analysis
      await this.analyzeStartupPerformance();
      
      // 6. Generate mobile-specific recommendations
      this.generateMobileRecommendations();
      
      // 7. Save results
      await this.saveResults();
      
      // 8. Display summary
      this.displaySummary();
      
    } catch (error) {
      console.error('❌ Mobile performance testing failed:', error);
      this.results.error = error.message;
    }
  }

  async analyzeAppStructure() {
    console.log('🏗️ Analyzing App Structure...');
    
    try {
      // Read package.json to understand dependencies
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Count components and screens
      const srcPath = path.join(this.projectRoot, 'src');
      const componentsPath = path.join(srcPath, 'components');
      const screensPath = path.join(srcPath, 'screens');
      const servicesPath = path.join(srcPath, 'services');
      
      const componentCount = await this.countFilesInDirectory(componentsPath, '.jsx', '.tsx', '.js', '.ts');
      const screenCount = await this.countFilesInDirectory(screensPath, '.jsx', '.tsx', '.js', '.ts');
      const serviceCount = await this.countFilesInDirectory(servicesPath, '.js', '.ts');
      
      this.results.appStructure = {
        totalDependencies: Object.keys(packageJson.dependencies || {}).length,
        devDependencies: Object.keys(packageJson.devDependencies || {}).length,
        components: componentCount,
        screens: screenCount,
        services: serviceCount,
        mainDependencies: this.analyzeDependencies(packageJson.dependencies || {}),
        bundleRelevantDeps: this.identifyHeavyDependencies(packageJson.dependencies || {})
      };
      
      console.log(`  ✓ Dependencies: ${this.results.appStructure.totalDependencies} prod, ${this.results.appStructure.devDependencies} dev`);
      console.log(`  ✓ Components: ${componentCount}, Screens: ${screenCount}, Services: ${serviceCount}`);
      
    } catch (error) {
      console.log(`  ❌ Structure analysis failed: ${error.message}`);
    }
    
    console.log('✅ App Structure Analysis Complete\n');
  }

  async analyzeBundleSize() {
    console.log('📦 Analyzing Bundle Size...');
    
    try {
      // Check if Metro bundler config exists
      const metroConfigPath = path.join(this.projectRoot, 'metro.config.js');
      let metroConfigExists = false;
      
      try {
        await fs.access(metroConfigPath);
        metroConfigExists = true;
      } catch {
        // Metro config doesn't exist
      }

      // Analyze potential bundle size issues
      const appJsPath = path.join(this.projectRoot, 'App.js');
      const appContent = await fs.readFile(appJsPath, 'utf8');
      
      // Count imports and potential bundle impacts
      const importMatches = appContent.match(/import\s+.*\s+from\s+['"][^'"]*['"]/g) || [];
      const externalImports = importMatches.filter(imp => 
        !imp.includes('./') && !imp.includes('../') && !imp.includes('src/')
      );
      
      this.results.bundleAnalysis = {
        metroConfigExists,
        appJsSize: appContent.length,
        totalImports: importMatches.length,
        externalImports: externalImports.length,
        potentiallyHeavyImports: this.identifyHeavyImports(importMatches),
        recommendedOptimizations: []
      };
      
      // Check for common heavy dependencies in imports
      const heavyDeps = ['react-native-svg', 'react-native-vector-icons', 'lottie-react-native'];
      const foundHeavyDeps = externalImports.filter(imp => 
        heavyDeps.some(dep => imp.includes(dep))
      );
      
      if (foundHeavyDeps.length > 0) {
        this.results.bundleAnalysis.recommendedOptimizations.push('Consider lazy loading for heavy UI dependencies');
      }
      
      console.log(`  ✓ App.js size: ${(appContent.length / 1024).toFixed(2)} KB`);
      console.log(`  ✓ Total imports: ${importMatches.length} (${externalImports.length} external)`);
      
    } catch (error) {
      console.log(`  ❌ Bundle analysis failed: ${error.message}`);
    }
    
    console.log('✅ Bundle Size Analysis Complete\n');
  }

  async analyzeComponentPerformance() {
    console.log('⚛️ Analyzing Component Performance...');
    
    try {
      const componentsPath = path.join(this.projectRoot, 'src', 'components');
      const componentFiles = await this.getFilesRecursively(componentsPath, ['.jsx', '.tsx', '.js']);
      
      const componentAnalysis = {
        totalComponents: componentFiles.length,
        largeComponents: [],
        memoizationOpportunities: [],
        expensiveOperations: [],
        stateManagementIssues: []
      };
      
      for (const file of componentFiles) {
        const content = await fs.readFile(file, 'utf8');
        const relativePath = path.relative(this.projectRoot, file);
        
        // Analyze component size
        if (content.length > 5000) {
          componentAnalysis.largeComponents.push({
            file: relativePath,
            size: content.length,
            lines: content.split('\n').length
          });
        }
        
        // Check for memoization opportunities
        if (content.includes('const ') && content.includes('props') && !content.includes('React.memo')) {
          componentAnalysis.memoizationOpportunities.push(relativePath);
        }
        
        // Check for expensive operations in render
        if (content.includes('.map(') || content.includes('.filter(') || content.includes('.reduce(')) {
          if (!content.includes('useMemo') && !content.includes('useCallback')) {
            componentAnalysis.expensiveOperations.push(relativePath);
          }
        }
        
        // Check for multiple useState calls (potential state consolidation)
        const useStateMatches = content.match(/useState\(/g) || [];
        if (useStateMatches.length > 5) {
          componentAnalysis.stateManagementIssues.push({
            file: relativePath,
            useStateCount: useStateMatches.length
          });
        }
      }
      
      this.results.componentPerformance = componentAnalysis;
      
      console.log(`  ✓ Analyzed ${componentFiles.length} components`);
      console.log(`  ✓ Large components: ${componentAnalysis.largeComponents.length}`);
      console.log(`  ✓ Memoization opportunities: ${componentAnalysis.memoizationOpportunities.length}`);
      console.log(`  ✓ Expensive operations: ${componentAnalysis.expensiveOperations.length}`);
      
    } catch (error) {
      console.log(`  ❌ Component analysis failed: ${error.message}`);
    }
    
    console.log('✅ Component Performance Analysis Complete\n');
  }

  async analyzeNetworkPerformance() {
    console.log('🌐 Analyzing Network Performance...');
    
    try {
      const servicesPath = path.join(this.projectRoot, 'src', 'services');
      const serviceFiles = await this.getFilesRecursively(servicesPath, ['.js', '.ts']);
      
      const networkAnalysis = {
        totalServiceFiles: serviceFiles.length,
        apiCalls: [],
        cachingImplemented: false,
        retryMechanisms: [],
        offlineSupport: false,
        requestOptimizations: []
      };
      
      for (const file of serviceFiles) {
        const content = await fs.readFile(file, 'utf8');
        const relativePath = path.relative(this.projectRoot, file);
        
        // Check for API calls
        const fetchMatches = content.match(/fetch\(/g) || [];
        const axiosMatches = content.match(/axios\./g) || [];
        const apiCallCount = fetchMatches.length + axiosMatches.length;
        
        if (apiCallCount > 0) {
          networkAnalysis.apiCalls.push({
            file: relativePath,
            fetchCalls: fetchMatches.length,
            axiosCalls: axiosMatches.length,
            total: apiCallCount
          });
        }
        
        // Check for caching implementation
        if (content.includes('AsyncStorage') || content.includes('cache') || content.includes('Cache')) {
          networkAnalysis.cachingImplemented = true;
        }
        
        // Check for retry mechanisms
        if (content.includes('retry') || content.includes('exponential') || content.includes('backoff')) {
          networkAnalysis.retryMechanisms.push(relativePath);
        }
        
        // Check for offline support
        if (content.includes('NetInfo') || content.includes('offline') || content.includes('connectivity')) {
          networkAnalysis.offlineSupport = true;
        }
      }
      
      // Generate network optimization recommendations
      if (!networkAnalysis.cachingImplemented) {
        networkAnalysis.requestOptimizations.push('Implement request/response caching');
      }
      
      if (networkAnalysis.retryMechanisms.length === 0) {
        networkAnalysis.requestOptimizations.push('Add retry mechanisms for failed requests');
      }
      
      if (!networkAnalysis.offlineSupport) {
        networkAnalysis.requestOptimizations.push('Implement offline support and queue');
      }
      
      this.results.networkPerformance = networkAnalysis;
      
      console.log(`  ✓ Service files: ${serviceFiles.length}`);
      console.log(`  ✓ API call locations: ${networkAnalysis.apiCalls.length}`);
      console.log(`  ✓ Caching implemented: ${networkAnalysis.cachingImplemented ? 'Yes' : 'No'}`);
      console.log(`  ✓ Offline support: ${networkAnalysis.offlineSupport ? 'Yes' : 'No'}`);
      
    } catch (error) {
      console.log(`  ❌ Network analysis failed: ${error.message}`);
    }
    
    console.log('✅ Network Performance Analysis Complete\n');
  }

  async analyzeStartupPerformance() {
    console.log('🚀 Analyzing Startup Performance...');
    
    try {
      // Read App.js to analyze startup sequence
      const appJsPath = path.join(this.projectRoot, 'App.js');
      const appContent = await fs.readFile(appJsPath, 'utf8');
      
      const startupAnalysis = {
        appJsComplexity: this.calculateComplexity(appContent),
        synchronousOperations: [],
        asyncInitialization: false,
        lazyLoadingImplemented: false,
        splashScreenOptimized: false,
        preloadingStrategies: []
      };
      
      // Check for synchronous operations that could block startup
      if (appContent.includes('require(') && !appContent.includes('lazy(')) {
        startupAnalysis.synchronousOperations.push('Synchronous requires detected');
      }
      
      // Check for async initialization
      if (appContent.includes('useEffect') || appContent.includes('componentDidMount')) {
        startupAnalysis.asyncInitialization = true;
      }
      
      // Check for lazy loading
      if (appContent.includes('React.lazy') || appContent.includes('lazy(')) {
        startupAnalysis.lazyLoadingImplemented = true;
      }
      
      // Check for splash screen configuration
      const appJsonPath = path.join(this.projectRoot, 'app.json');
      try {
        const appJson = JSON.parse(await fs.readFile(appJsonPath, 'utf8'));
        if (appJson.expo && appJson.expo.splash) {
          startupAnalysis.splashScreenOptimized = true;
        }
      } catch {
        // app.json not found or invalid
      }
      
      this.results.startupPerformance = startupAnalysis;
      
      console.log(`  ✓ App.js complexity score: ${startupAnalysis.appJsComplexity}`);
      console.log(`  ✓ Async initialization: ${startupAnalysis.asyncInitialization ? 'Yes' : 'No'}`);
      console.log(`  ✓ Lazy loading: ${startupAnalysis.lazyLoadingImplemented ? 'Yes' : 'No'}`);
      console.log(`  ✓ Splash screen configured: ${startupAnalysis.splashScreenOptimized ? 'Yes' : 'No'}`);
      
    } catch (error) {
      console.log(`  ❌ Startup analysis failed: ${error.message}`);
    }
    
    console.log('✅ Startup Performance Analysis Complete\n');
  }

  generateMobileRecommendations() {
    console.log('💡 Generating Mobile Performance Recommendations...');
    
    const recommendations = [];

    // Bundle size recommendations
    if (this.results.bundleAnalysis.externalImports > 20) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Bundle Optimization',
        issue: 'High number of external imports may increase bundle size',
        recommendation: 'Implement code splitting and lazy loading for non-critical components',
        implementation: [
          'Use React.lazy() for screen-level components',
          'Implement dynamic imports for large libraries',
          'Consider bundle analysis tools like @expo/webpack-config',
          'Remove unused dependencies'
        ]
      });
    }

    // Component performance recommendations
    if (this.results.componentPerformance.memoizationOpportunities.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Component Optimization',
        issue: `${this.results.componentPerformance.memoizationOpportunities.length} components could benefit from memoization`,
        recommendation: 'Implement React.memo for pure components to prevent unnecessary re-renders',
        implementation: [
          'Wrap functional components with React.memo',
          'Use useMemo for expensive calculations',
          'Use useCallback for event handlers passed to child components',
          'Implement shouldComponentUpdate for class components'
        ]
      });
    }

    if (this.results.componentPerformance.expensiveOperations.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Render Performance',
        issue: `${this.results.componentPerformance.expensiveOperations.length} components have expensive operations in render`,
        recommendation: 'Move expensive operations outside render cycle',
        implementation: [
          'Use useMemo for expensive array operations',
          'Move data processing to useEffect hooks',
          'Implement virtualization for long lists',
          'Consider moving heavy calculations to background threads'
        ]
      });
    }

    // Network performance recommendations
    if (!this.results.networkPerformance.cachingImplemented) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Network Optimization',
        issue: 'No caching implementation detected',
        recommendation: 'Implement comprehensive caching strategy',
        implementation: [
          'Add AsyncStorage for persistent caching',
          'Implement memory caching for frequently accessed data',
          'Use HTTP cache headers properly',
          'Consider implementing a custom cache manager'
        ]
      });
    }

    if (!this.results.networkPerformance.offlineSupport) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Offline Experience',
        issue: 'No offline support detected',
        recommendation: 'Implement offline functionality for better user experience',
        implementation: [
          'Use @react-native-community/netinfo for connectivity detection',
          'Implement offline queue for network requests',
          'Cache critical data locally',
          'Show appropriate offline indicators'
        ]
      });
    }

    // Startup performance recommendations
    if (!this.results.startupPerformance.lazyLoadingImplemented) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Startup Optimization',
        issue: 'No lazy loading detected for initial app load',
        recommendation: 'Implement lazy loading to improve startup time',
        implementation: [
          'Use React.lazy for non-critical screens',
          'Defer loading of heavy dependencies',
          'Implement progressive app loading',
          'Optimize splash screen duration'
        ]
      });
    }

    // App structure recommendations
    if (this.results.appStructure.components > 50) {
      recommendations.push({
        priority: 'LOW',
        category: 'Code Organization',
        issue: 'Large number of components may affect maintainability',
        recommendation: 'Consider component organization and reusability patterns',
        implementation: [
          'Group related components into feature folders',
          'Create reusable component library',
          'Implement design system for consistency',
          'Consider component composition patterns'
        ]
      });
    }

    // Image optimization recommendations
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Image Optimization',
      issue: 'Image processing app needs optimized image handling',
      recommendation: 'Implement advanced image optimization for mobile',
      implementation: [
        'Use react-native-fast-image for better image caching',
        'Implement progressive image loading',
        'Optimize image formats (WebP support)',
        'Add image compression before upload',
        'Implement lazy loading for image galleries'
      ]
    });

    // Memory management recommendations
    recommendations.push({
      priority: 'HIGH',
      category: 'Memory Management',
      issue: 'Image processing apps are memory intensive',
      recommendation: 'Implement comprehensive memory management',
      implementation: [
        'Add memory usage monitoring',
        'Implement proper cleanup in useEffect hooks',
        'Use weak references for large objects',
        'Implement image recycling for galleries',
        'Add memory warnings and cleanup triggers'
      ]
    });

    this.results.recommendations = recommendations;
    
    console.log(`  Generated ${recommendations.length} mobile-specific recommendations`);
    console.log('✅ Mobile Recommendations Generated\n');
  }

  // Helper methods
  async countFilesInDirectory(dirPath, ...extensions) {
    try {
      const files = await this.getFilesRecursively(dirPath, extensions);
      return files.length;
    } catch {
      return 0;
    }
  }

  async getFilesRecursively(dirPath, extensions) {
    const files = [];
    
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          const subFiles = await this.getFilesRecursively(fullPath, extensions);
          files.push(...subFiles);
        } else if (extensions.some(ext => item.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
    
    return files;
  }

  analyzeDependencies(deps) {
    const categories = {
      ui: ['react-native', '@expo', 'react-navigation', 'react-native-vector-icons'],
      networking: ['axios', 'fetch'],
      state: ['redux', 'mobx', 'zustand'],
      async: ['react-query', 'swr'],
      image: ['react-native-image', 'react-native-svg', 'lottie'],
      dev: ['jest', 'detox', 'flipper']
    };
    
    const analysis = {};
    
    Object.keys(categories).forEach(category => {
      analysis[category] = Object.keys(deps).filter(dep =>
        categories[category].some(keyword => dep.includes(keyword))
      );
    });
    
    return analysis;
  }

  identifyHeavyDependencies(deps) {
    const heavyDeps = [
      'react-native-svg',
      'lottie-react-native', 
      'react-native-vector-icons',
      'react-native-image-picker',
      'react-native-camera'
    ];
    
    return Object.keys(deps).filter(dep =>
      heavyDeps.some(heavy => dep.includes(heavy))
    );
  }

  identifyHeavyImports(imports) {
    const heavyPatterns = [
      'react-native-svg',
      'react-native-vector-icons',
      'lottie-react-native',
      'react-native-camera'
    ];
    
    return imports.filter(imp =>
      heavyPatterns.some(pattern => imp.includes(pattern))
    );
  }

  calculateComplexity(content) {
    // Simple complexity calculation based on various factors
    const lines = content.split('\n').length;
    const functions = (content.match(/function\s+\w+|const\s+\w+\s*=/g) || []).length;
    const conditionals = (content.match(/if\s*\(|switch\s*\(|\?\s*:/g) || []).length;
    const loops = (content.match(/for\s*\(|while\s*\(|\.map\(|\.forEach\(/g) || []).length;
    
    return Math.round((lines * 0.1) + (functions * 2) + (conditionals * 1.5) + (loops * 1.2));
  }

  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mobile-performance-results-${timestamp}.json`;
    const filepath = path.join(path.dirname(__filename), filename);
    
    await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
    console.log(`📁 Mobile results saved to: ${filepath}`);
  }

  displaySummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📱 OMNISHOT MOBILE PERFORMANCE SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`📦 Bundle Analysis:`);
    console.log(`  - External imports: ${this.results.bundleAnalysis.externalImports || 0}`);
    console.log(`  - App.js size: ${((this.results.bundleAnalysis.appJsSize || 0) / 1024).toFixed(2)} KB`);
    
    console.log(`⚛️ Component Performance:`);
    console.log(`  - Total components: ${this.results.componentPerformance.totalComponents || 0}`);
    console.log(`  - Memoization opportunities: ${this.results.componentPerformance.memoizationOpportunities?.length || 0}`);
    console.log(`  - Expensive operations: ${this.results.componentPerformance.expensiveOperations?.length || 0}`);
    
    console.log(`🌐 Network Performance:`);
    console.log(`  - Caching implemented: ${this.results.networkPerformance.cachingImplemented ? 'Yes' : 'No'}`);
    console.log(`  - Offline support: ${this.results.networkPerformance.offlineSupport ? 'Yes' : 'No'}`);
    
    console.log(`🚀 Startup Performance:`);
    console.log(`  - Lazy loading: ${this.results.startupPerformance.lazyLoadingImplemented ? 'Yes' : 'No'}`);
    console.log(`  - Complexity score: ${this.results.startupPerformance.appJsComplexity || 0}`);
    
    console.log(`💡 Recommendations: ${this.results.recommendations.length}`);
    
    const highPriorityRecs = this.results.recommendations.filter(r => r.priority === 'HIGH');
    if (highPriorityRecs.length > 0) {
      console.log('\n🚨 HIGH PRIORITY IMPROVEMENTS:');
      highPriorityRecs.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.category}: ${rec.recommendation}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📱 Mobile performance analysis complete!');
    console.log('='.repeat(80) + '\n');
  }
}

// Export for use as module
module.exports = MobilePerformanceTest;

// Run if executed directly
if (require.main === module) {
  const mobileTest = new MobilePerformanceTest();
  mobileTest.runMobilePerformanceAnalysis().catch(console.error);
}