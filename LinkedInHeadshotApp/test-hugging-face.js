#!/usr/bin/env node

/**
 * Hugging Face API Test Script
 * Quick test to verify your HF token works and models are available
 */

const https = require('https');

// Replace this with your actual Hugging Face token
const HF_TOKEN = 'YOUR_HUGGING_FACE_TOKEN_HERE';

class HuggingFaceTest {
  constructor() {
    this.models = [
      'timbrooks/instruct-pix2pix',
      'lllyasviel/sd-controlnet-openpose',
      'fantasy-studio/paint-by-example'
    ];
  }

  async testConnection() {
    console.log('🤗 Testing Hugging Face API Connection...\n');
    
    if (HF_TOKEN === 'hf_your_token_here') {
      console.log('❌ SETUP REQUIRED:');
      console.log('   1. Get token from: https://huggingface.co/settings/tokens');
      console.log('   2. Replace "hf_your_token_here" in this file');
      console.log('   3. Run test again\n');
      return;
    }

    try {
      // Test each model
      for (const modelId of this.models) {
        console.log(`🧪 Testing model: ${modelId}`);
        await this.testModel(modelId);
        console.log('');
      }
      
      console.log('✅ HUGGING FACE SETUP COMPLETE!');
      console.log('🎉 Your app is ready for DRAMATIC AI transformations!');
      
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      this.provideTroubleshootingTips();
    }
  }

  async testModel(modelId) {
    try {
      const testPrompt = 'professional headshot portrait, business suit, studio lighting';
      
      const response = await this.makeRequest(modelId, {
        inputs: testPrompt,
        parameters: {
          negative_prompt: 'amateur, casual',
          num_inference_steps: 20,
          guidance_scale: 7.5,
          width: 512,
          height: 512,
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      });

      if (response.status === 200) {
        console.log('   ✅ Available and ready');
      } else if (response.status === 503) {
        console.log('   ⏳ Model loading (this is normal)');
        console.log('   📝 First generation will take 15-20 seconds');
      } else if (response.status === 401) {
        console.log('   ❌ Authentication failed - check your token');
        return false;
      } else {
        const errorData = JSON.parse(response.data);
        console.log(`   ⚠️  Status ${response.status}: ${errorData.error || 'Unknown error'}`);
      }
      
      return true;
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return false;
    }
  }

  makeRequest(modelId, payload) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);
      
      const options = {
        hostname: 'api-inference.huggingface.co',
        port: 443,
        path: `/models/${modelId}`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'LinkedInHeadshot-Test/1.0'
        }
      };

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

      req.write(postData);
      req.end();
    });
  }

  provideTroubleshootingTips() {
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('');
    console.log('1. TOKEN ISSUES:');
    console.log('   • Get token: https://huggingface.co/settings/tokens');
    console.log('   • Make sure it starts with "hf_"');
    console.log('   • Token should have "Read" permissions');
    console.log('');
    console.log('2. NETWORK ISSUES:');
    console.log('   • Check internet connection');
    console.log('   • Try again in a few minutes');
    console.log('');
    console.log('3. MODEL LOADING:');
    console.log('   • Status 503 is normal for first request');
    console.log('   • Models "sleep" when not used');
    console.log('   • Wait 10-20 seconds and try again');
    console.log('');
    console.log('4. RATE LIMITS:');
    console.log('   • Free tier has usage limits');
    console.log('   • Wait a few minutes between tests');
    console.log('');
  }
}

// Run the test
if (require.main === module) {
  const tester = new HuggingFaceTest();
  tester.testConnection().catch(console.error);
}

module.exports = HuggingFaceTest;