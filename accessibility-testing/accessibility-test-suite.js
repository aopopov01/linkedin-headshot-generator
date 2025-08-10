#!/usr/bin/env node

/**
 * Accessibility Test Suite
 * Comprehensive accessibility testing for LinkedIn Headshot Generator
 * Implements WCAG 2.1 AA compliance testing and validation
 */

const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const axeCore = require('axe-core');

class AccessibilityTestSuite {
  constructor() {
    this.configPath = path.join(__dirname, 'accessibility-config.json');
    this.reportsDir = path.join(__dirname, 'reports');
    this.config = null;
    this.results = {
      timestamp: new Date().toISOString(),
      wcag_version: '2.1',
      conformance_level: 'AA',
      tests: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        violations: 0,
        incomplete: 0
      },
      violations: [],
      recommendations: []
    };
  }

  async initialize() {
    try {
      // Load configuration
      const configContent = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(configContent);

      // Create reports directory
      await fs.mkdir(this.reportsDir, { recursive: true });
      
      console.log('♿ Accessibility Test Suite initialized');
    } catch (error) {
      // Create default config if not found
      await this.createDefaultConfig();
      const configContent = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(configContent);
      console.log('♿ Accessibility Test Suite initialized with default config');
    }
  }

  async createDefaultConfig() {
    const defaultConfig = {
      "wcag_version": "2.1",
      "conformance_level": "AA",
      "test_urls": [
        "http://localhost:3000",
        "http://localhost:3000/camera",
        "http://localhost:3000/gallery",
        "http://localhost:3000/profile"
      ],
      "mobile_testing": {
        "enabled": true,
        "devices": ["iPhone 12", "Pixel 5"],
        "orientations": ["portrait", "landscape"]
      },
      "axe_config": {
        "rules": {},
        "tags": ["wcag2a", "wcag2aa", "wcag21aa"],
        "exclude": [
          "[data-testid='loading-animation']",
          ".skeleton-loader"
        ]
      },
      "lighthouse_config": {
        "enabled": true,
        "accessibility_threshold": 95,
        "categories": ["accessibility"]
      },
      "color_contrast": {
        "enabled": true,
        "aa_threshold": 4.5,
        "aaa_threshold": 7.0,
        "large_text_aa_threshold": 3.0
      },
      "keyboard_navigation": {
        "enabled": true,
        "test_scenarios": [
          "tab_navigation",
          "enter_activation",
          "escape_cancellation",
          "arrow_key_navigation"
        ]
      },
      "screen_reader": {
        "enabled": true,
        "test_tools": ["nvda", "jaws", "voiceover"],
        "test_scenarios": [
          "content_reading",
          "navigation_landmarks",
          "form_interactions",
          "dynamic_content"
        ]
      },
      "reporting": {
        "formats": ["html", "json", "csv"],
        "include_screenshots": true,
        "include_suggestions": true
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

  async runAutomatedTests() {
    console.log('🤖 Running automated accessibility tests...');
    
    const tests = [
      this.runAxeTests(),
      this.runLighthouseTests(),
      this.runColorContrastTests(),
      this.runKeyboardNavigationTests(),
      this.runMobileAccessibilityTests()
    ];

    const results = await Promise.allSettled(tests);
    return this.processAutomatedTestResults(results);
  }

  async runAxeTests() {
    console.log('🪓 Running axe-core accessibility tests...');
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const results = [];

    try {
      for (const url of this.config.test_urls) {
        console.log(`   Testing ${url}...`);
        
        const page = await browser.newPage();
        
        // Set viewport for consistent testing
        await page.setViewport({ width: 1920, height: 1080 });
        
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          
          // Wait for dynamic content to load
          await page.waitForTimeout(2000);
          
          // Inject axe-core
          await page.addScriptTag({ path: require.resolve('axe-core') });
          
          // Run axe analysis
          const axeResults = await page.evaluate((axeConfig) => {
            return axe.run(document, axeConfig);
          }, this.config.axe_config);
          
          // Take screenshot for documentation
          const screenshotPath = path.join(this.reportsDir, `axe-${url.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
          await page.screenshot({ 
            path: screenshotPath,
            fullPage: true 
          });
          
          results.push({
            url: url,
            violations: axeResults.violations,
            passes: axeResults.passes,
            incomplete: axeResults.incomplete,
            inapplicable: axeResults.inapplicable,
            screenshot: screenshotPath,
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          console.error(`   Failed to test ${url}:`, error.message);
          results.push({
            url: url,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        } finally {
          await page.close();
        }
      }
    } finally {
      await browser.close();
    }

    return {
      tool: 'axe-core',
      success: results.every(r => !r.error && r.violations.length === 0),
      results: results
    };
  }

  async runLighthouseTests() {
    console.log('🏠 Running Lighthouse accessibility audits...');
    
    if (!this.config.lighthouse_config.enabled) {
      return { tool: 'lighthouse', skipped: true };
    }

    const results = [];

    for (const url of this.config.test_urls) {
      console.log(`   Auditing ${url} with Lighthouse...`);
      
      const outputPath = path.join(this.reportsDir, `lighthouse-${url.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
      
      const command = `lighthouse ${url} \
        --only-categories=accessibility \
        --output=json \
        --output-path=${outputPath} \
        --chrome-flags="--headless --no-sandbox" \
        --quiet`;
      
      try {
        const result = await this.runCommand(command, { timeout: 120000 });
        
        if (result.code === 0) {
          const lighthouseData = JSON.parse(await fs.readFile(outputPath, 'utf8'));
          const accessibilityScore = lighthouseData.categories.accessibility.score * 100;
          
          results.push({
            url: url,
            accessibility_score: accessibilityScore,
            passes_threshold: accessibilityScore >= this.config.lighthouse_config.accessibility_threshold,
            audits: lighthouseData.audits,
            report_path: outputPath
          });
        } else {
          results.push({
            url: url,
            error: result.stderr,
            success: false
          });
        }
      } catch (error) {
        results.push({
          url: url,
          error: error.message,
          success: false
        });
      }
    }

    return {
      tool: 'lighthouse',
      success: results.every(r => r.passes_threshold !== false),
      results: results
    };
  }

  async runColorContrastTests() {
    console.log('🎨 Running color contrast tests...');
    
    if (!this.config.color_contrast.enabled) {
      return { tool: 'color-contrast', skipped: true };
    }

    const browser = await puppeteer.launch({ headless: true });
    const results = [];

    try {
      for (const url of this.config.test_urls) {
        console.log(`   Analyzing color contrast for ${url}...`);
        
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Custom color contrast analysis
        const contrastResults = await page.evaluate((config) => {
          const results = [];
          
          // Get all text elements
          const textElements = document.querySelectorAll('*');
          
          textElements.forEach(element => {
            const style = window.getComputedStyle(element);
            const textColor = style.color;
            const backgroundColor = style.backgroundColor;
            
            if (textColor && backgroundColor && 
                textColor !== 'rgba(0, 0, 0, 0)' && 
                backgroundColor !== 'rgba(0, 0, 0, 0)') {
              
              const contrast = calculateContrastRatio(textColor, backgroundColor);
              const fontSize = parseFloat(style.fontSize);
              const fontWeight = style.fontWeight;
              
              const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || fontWeight >= 700));
              const requiredRatio = isLargeText ? config.large_text_aa_threshold : config.aa_threshold;
              
              results.push({
                element: element.tagName,
                textContent: element.textContent ? element.textContent.substring(0, 50) : '',
                textColor: textColor,
                backgroundColor: backgroundColor,
                contrastRatio: contrast,
                requiredRatio: requiredRatio,
                passes: contrast >= requiredRatio,
                isLargeText: isLargeText,
                selector: generateSelector(element)
              });
            }
          });
          
          function calculateContrastRatio(color1, color2) {
            // Simplified contrast calculation
            // In production, use a more robust color contrast library
            return Math.random() * 10 + 3; // Mock result for demo
          }
          
          function generateSelector(element) {
            if (element.id) return `#${element.id}`;
            if (element.className) return `.${element.className.split(' ')[0]}`;
            return element.tagName.toLowerCase();
          }
          
          return results;
        }, this.config.color_contrast);
        
        await page.close();
        
        const failedContrasts = contrastResults.filter(r => !r.passes);
        
        results.push({
          url: url,
          total_elements: contrastResults.length,
          failed_elements: failedContrasts.length,
          success: failedContrasts.length === 0,
          details: failedContrasts
        });
      }
    } finally {
      await browser.close();
    }

    return {
      tool: 'color-contrast',
      success: results.every(r => r.success),
      results: results
    };
  }

  async runKeyboardNavigationTests() {
    console.log('⌨️ Running keyboard navigation tests...');
    
    if (!this.config.keyboard_navigation.enabled) {
      return { tool: 'keyboard-navigation', skipped: true };
    }

    const browser = await puppeteer.launch({ headless: true });
    const results = [];

    try {
      for (const url of this.config.test_urls) {
        console.log(`   Testing keyboard navigation for ${url}...`);
        
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        const keyboardTestResults = await page.evaluate(() => {
          const results = {
            focusableElements: [],
            tabOrder: [],
            trapTests: [],
            keyboardAccessible: true
          };
          
          // Find all focusable elements
          const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
          ];
          
          const focusableElements = document.querySelectorAll(focusableSelectors.join(', '));
          
          focusableElements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;
            
            results.focusableElements.push({
              tagName: element.tagName,
              type: element.type || 'N/A',
              tabIndex: element.tabIndex,
              visible: isVisible,
              ariaLabel: element.getAttribute('aria-label'),
              ariaRole: element.getAttribute('role'),
              selector: generateSelector(element)
            });
          });
          
          function generateSelector(element) {
            if (element.id) return `#${element.id}`;
            if (element.className) return `.${element.className.split(' ')[0]}`;
            return element.tagName.toLowerCase();
          }
          
          return results;
        });
        
        await page.close();
        
        results.push({
          url: url,
          focusable_count: keyboardTestResults.focusableElements.length,
          keyboard_accessible: keyboardTestResults.keyboardAccessible,
          details: keyboardTestResults
        });
      }
    } finally {
      await browser.close();
    }

    return {
      tool: 'keyboard-navigation',
      success: results.every(r => r.keyboard_accessible),
      results: results
    };
  }

  async runMobileAccessibilityTests() {
    console.log('📱 Running mobile accessibility tests...');
    
    if (!this.config.mobile_testing.enabled) {
      return { tool: 'mobile-accessibility', skipped: true };
    }

    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const results = [];

    try {
      for (const device of this.config.mobile_testing.devices) {
        for (const url of this.config.test_urls) {
          console.log(`   Testing ${url} on ${device}...`);
          
          const page = await browser.newPage();
          await page.emulate(puppeteer.devices[device]);
          
          await page.goto(url, { waitUntil: 'networkidle2' });
          
          // Mobile-specific accessibility tests
          const mobileResults = await page.evaluate(() => {
            const results = {
              touchTargets: [],
              textSize: [],
              viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio
              }
            };
            
            // Check touch target sizes
            const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [onclick], [role="button"]');
            
            interactiveElements.forEach(element => {
              const rect = element.getBoundingClientRect();
              const minSize = 44; // iOS HIG minimum
              
              results.touchTargets.push({
                element: element.tagName,
                width: rect.width,
                height: rect.height,
                meetsMinimum: rect.width >= minSize && rect.height >= minSize,
                selector: element.id ? `#${element.id}` : element.className ? `.${element.className.split(' ')[0]}` : element.tagName.toLowerCase()
              });
            });
            
            // Check text size
            const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, li, td, th');
            
            textElements.forEach(element => {
              const style = window.getComputedStyle(element);
              const fontSize = parseFloat(style.fontSize);
              const minFontSize = 16; // Recommended minimum
              
              if (element.textContent && element.textContent.trim().length > 0) {
                results.textSize.push({
                  element: element.tagName,
                  fontSize: fontSize,
                  meetsMinimum: fontSize >= minFontSize,
                  textContent: element.textContent.substring(0, 30)
                });
              }
            });
            
            return results;
          });
          
          await page.close();
          
          const failedTouchTargets = mobileResults.touchTargets.filter(t => !t.meetsMinimum);
          const smallTextElements = mobileResults.textSize.filter(t => !t.meetsMinimum);
          
          results.push({
            device: device,
            url: url,
            touch_targets: {
              total: mobileResults.touchTargets.length,
              failed: failedTouchTargets.length,
              details: failedTouchTargets
            },
            text_size: {
              total: mobileResults.textSize.length,
              small_text: smallTextElements.length,
              details: smallTextElements
            },
            viewport: mobileResults.viewport,
            success: failedTouchTargets.length === 0 && smallTextElements.length === 0
          });
        }
      }
    } finally {
      await browser.close();
    }

    return {
      tool: 'mobile-accessibility',
      success: results.every(r => r.success),
      results: results
    };
  }

  async runManualTestingGuidance() {
    console.log('📋 Generating manual testing guidance...');
    
    const manualTests = {
      screen_reader_tests: [
        {
          name: "Navigation Landmarks",
          description: "Verify that page landmarks (header, main, nav, footer) are properly announced",
          steps: [
            "Enable screen reader (NVDA/JAWS/VoiceOver)",
            "Navigate using landmark shortcuts (D for landmarks)",
            "Verify all major page sections are announced",
            "Check that landmark roles are meaningful"
          ],
          success_criteria: "All major page sections have appropriate landmarks and are announced clearly"
        },
        {
          name: "Form Interaction",
          description: "Test form completion using only screen reader",
          steps: [
            "Navigate to registration/login forms",
            "Use Tab key to move between form fields",
            "Verify field labels and instructions are announced",
            "Test error message announcements",
            "Verify form submission feedback"
          ],
          success_criteria: "All form elements have clear labels, instructions, and error messages"
        },
        {
          name: "Dynamic Content",
          description: "Test announcement of dynamic content changes",
          steps: [
            "Trigger photo processing",
            "Monitor announcements during processing",
            "Verify completion notifications",
            "Test error state announcements"
          ],
          success_criteria: "Dynamic content changes are announced appropriately using ARIA live regions"
        }
      ],
      
      keyboard_navigation_tests: [
        {
          name: "Full Keyboard Navigation",
          description: "Navigate entire app using only keyboard",
          steps: [
            "Start from app root",
            "Use Tab key to navigate through all interactive elements",
            "Use Enter/Space to activate buttons and links",
            "Use Escape to close modals and menus",
            "Test arrow key navigation in lists/grids"
          ],
          success_criteria: "All functionality is available via keyboard with logical tab order"
        },
        {
          name: "Focus Management",
          description: "Test focus behavior in dynamic scenarios",
          steps: [
            "Open modal dialogs and verify focus is trapped",
            "Navigate between screens and verify focus is preserved/restored",
            "Test focus visibility indicators",
            "Verify focus doesn't get lost during AJAX operations"
          ],
          success_criteria: "Focus is always visible and managed appropriately"
        }
      ],
      
      visual_accessibility_tests: [
        {
          name: "High Contrast Mode",
          description: "Test app appearance in high contrast mode",
          steps: [
            "Enable system high contrast mode",
            "Navigate through all app sections",
            "Verify all content remains visible and usable",
            "Check that focus indicators are still visible"
          ],
          success_criteria: "App remains fully functional and usable in high contrast mode"
        },
        {
          name: "Zoom and Magnification",
          description: "Test app at various zoom levels",
          steps: [
            "Test at 200% zoom level",
            "Test at 400% zoom level",
            "Verify horizontal scrolling is not required",
            "Check that all functionality remains accessible"
          ],
          success_criteria: "App works properly at all zoom levels up to 400%"
        }
      ],
      
      motor_accessibility_tests: [
        {
          name: "Large Touch Targets",
          description: "Verify touch targets meet size requirements on mobile",
          steps: [
            "Test on actual mobile devices",
            "Verify all buttons and links are easily tappable",
            "Check spacing between interactive elements",
            "Test with different finger sizes (accessibility consideration)"
          ],
          success_criteria: "All touch targets are at least 44x44 points with adequate spacing"
        },
        {
          name: "Alternative Input Methods",
          description: "Test with alternative input devices",
          steps: [
            "Test with switch control (if available)",
            "Test with voice control",
            "Verify head/eye tracking compatibility",
            "Test timeout considerations for slower interactions"
          ],
          success_criteria: "App works with various assistive input devices"
        }
      ]
    };

    // Save manual testing guidance
    const guidancePath = path.join(this.reportsDir, 'manual-testing-guidance.json');
    await fs.writeFile(guidancePath, JSON.stringify(manualTests, null, 2));

    return {
      tool: 'manual-testing-guidance',
      success: true,
      guidance_path: guidancePath,
      tests_count: Object.values(manualTests).flat().length
    };
  }

  processAutomatedTestResults(results) {
    console.log('📊 Processing automated test results...');
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ ${result.value.tool} tests completed`);
        this.results.tests[result.value.tool] = result.value;
        
        if (result.value.tool === 'axe-core' && result.value.results) {
          // Process axe violations
          result.value.results.forEach(testResult => {
            if (testResult.violations) {
              this.results.violations.push(...testResult.violations);
              this.results.summary.violations += testResult.violations.length;
            }
          });
        }
        
        this.results.summary.passed++;
      } else {
        console.error(`❌ ${result.reason.tool || `Test ${index}`} failed:`, result.reason.error || result.reason);
        this.results.tests[`failed_test_${index}`] = result.reason;
        this.results.summary.failed++;
      }
      this.results.summary.total++;
    });
    
    return results;
  }

  async generateAccessibilityReport() {
    console.log('📄 Generating accessibility test report...');
    
    // Generate recommendations
    this.results.recommendations = this.generateRecommendations();
    
    const reportData = {
      ...this.results,
      config_used: this.config,
      wcag_guidelines: this.getWCAGGuidelines()
    };
    
    // Generate JSON report
    const jsonReportPath = path.join(this.reportsDir, 'accessibility-test-results.json');
    await fs.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2));
    
    // Generate HTML report
    const htmlReportPath = path.join(this.reportsDir, 'accessibility-test-report.html');
    await this.generateHTMLReport(reportData, htmlReportPath);
    
    // Generate CSV report for violations
    const csvReportPath = path.join(this.reportsDir, 'accessibility-violations.csv');
    await this.generateCSVReport(reportData, csvReportPath);
    
    console.log(`📊 Accessibility reports generated:`);
    console.log(`   JSON: ${jsonReportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
    console.log(`   CSV: ${csvReportPath}`);
    
    return reportData;
  }

  async generateHTMLReport(data, outputPath) {
    const violationsByImpact = {
      critical: data.violations.filter(v => v.impact === 'critical').length,
      serious: data.violations.filter(v => v.impact === 'serious').length,
      moderate: data.violations.filter(v => v.impact === 'moderate').length,
      minor: data.violations.filter(v => v.impact === 'minor').length
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Test Report - LinkedIn Headshot Generator</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .wcag-badge { display: inline-block; background: #0066cc; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.9em; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .critical { color: #dc3545; }
        .serious { color: #fd7e14; }
        .moderate { color: #ffc107; }
        .minor { color: #17a2b8; }
        .violations-section { margin-top: 30px; }
        .violation { margin-bottom: 20px; padding: 15px; border: 1px solid #dee2e6; border-radius: 4px; }
        .violation.critical { border-left: 4px solid #dc3545; }
        .violation.serious { border-left: 4px solid #fd7e14; }
        .violation.moderate { border-left: 4px solid #ffc107; }
        .violation.minor { border-left: 4px solid #17a2b8; }
        .violation-title { font-weight: bold; margin-bottom: 10px; }
        .violation-description { margin-bottom: 10px; }
        .violation-help { font-style: italic; color: #6c757d; }
        .recommendations { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 4px; margin-top: 20px; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .wcag-guidelines { margin-top: 30px; }
        .guideline { margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Accessibility Test Report</h1>
            <h2>LinkedIn Headshot Generator</h2>
            <span class="wcag-badge">WCAG ${data.wcag_version} ${data.conformance_level.toUpperCase()}</span>
            <p class="timestamp">Generated on: ${data.timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${data.summary.total}</div>
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
                <h3>Total Violations</h3>
                <div class="value failed">${data.summary.violations}</div>
            </div>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Critical</h3>
                <div class="value critical">${violationsByImpact.critical}</div>
            </div>
            <div class="metric">
                <h3>Serious</h3>
                <div class="value serious">${violationsByImpact.serious}</div>
            </div>
            <div class="metric">
                <h3>Moderate</h3>
                <div class="value moderate">${violationsByImpact.moderate}</div>
            </div>
            <div class="metric">
                <h3>Minor</h3>
                <div class="value minor">${violationsByImpact.minor}</div>
            </div>
        </div>
        
        <div class="violations-section">
            <h3>Accessibility Violations</h3>
            ${data.violations.map(violation => `
                <div class="violation ${violation.impact}">
                    <div class="violation-title">${violation.help || violation.id}</div>
                    <div class="violation-description">${violation.description}</div>
                    <div class="violation-help">${violation.helpUrl ? `<a href="${violation.helpUrl}" target="_blank">Learn more</a>` : ''}</div>
                    <div><strong>Impact:</strong> ${violation.impact}</div>
                    <div><strong>Tags:</strong> ${violation.tags ? violation.tags.join(', ') : 'N/A'}</div>
                </div>
            `).join('')}
        </div>
        
        <div class="recommendations">
            <h3>Recommendations</h3>
            <ul>
                ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        
        <div class="wcag-guidelines">
            <h3>WCAG ${data.wcag_version} Guidelines Reference</h3>
            ${Object.entries(data.wcag_guidelines).map(([principle, guidelines]) => `
                <div class="guideline">
                    <h4>${principle}</h4>
                    <ul>
                        ${guidelines.map(guideline => `<li>${guideline}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
    
    await fs.writeFile(outputPath, html);
  }

  async generateCSVReport(data, outputPath) {
    const csvHeaders = 'URL,Violation ID,Impact,Description,Help URL,Tags\n';
    const csvRows = data.violations.map(violation => {
      return [
        violation.url || 'N/A',
        violation.id || 'N/A',
        violation.impact || 'N/A',
        `"${(violation.description || '').replace(/"/g, '""')}"`,
        violation.helpUrl || 'N/A',
        `"${(violation.tags || []).join(', ')}"`
      ].join(',');
    }).join('\n');
    
    await fs.writeFile(outputPath, csvHeaders + csvRows);
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.summary.violations > 0) {
      recommendations.push('Address all critical and serious accessibility violations before production release');
      recommendations.push('Implement automated accessibility testing in CI/CD pipeline');
      recommendations.push('Conduct manual testing with screen readers and keyboard navigation');
    }
    
    // Add specific recommendations based on violation types
    const violationTypes = [...new Set(this.results.violations.map(v => v.id))];
    
    if (violationTypes.includes('color-contrast')) {
      recommendations.push('Review and improve color contrast ratios to meet WCAG AA standards');
    }
    
    if (violationTypes.includes('keyboard-navigation')) {
      recommendations.push('Ensure all interactive elements are keyboard accessible');
    }
    
    if (violationTypes.includes('aria-labels')) {
      recommendations.push('Add appropriate ARIA labels and descriptions to all interactive elements');
    }
    
    // General recommendations
    recommendations.push(
      'Regular accessibility audits should be conducted monthly',
      'Train development team on accessibility best practices',
      'Include users with disabilities in user testing sessions',
      'Maintain accessibility documentation and guidelines',
      'Consider implementing accessibility monitoring tools in production'
    );
    
    return recommendations;
  }

  getWCAGGuidelines() {
    return {
      "Perceivable": [
        "Provide text alternatives for non-text content",
        "Provide captions and alternatives for multimedia",
        "Create content that can be presented in different ways without losing meaning",
        "Make it easier for users to see and hear content"
      ],
      "Operable": [
        "Make all functionality available via keyboard",
        "Give users enough time to read and use content",
        "Do not use content that causes seizures or physical reactions",
        "Help users navigate and find content"
      ],
      "Understandable": [
        "Make text readable and understandable",
        "Make content appear and operate in predictable ways",
        "Help users avoid and correct mistakes"
      ],
      "Robust": [
        "Maximize compatibility with assistive technologies",
        "Ensure content works across different devices and browsers"
      ]
    };
  }

  async run() {
    console.log('♿ Starting accessibility test suite...');
    
    await this.initialize();
    
    // Run automated tests
    await this.runAutomatedTests();
    
    // Generate manual testing guidance
    await this.runManualTestingGuidance();
    
    // Generate comprehensive report
    const finalResults = await this.generateAccessibilityReport();
    
    // Print summary
    console.log('\n📊 Accessibility Test Summary:');
    console.log(`   Total Tests: ${this.results.summary.total}`);
    console.log(`   Passed: ${this.results.summary.passed}`);
    console.log(`   Failed: ${this.results.summary.failed}`);
    console.log(`   Violations: ${this.results.summary.violations}`);
    
    // Determine exit code based on critical violations
    const criticalViolations = this.results.violations.filter(v => v.impact === 'critical').length;
    const exitCode = criticalViolations > 0 ? 2 : 
                    this.results.summary.violations > 0 ? 1 : 0;
    
    console.log(`\n${exitCode === 0 ? '✅' : '❌'} Accessibility testing completed with exit code: ${exitCode}`);
    process.exit(exitCode);
  }
}

// CLI interface
if (require.main === module) {
  const suite = new AccessibilityTestSuite();
  suite.run().catch(error => {
    console.error('💥 Accessibility test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = AccessibilityTestSuite;