#!/usr/bin/env node

/**
 * COMPREHENSIVE HUGGING FACE API DEBUGGING TOOL
 * 
 * This script performs extensive debugging of the Hugging Face API integration
 * to identify why AI transformations are failing and users only get resized images.
 * 
 * CRITICAL INVESTIGATION AREAS:
 * 1. API Authentication and Rate Limiting
 * 2. Model Availability and Loading Status
 * 3. Image-to-Image Request Format Validation
 * 4. Response Processing and Error Analysis
 * 5. Actual AI Transformation Testing with Sample Images
 * 
 * MODELS TO TEST (from App.js):
 * - timbrooks/instruct-pix2pix (PRIMARY image-to-image)
 * - runwayml/stable-diffusion-v1-5
 * - stabilityai/stable-diffusion-xl-base-1.0
 * - SG161222/Realistic_Vision_V5.1_noVAE
 * - stabilityai/stable-diffusion-2-1
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// CONFIRMED WORKING TOKEN FROM USER
const HF_TOKEN = 'YOUR_HUGGING_FACE_TOKEN_HERE';

// Create a more realistic test image (small headshot-like base64)
const REALISTIC_TEST_IMAGE = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAQABADASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAABwgJBf/EACgQAAEDBAEEAQUBAAAAAAAAAAECAwQFBhEAByExEhNBURQiMmFxgf/EABUBAQEAAAAAAAAAAAAAAAAAAAAG/8QAGREAAwEBAQAAAAAAAAAAAAAAAAECEQMh/9oADAMBAAIRAxEAPwDsOxJI5jVgmIrq4MKsQkgpJQpQPcSoJB+QfgEjYIOMgg44yfnr1PQNz6JtFRYTTuR23PmLSXXX1qccWQMklR2THYOgEQ3kDCRgAY8j2wZV2JdCNaGZJcVjP5cSVOuE4AOQOGQOBgEJGPjrZOdFE5hW46Hxr/n5EtoFPsUu9D3FfzOdbPsOs2KrFTapEuIhwNLXwSoJdSQrCScgKB2QMHr5AzjOcafuDpC0dPttNUOzqFCQ0kIjsRo4bbAAwAkcRjHAY3xxOjGtCW9I3eX2QBrXEfb5Yxjce6D7Yj1v8Fn7wfnC/7+nfK/zVv8v7OWj8Gf/2Q==';

// EXACT MODELS FROM APP.JS
const MODELS_TO_TEST = [
  {
    id: 'timbrooks/instruct-pix2pix',
    name: 'Instruct Pix2Pix (PRIMARY)',
    type: 'image-to-image',
    endpoint: 'https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix',
    priority: 'HIGH',
    description: 'Primary image-to-image model used in app'
  },
  {
    id: 'runwayml/stable-diffusion-v1-5',
    name: 'Stable Diffusion v1.5',
    type: 'text-to-image-controlnet',
    endpoint: 'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
    priority: 'HIGH',
    description: 'Secondary model with controlnet'
  },
  {
    id: 'stabilityai/stable-diffusion-xl-base-1.0',
    name: 'SDXL Base',
    type: 'text-to-image',
    endpoint: 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
    priority: 'MEDIUM',
    description: 'High-quality text-to-image fallback'
  },
  {
    id: 'SG161222/Realistic_Vision_V5.1_noVAE',
    name: 'Realistic Vision V5.1',
    type: 'text-to-image-realistic',
    endpoint: 'https://api-inference.huggingface.co/models/SG161222/Realistic_Vision_V5.1_noVAE',
    priority: 'HIGH',
    description: 'Face-preserving realistic model'
  },
  {
    id: 'stabilityai/stable-diffusion-2-1',
    name: 'Stable Diffusion 2.1',
    type: 'text-to-image',
    endpoint: 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
    priority: 'MEDIUM',
    description: 'Alternative text-to-image model'
  }
];

class HuggingFaceDebugger {
  constructor() {
    this.token = HF_TOKEN;
    this.results = [];
    this.successfulModels = [];
    this.failedModels = [];
    this.debugReport = {
      timestamp: new Date().toISOString(),
      token_status: 'unknown',
      api_connectivity: 'unknown',
      model_results: [],
      critical_issues: [],
      recommendations: []
    };
  }

  async runComprehensiveDebug() {
    console.log('🔍 CRITICAL HUGGING FACE API DEBUGGING');
    console.log('=' .repeat(60));
    console.log(`🎯 Testing ${MODELS_TO_TEST.length} models with token: ${this.token.substring(0, 8)}...`);
    console.log('📋 Investigating why AI transformations fail\n');

    try {
      // Step 1: Verify API authentication
      await this.testAPIAuthentication();
      
      // Step 2: Check account limits and usage
      await this.checkAccountStatus();
      
      // Step 3: Test each model systematically
      await this.testAllModels();
      
      // Step 4: Perform realistic image-to-image test
      await this.testRealisticImageTransformation();
      
      // Step 5: Analyze results and provide actionable recommendations
      await this.analyzeAndReport();
      
    } catch (error) {
      console.error('🚨 CRITICAL DEBUGGING FAILURE:', error);
      this.debugReport.critical_issues.push(`Debug process failed: ${error.message}`);
    }
  }

  async testAPIAuthentication() {
    console.log('🔐 STEP 1: Testing API Authentication');
    console.log('-'.repeat(40));
    
    try {
      const response = await this.makeRequest(
        'https://huggingface.co/api/whoami',
        'GET'
      );

      if (response.status === 200) {
        const userData = JSON.parse(response.data);
        console.log('✅ Authentication SUCCESS');
        console.log(`👤 User: ${userData.name || userData.login || 'Unknown'}`);
        console.log(`📧 Email: ${userData.email || 'Not provided'}`);
        console.log(`🎁 Plan: ${userData.plan || 'Free'}`);
        
        this.debugReport.token_status = 'valid';
        this.debugReport.user_info = userData;
        
      } else if (response.status === 401) {
        console.log('❌ AUTHENTICATION FAILED - Invalid token');
        this.debugReport.token_status = 'invalid';
        this.debugReport.critical_issues.push('Invalid Hugging Face token');
        return false;
      } else {
        console.log(`⚠️ Unexpected auth response: ${response.status}`);
        this.debugReport.token_status = 'unknown';
      }
    } catch (error) {
      console.log('❌ Authentication test failed:', error.message);
      this.debugReport.token_status = 'error';
      this.debugReport.critical_issues.push(`Auth test failed: ${error.message}`);
    }
    
    console.log('');
    return this.debugReport.token_status === 'valid';
  }

  async checkAccountStatus() {
    console.log('💳 STEP 2: Checking Account Status & Limits');
    console.log('-'.repeat(40));
    
    try {
      // Try to get API usage info (if available)
      const response = await this.makeRequest(
        'https://api-inference.huggingface.co/',
        'GET'
      );

      if (response.status === 200) {
        console.log('✅ API endpoint accessible');
        this.debugReport.api_connectivity = 'success';
      } else if (response.status === 429) {
        console.log('⚠️ RATE LIMITED - Too many requests');
        this.debugReport.api_connectivity = 'rate_limited';
        this.debugReport.critical_issues.push('Rate limiting detected');
      } else {
        console.log(`⚠️ API status: ${response.status}`);
        this.debugReport.api_connectivity = 'limited';
      }
    } catch (error) {
      console.log('❌ API connectivity test failed:', error.message);
      this.debugReport.api_connectivity = 'failed';
    }
    
    console.log('');
  }

  async testAllModels() {
    console.log('🤖 STEP 3: Testing All Models Systematically');
    console.log('-'.repeat(40));
    
    for (const model of MODELS_TO_TEST) {
      console.log(`\n🔬 Testing: ${model.name} (${model.priority} priority)`);
      console.log(`   ID: ${model.id}`);
      console.log(`   Type: ${model.type}`);
      
      const result = await this.testSingleModel(model);
      this.debugReport.model_results.push(result);
      
      if (result.status === 'success') {
        this.successfulModels.push(model);
        console.log(`   ✅ SUCCESS - Model is working`);
      } else if (result.status === 'loading') {
        console.log(`   ⏳ LOADING - Model needs warmup (${result.estimated_wait}s)`);
      } else {
        this.failedModels.push(model);
        console.log(`   ❌ FAILED - ${result.error}`);
      }
    }
  }

  async testSingleModel(model) {
    const result = {
      model_id: model.id,
      model_name: model.name,
      type: model.type,
      priority: model.priority,
      status: 'unknown',
      response_time: 0,
      error: null,
      estimated_wait: 0
    };
    
    const startTime = Date.now();
    
    try {
      // Create appropriate test payload based on model type
      const payload = this.createTestPayload(model);
      
      const response = await this.makeRequest(
        model.endpoint,
        'POST',
        JSON.stringify(payload)
      );
      
      result.response_time = Date.now() - startTime;
      
      if (response.status === 200) {
        // Success - try to process response
        const contentType = response.headers['content-type'] || '';
        
        if (contentType.includes('image/')) {
          result.status = 'success';
          result.response_size = response.data.length;
          console.log(`     📊 Generated ${response.data.length} bytes of image data`);
        } else {
          // Might be JSON response
          try {
            const jsonResponse = JSON.parse(response.data);
            if (jsonResponse.error) {
              result.status = 'error';
              result.error = jsonResponse.error;
            } else {
              result.status = 'success';
              result.response_data = jsonResponse;
            }
          } catch {
            result.status = 'success';
            result.response_size = response.data.length;
          }
        }
      } else if (response.status === 503) {
        // Model loading
        result.status = 'loading';
        try {
          const errorData = JSON.parse(response.data);
          result.estimated_wait = errorData.estimated_time || 20;
          result.error = errorData.error || 'Model is loading';
        } catch {
          result.estimated_wait = 20;
          result.error = 'Model is loading';
        }
      } else if (response.status === 429) {
        result.status = 'rate_limited';
        result.error = 'Rate limit exceeded';
      } else if (response.status === 400) {
        result.status = 'bad_request';
        result.error = 'Invalid request format';
        result.response_data = response.data;
      } else {
        result.status = 'error';
        result.error = `HTTP ${response.status}: ${response.data}`;
      }
      
    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      result.response_time = Date.now() - startTime;
    }
    
    return result;
  }

  createTestPayload(model) {
    const professionalPrompt = "Professional executive headshot portrait, wearing dark business suit, studio lighting, corporate background, confident expression, high-quality photography, ultra realistic";
    
    const negativePrompt = "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, cropped, worst quality, low quality, blurry, cartoon, anime, painting, amateur, casual clothes";
    
    const basePayload = {
      inputs: professionalPrompt,
      parameters: {
        negative_prompt: negativePrompt,
        num_inference_steps: 20,
        guidance_scale: 7.5
      },
      options: {
        wait_for_model: true,
        use_cache: false
      }
    };
    
    // Customize based on model type
    if (model.type === 'image-to-image') {
      basePayload.parameters.image = REALISTIC_TEST_IMAGE;
      basePayload.parameters.image_guidance_scale = 1.5;
      basePayload.parameters.strength = 0.7;
    }
    
    return basePayload;
  }

  async testRealisticImageTransformation() {
    console.log('\n🎨 STEP 4: Testing Realistic Image Transformation');
    console.log('-'.repeat(40));
    
    // Find the best working model for realistic testing
    const workingModel = this.successfulModels.find(m => m.type === 'image-to-image') || 
                        this.successfulModels[0];
    
    if (!workingModel) {
      console.log('❌ No working models found for realistic testing');
      this.debugReport.critical_issues.push('No models are working for transformation');
      return;
    }
    
    console.log(`🎯 Using ${workingModel.name} for realistic test`);
    
    try {
      const payload = {
        inputs: "Transform this into a professional LinkedIn headshot: professional executive wearing expensive dark business suit, studio photography lighting, corporate background, confident professional expression, magazine quality, hyperrealistic, award-winning photography",
        parameters: {
          image: REALISTIC_TEST_IMAGE,
          negative_prompt: "nsfw, lowres, bad anatomy, bad hands, text, error, blurry, cartoon, anime, amateur, casual clothes, bad lighting, distorted face",
          num_inference_steps: 25,
          guidance_scale: 7.5,
          image_guidance_scale: 1.5,
          strength: 0.75
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      };
      
      console.log('📤 Sending realistic transformation request...');
      const response = await this.makeRequest(
        workingModel.endpoint,
        'POST',
        JSON.stringify(payload)
      );
      
      if (response.status === 200) {
        console.log('✅ REALISTIC TRANSFORMATION SUCCESS!');
        console.log(`📊 Generated ${response.data.length} bytes of transformed image`);
        
        // Save the result for inspection
        const outputPath = path.join(__dirname, 'debug-transformation-result.jpg');
        fs.writeFileSync(outputPath, Buffer.from(response.data, 'binary'));
        console.log(`💾 Result saved to: ${outputPath}`);
        
        this.debugReport.realistic_test = {
          status: 'success',
          model_used: workingModel.id,
          output_size: response.data.length,
          output_file: outputPath
        };
        
      } else {
        console.log(`❌ Realistic test failed: ${response.status}`);
        this.debugReport.realistic_test = {
          status: 'failed',
          error: response.data,
          status_code: response.status
        };
      }
      
    } catch (error) {
      console.log('❌ Realistic test error:', error.message);
      this.debugReport.realistic_test = {
        status: 'error',
        error: error.message
      };
    }
  }

  async analyzeAndReport() {
    console.log('\n📋 STEP 5: Analysis & Recommendations');
    console.log('='.repeat(60));
    
    const totalModels = MODELS_TO_TEST.length;
    const workingCount = this.successfulModels.length;
    const failedCount = this.failedModels.length;
    const loadingCount = this.debugReport.model_results.filter(r => r.status === 'loading').length;
    
    console.log(`📊 RESULTS SUMMARY:`);
    console.log(`   ✅ Working Models: ${workingCount}/${totalModels}`);
    console.log(`   ❌ Failed Models: ${failedCount}/${totalModels}`);
    console.log(`   ⏳ Loading Models: ${loadingCount}/${totalModels}`);
    
    // Critical Analysis
    console.log(`\n🔍 ROOT CAUSE ANALYSIS:`);
    
    if (this.debugReport.token_status !== 'valid') {
      console.log('🚨 CRITICAL: Invalid API Token');
      console.log('   → This explains why transformations are failing');
      console.log('   → Users get only resized images because API calls fail');
      this.debugReport.recommendations.push('Fix API token authentication');
    }
    
    if (workingCount === 0) {
      console.log('🚨 CRITICAL: No AI Models Working');
      console.log('   → All Hugging Face models are failing');
      console.log('   → App falls back to local image resizing only');
      this.debugReport.critical_issues.push('All AI models are non-functional');
      this.debugReport.recommendations.push('Investigate model availability and request format');
    } else if (workingCount < totalModels / 2) {
      console.log('⚠️ WARNING: Most Models Failing');
      console.log(`   → Only ${workingCount} out of ${totalModels} models working`);
      console.log('   → App may have inconsistent results');
      this.debugReport.recommendations.push('Optimize model selection and fallback logic');
    }
    
    if (loadingCount > 0) {
      console.log('⏳ INFO: Some Models Need Warmup');
      console.log(`   → ${loadingCount} models are in cold start state`);
      console.log('   → First requests will take 15-20 seconds');
      this.debugReport.recommendations.push('Implement proper model warmup waiting');
    }
    
    // Specific Issues
    const pix2pixResult = this.debugReport.model_results.find(r => r.model_id === 'timbrooks/instruct-pix2pix');
    if (pix2pixResult && pix2pixResult.status !== 'success') {
      console.log('🚨 CRITICAL: Primary Image-to-Image Model Failing');
      console.log('   → instruct-pix2pix is the main transformation model');
      console.log('   → This directly causes "no transformation" issue');
      this.debugReport.critical_issues.push('Primary image-to-image model not working');
    }
    
    // Actionable Recommendations
    console.log(`\n🔧 ACTIONABLE RECOMMENDATIONS:`);
    
    if (this.successfulModels.length > 0) {
      console.log('1. ✅ USE WORKING MODELS:');
      this.successfulModels.forEach(model => {
        console.log(`   → ${model.name} (${model.id}) - WORKING`);
      });
      this.debugReport.recommendations.push('Update app to prioritize working models');
    }
    
    if (this.debugReport.realistic_test && this.debugReport.realistic_test.status === 'success') {
      console.log('2. ✅ TRANSFORMATION IS POSSIBLE:');
      console.log('   → Hugging Face API can generate AI transformations');
      console.log('   → Problem is likely in app integration, not API');
      this.debugReport.recommendations.push('Debug app-side integration issues');
    }
    
    console.log('3. 🔧 FIX REQUEST FORMAT:');
    console.log('   → Ensure proper base64 image encoding');
    console.log('   → Verify parameter names match model expectations');
    console.log('   → Add proper error handling for model loading states');
    
    console.log('4. 🕐 HANDLE MODEL LOADING:');
    console.log('   → Wait for 503 responses (model loading)');
    console.log('   → Implement retry logic with 15-20 second delays');
    console.log('   → Show "AI warming up" message to users');
    
    console.log('5. 🔄 IMPROVE FALLBACK:');
    console.log('   → Test multiple models in order of success rate');
    console.log('   → Don\'t fall back to local processing immediately');
    console.log('   → Retry failed models after delay');
    
    // Save comprehensive report
    const reportPath = path.join(__dirname, 'hugging-face-debug-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.debugReport, null, 2));
    
    console.log(`\n📄 Complete report saved to: ${reportPath}`);
    
    // Final Assessment
    if (workingCount > 0 && this.debugReport.token_status === 'valid') {
      console.log('\n🎉 CONCLUSION: API is working, fix app integration');
      console.log('   The problem is NOT with Hugging Face API');
      console.log('   Focus on app-side request handling and response processing');
    } else {
      console.log('\n🚨 CONCLUSION: Critical API issues need resolution');
      console.log('   Fix authentication and model access before app changes');
    }
  }

  makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'User-Agent': 'LinkedInHeadshot-Debug/2.0',
          'Accept': '*/*'
        }
      };
      
      if (method !== 'GET' && data) {
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(data);
      }
      
      // Add authorization for Hugging Face endpoints
      if (url.includes('huggingface.co') || url.includes('api-inference.huggingface.co')) {
        options.headers['Authorization'] = `Bearer ${this.token}`;
      }

      const req = https.request(options, (res) => {
        let responseData = Buffer.alloc(0);
        
        res.on('data', (chunk) => {
          responseData = Buffer.concat([responseData, chunk]);
        });
        
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData.toString('binary')
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
}

// Run comprehensive debugging
if (require.main === module) {
  const hfDebugger = new HuggingFaceDebugger();
  hfDebugger.runComprehensiveDebug().catch(console.error);
}

module.exports = HuggingFaceDebugger;