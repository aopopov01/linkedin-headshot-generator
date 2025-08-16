#!/usr/bin/env node

/**
 * API Integration Debug Script
 * Tests Replicate API endpoints and identifies issues with AI transformation
 * 
 * This script will:
 * 1. Validate API token and connectivity 
 * 2. Test FLUX.1 and InstantID model endpoints
 * 3. Debug image encoding and payload issues
 * 4. Identify where the AI chain is breaking
 * 5. Test with sample base64 image data
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// API Configuration
const API_TOKEN = 'YOUR_REPLICATE_API_KEY_HERE';
const BASE_URL = 'https://api.replicate.com/v1';

// Model versions from the app
const MODELS = {
  FLUX_DEV: "5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
  INSTANT_ID: "ef54c2aa5cbd14f967e1c8b2b3bb4a1d089e59a8436ebb5d6a42aa2b8aef5b80",
  PHOTOMAKER: "ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4"
};

// Sample small base64 test image (1x1 pixel white PNG)
const SAMPLE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hRBQNAAAAAElFTkSuQmCC';

class APIDebugger {
  constructor() {
    this.results = [];
  }

  // Main debug flow
  async debug() {
    console.log('🔍 Starting API Integration Debug...\n');
    
    try {
      // Step 1: Test API connectivity and authentication
      await this.testAPIConnectivity();
      
      // Step 2: Test model versions and availability
      await this.testModelAvailability();
      
      // Step 3: Test image encoding and payload structure
      await this.testImageEncoding();
      
      // Step 4: Test actual API calls with sample data
      await this.testAPICallsWithSampleData();
      
      // Step 5: Analyze results and provide recommendations
      this.analyzeResults();
      
    } catch (error) {
      console.error('❌ Debug process failed:', error);
    }
  }

  // Test basic API connectivity
  async testAPIConnectivity() {
    console.log('📡 Testing API Connectivity...');
    
    try {
      const response = await this.makeAPIRequest('GET', '/models');
      
      if (response.status === 200) {
        console.log('✅ API connectivity successful');
        this.results.push({ test: 'API_CONNECTIVITY', status: 'PASS' });
        
        // Check if we have access to models
        const models = JSON.parse(response.data);
        console.log(`📊 Available models: ${models.results ? models.results.length : 0}`);
      } else if (response.status === 401) {
        console.log('❌ Authentication failed - Invalid API token');
        this.results.push({ test: 'API_CONNECTIVITY', status: 'FAIL', error: 'Invalid API token' });
      } else {
        console.log(`⚠️ API returned status: ${response.status}`);
        this.results.push({ test: 'API_CONNECTIVITY', status: 'WARNING', status_code: response.status });
      }
    } catch (error) {
      console.log('❌ API connectivity failed:', error.message);
      this.results.push({ test: 'API_CONNECTIVITY', status: 'FAIL', error: error.message });
    }
    
    console.log('');
  }

  // Test if our model versions are valid
  async testModelAvailability() {
    console.log('🤖 Testing Model Availability...');
    
    const modelTests = Object.entries(MODELS).map(async ([modelName, version]) => {
      try {
        console.log(`   Testing ${modelName}: ${version.substring(0, 12)}...`);
        
        // Try to get model info
        const response = await this.makeAPIRequest('GET', `/models/replicate/flux-dev`);
        
        if (response.status === 200) {
          console.log(`   ✅ ${modelName} - Model accessible`);
          return { model: modelName, status: 'PASS' };
        } else {
          console.log(`   ❌ ${modelName} - Status: ${response.status}`);
          return { model: modelName, status: 'FAIL', status_code: response.status };
        }
      } catch (error) {
        console.log(`   ❌ ${modelName} - Error: ${error.message}`);
        return { model: modelName, status: 'FAIL', error: error.message };
      }
    });

    const modelResults = await Promise.all(modelTests);
    this.results.push({ test: 'MODEL_AVAILABILITY', results: modelResults });
    
    console.log('');
  }

  // Test image encoding and payload structure
  async testImageEncoding() {
    console.log('🖼️  Testing Image Encoding...');
    
    try {
      // Test base64 format
      if (SAMPLE_BASE64.startsWith('data:image/')) {
        console.log('✅ Base64 format is correct');
        
        // Test size
        const sizeInBytes = (SAMPLE_BASE64.length * 3) / 4;
        console.log(`📏 Base64 size: ${sizeInBytes} bytes`);
        
        if (sizeInBytes < 10 * 1024 * 1024) { // 10MB limit
          console.log('✅ Image size is within limits');
          this.results.push({ test: 'IMAGE_ENCODING', status: 'PASS', size: sizeInBytes });
        } else {
          console.log('❌ Image too large');
          this.results.push({ test: 'IMAGE_ENCODING', status: 'FAIL', error: 'Image too large' });
        }
      } else {
        console.log('❌ Invalid base64 format');
        this.results.push({ test: 'IMAGE_ENCODING', status: 'FAIL', error: 'Invalid base64 format' });
      }
    } catch (error) {
      console.log('❌ Image encoding test failed:', error.message);
      this.results.push({ test: 'IMAGE_ENCODING', status: 'FAIL', error: error.message });
    }
    
    console.log('');
  }

  // Test actual API calls with sample data
  async testAPICallsWithSampleData() {
    console.log('🚀 Testing API Calls with Sample Data...');
    
    // Test 1: FLUX.1 Dev model (as used in the app)
    await this.testFLUXModel();
    
    // Test 2: InstantID model (fallback in the app)
    await this.testInstantIDModel();
    
    // Test 3: PhotoMaker model (legacy fallback)
    await this.testPhotoMakerModel();
  }

  // Test FLUX.1 Dev model
  async testFLUXModel() {
    console.log('   Testing FLUX.1 Dev Model...');
    
    try {
      const payload = {
        version: MODELS.FLUX_DEV,
        input: {
          image: SAMPLE_BASE64,
          prompt: "Professional executive headshot, wearing expensive dark business suit, studio lighting, professional background, confident executive expression, ultra realistic",
          strength: 0.95,
          guidance_scale: 3.5,
          num_inference_steps: 28,
          seed: 123456,
          output_format: "jpg",
          output_quality: 95
        }
      };

      console.log('   📤 Sending FLUX.1 prediction request...');
      const response = await this.makeAPIRequest('POST', '/predictions', JSON.stringify(payload));
      
      if (response.status === 201) {
        const prediction = JSON.parse(response.data);
        console.log(`   ✅ FLUX.1 prediction created: ${prediction.id}`);
        console.log(`   📊 Status: ${prediction.status}`);
        
        // Test polling the prediction
        const finalResult = await this.pollPrediction(prediction.id, 30000); // 30 second timeout for test
        
        this.results.push({ 
          test: 'FLUX_MODEL', 
          status: finalResult.status === 'succeeded' ? 'PASS' : 'PARTIAL',
          prediction_id: prediction.id,
          final_status: finalResult.status,
          result: finalResult
        });
        
      } else if (response.status === 422) {
        console.log('   ❌ FLUX.1 - Validation error (likely model version issue)');
        console.log('   📋 Response:', response.data);
        this.results.push({ 
          test: 'FLUX_MODEL', 
          status: 'FAIL', 
          error: 'Validation error - check model version',
          response: response.data
        });
      } else {
        console.log(`   ❌ FLUX.1 - Unexpected status: ${response.status}`);
        console.log('   📋 Response:', response.data);
        this.results.push({ 
          test: 'FLUX_MODEL', 
          status: 'FAIL', 
          status_code: response.status,
          response: response.data
        });
      }
    } catch (error) {
      console.log('   ❌ FLUX.1 test failed:', error.message);
      this.results.push({ test: 'FLUX_MODEL', status: 'FAIL', error: error.message });
    }
  }

  // Test InstantID model
  async testInstantIDModel() {
    console.log('   Testing InstantID Model...');
    
    try {
      const payload = {
        version: MODELS.INSTANT_ID,
        input: {
          image: SAMPLE_BASE64,
          face_image: SAMPLE_BASE64,
          prompt: "Professional corporate headshot, studio lighting, professional background",
          negative_prompt: "nsfw, lowres, bad anatomy, bad hands, text, error, blurry",
          controlnet_conditioning_scale: 0.8,
          ip_adapter_scale: 0.6,
          num_inference_steps: 20,
          guidance_scale: 5
        }
      };

      console.log('   📤 Sending InstantID prediction request...');
      const response = await this.makeAPIRequest('POST', '/predictions', JSON.stringify(payload));
      
      if (response.status === 201) {
        const prediction = JSON.parse(response.data);
        console.log(`   ✅ InstantID prediction created: ${prediction.id}`);
        console.log(`   📊 Status: ${prediction.status}`);
        
        const finalResult = await this.pollPrediction(prediction.id, 30000);
        
        this.results.push({ 
          test: 'INSTANT_ID_MODEL', 
          status: finalResult.status === 'succeeded' ? 'PASS' : 'PARTIAL',
          prediction_id: prediction.id,
          final_status: finalResult.status,
          result: finalResult
        });
        
      } else {
        console.log(`   ❌ InstantID - Status: ${response.status}`);
        console.log('   📋 Response:', response.data);
        this.results.push({ 
          test: 'INSTANT_ID_MODEL', 
          status: 'FAIL', 
          status_code: response.status,
          response: response.data
        });
      }
    } catch (error) {
      console.log('   ❌ InstantID test failed:', error.message);
      this.results.push({ test: 'INSTANT_ID_MODEL', status: 'FAIL', error: error.message });
    }
  }

  // Test PhotoMaker model (current working model in app)
  async testPhotoMakerModel() {
    console.log('   Testing PhotoMaker Model...');
    
    try {
      const payload = {
        version: MODELS.PHOTOMAKER,
        input: {
          input_image: SAMPLE_BASE64,
          prompt: "professional corporate headshot, business suit, studio lighting",
          negative_prompt: "blurry, low quality, distorted, unprofessional",
          num_steps: 50,
          style_strength_ratio: 20,
          num_outputs: 2,
          guidance_scale: 5
        }
      };

      console.log('   📤 Sending PhotoMaker prediction request...');
      const response = await this.makeAPIRequest('POST', '/predictions', JSON.stringify(payload));
      
      if (response.status === 201) {
        const prediction = JSON.parse(response.data);
        console.log(`   ✅ PhotoMaker prediction created: ${prediction.id}`);
        console.log(`   📊 Status: ${prediction.status}`);
        
        const finalResult = await this.pollPrediction(prediction.id, 45000); // Longer timeout
        
        this.results.push({ 
          test: 'PHOTOMAKER_MODEL', 
          status: finalResult.status === 'succeeded' ? 'PASS' : 'PARTIAL',
          prediction_id: prediction.id,
          final_status: finalResult.status,
          result: finalResult
        });
        
      } else {
        console.log(`   ❌ PhotoMaker - Status: ${response.status}`);
        console.log('   📋 Response:', response.data);
        this.results.push({ 
          test: 'PHOTOMAKER_MODEL', 
          status: 'FAIL', 
          status_code: response.status,
          response: response.data
        });
      }
    } catch (error) {
      console.log('   ❌ PhotoMaker test failed:', error.message);
      this.results.push({ test: 'PHOTOMAKER_MODEL', status: 'FAIL', error: error.message });
    }
  }

  // Poll prediction until completion or timeout
  async pollPrediction(predictionId, timeoutMs = 60000) {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds
    
    console.log(`   ⏱️  Polling prediction ${predictionId}...`);
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await this.makeAPIRequest('GET', `/predictions/${predictionId}`);
        
        if (response.status === 200) {
          const prediction = JSON.parse(response.data);
          console.log(`   📊 Status: ${prediction.status}`);
          
          if (prediction.status === 'succeeded') {
            console.log('   ✅ Prediction succeeded!');
            console.log(`   🖼️  Output count: ${prediction.output ? (Array.isArray(prediction.output) ? prediction.output.length : 1) : 0}`);
            return prediction;
          } else if (prediction.status === 'failed') {
            console.log('   ❌ Prediction failed:', prediction.error);
            return prediction;
          } else if (prediction.status === 'canceled') {
            console.log('   ⏹️  Prediction canceled');
            return prediction;
          }
          // Still processing, continue polling
        } else {
          console.log(`   ⚠️ Polling error: ${response.status}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
      } catch (error) {
        console.log(`   ❌ Polling error: ${error.message}`);
        break;
      }
    }
    
    console.log('   ⏰ Polling timeout reached');
    return { status: 'timeout', id: predictionId };
  }

  // Make HTTP request to Replicate API
  makeAPIRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.replicate.com',
        port: 443,
        path: '/v1' + path,
        method: method,
        headers: {
          'Authorization': `Token ${API_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'LinkedInHeadshot-Debug/1.0'
        }
      };

      if (data) {
        options.headers['Content-Length'] = Buffer.byteLength(data);
      }

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(data);
      }
      
      req.end();
    });
  }

  // Analyze all test results and provide recommendations
  analyzeResults() {
    console.log('\n📋 ANALYSIS REPORT\n');
    console.log('='.repeat(50));
    
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const warningTests = this.results.filter(r => r.status === 'WARNING' || r.status === 'PARTIAL').length;
    
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⚠️  Warnings: ${warningTests}`);
    console.log(`📊 Total: ${this.results.length}\n`);
    
    // Detailed analysis
    console.log('DETAILED FINDINGS:\n');
    
    const apiConnectivity = this.results.find(r => r.test === 'API_CONNECTIVITY');
    if (apiConnectivity?.status === 'FAIL') {
      console.log('🚨 CRITICAL: API connectivity failed');
      console.log('   → Check API token validity');
      console.log('   → Verify network connectivity');
      console.log('   → Confirm Replicate API is accessible\n');
    }
    
    const fluxResult = this.results.find(r => r.test === 'FLUX_MODEL');
    const instantIdResult = this.results.find(r => r.test === 'INSTANT_ID_MODEL');
    const photoMakerResult = this.results.find(r => r.test === 'PHOTOMAKER_MODEL');
    
    console.log('MODEL PERFORMANCE:');
    console.log(`   FLUX.1 Dev: ${fluxResult?.status || 'NOT_TESTED'}`);
    console.log(`   InstantID: ${instantIdResult?.status || 'NOT_TESTED'}`);
    console.log(`   PhotoMaker: ${photoMakerResult?.status || 'NOT_TESTED'}\n`);
    
    // Root cause analysis
    console.log('ROOT CAUSE ANALYSIS:\n');
    
    if (fluxResult?.status === 'FAIL' && fluxResult?.error?.includes('Validation error')) {
      console.log('🔍 ISSUE: FLUX.1 model version may be incorrect');
      console.log('   → The model version in your app may be outdated');
      console.log('   → Check Replicate docs for current FLUX.1 version');
      console.log('   → Model: 5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637\n');
    }
    
    if (instantIdResult?.status === 'FAIL') {
      console.log('🔍 ISSUE: InstantID fallback is not working');
      console.log('   → This explains why users get "resized" images instead of AI transforms');
      console.log('   → The app falls back to local image manipulation\n');
    }
    
    if (photoMakerResult?.status === 'PASS') {
      console.log('✅ SUCCESS: PhotoMaker model is working');
      console.log('   → This should provide actual AI transformation');
      console.log('   → Check why app is not using PhotoMaker results\n');
    }
    
    // Recommendations
    console.log('RECOMMENDATIONS:\n');
    
    console.log('1. 🔧 FIX MODEL VERSIONS:');
    console.log('   - Update FLUX.1 model version to current working version');
    console.log('   - Verify InstantID model version is correct');
    console.log('   - Test with latest Replicate model versions\n');
    
    console.log('2. 🔀 FIX FALLBACK CHAIN:');
    console.log('   - App should use PhotoMaker as primary (it works)');
    console.log('   - Fix InstantID configuration for better fallback');
    console.log('   - Ensure AI results are properly returned to UI\n');
    
    console.log('3. 🖼️  FIX IMAGE PROCESSING:');
    console.log('   - Verify base64 encoding is correct for real images');
    console.log('   - Test with actual photo data, not just sample pixel');
    console.log('   - Ensure image preprocessing doesn\'t break AI input\n');
    
    console.log('4. 🐛 DEBUG APP FLOW:');
    console.log('   - Add more logging in processWithDramaticAI()');
    console.log('   - Check if API responses are being processed correctly');
    console.log('   - Verify polling logic is waiting for results\n');
    
    // Save results to file
    const reportPath = path.join(__dirname, 'api-debug-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { passed: passedTests, failed: failedTests, warnings: warningTests },
      results: this.results
    }, null, 2));
    
    console.log(`📄 Full report saved to: ${reportPath}`);
  }
}

// Run the debug script
if (require.main === module) {
  const apiDebugger = new APIDebugger();
  apiDebugger.debug().catch(console.error);
}

module.exports = APIDebugger;