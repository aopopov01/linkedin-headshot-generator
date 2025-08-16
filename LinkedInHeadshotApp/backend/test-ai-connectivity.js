/**
 * AI Provider Connectivity Test
 * Tests API connectivity for Replicate and OpenAI providers
 */

// Load environment variables first
require('dotenv').config();

const { APIIntegrationLayer } = require('./src/services/apiIntegrationLayer.js');
const { IntelligentImageProcessor } = require('./src/services/intelligentImageProcessor.js');

async function testAIConnectivity() {
  console.log('🧪 Testing AI Provider Connectivity...\n');
  
  try {
    // Test API Integration Layer
    console.log('1. Testing API Integration Layer...');
    const apiIntegration = new APIIntegrationLayer();
    const providerHealth = await apiIntegration.healthCheckProviders();
    
    console.log('📊 Provider Health Status:');
    Object.entries(providerHealth).forEach(([provider, health]) => {
      const status = health.status === 'healthy' ? '✅' : 
                    health.status === 'unavailable' ? '⚠️' : '❌';
      console.log(`  ${status} ${provider}: ${health.status}`);
      if (health.reason) {
        console.log(`     Reason: ${health.reason}`);
      }
    });
    
    // Test Image Processor
    console.log('\n2. Testing Intelligent Image Processor...');
    const imageProcessor = new IntelligentImageProcessor();
    const processorHealth = await imageProcessor.healthCheck();
    
    console.log('🔍 Image Processor Status:');
    console.log(`  Status: ${processorHealth.status}`);
    console.log(`  Available Providers: ${processorHealth.availableProviders.join(', ')}`);
    console.log(`  Processing Metrics: ${JSON.stringify(processorHealth.metrics, null, 2)}`);
    
    // Test Replicate API key validation
    console.log('\n3. Testing Replicate API Key...');
    const replicateKey = process.env.REPLICATE_API_TOKEN;
    if (replicateKey && replicateKey !== 'r8_placeholder_key') {
      console.log('✅ Replicate API key is configured');
      
      // Test actual Replicate connectivity (simplified test)
      try {
        const response = await fetch('https://api.replicate.com/v1/models', {
          headers: {
            'Authorization': `Token ${replicateKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          console.log('✅ Replicate API is accessible');
        } else {
          console.log(`⚠️ Replicate API returned: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ Replicate API test failed: ${error.message}`);
      }
    } else {
      console.log('❌ Replicate API key not properly configured');
    }
    
    // Test OpenAI API key validation
    console.log('\n4. Testing OpenAI API Key...');
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && openaiKey !== 'sk-placeholder_openai_key_configure_for_production') {
      console.log('✅ OpenAI API key is configured');
      
      // Test actual OpenAI connectivity (simplified test)
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          console.log('✅ OpenAI API is accessible');
        } else {
          console.log(`⚠️ OpenAI API returned: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ OpenAI API test failed: ${error.message}`);
      }
    } else {
      console.log('⚠️ OpenAI API key is placeholder - needs real key for production');
    }
    
    // Summary
    console.log('\n📋 AI Connectivity Summary:');
    const availableProviders = imageProcessor.getAvailableProviders();
    console.log(`  Available AI Providers: ${availableProviders.length}`);
    console.log(`  Provider Details: ${availableProviders.join(', ')}`);
    
    const hasWorkingAI = availableProviders.includes('replicate') || availableProviders.includes('openai');
    const hasLocalFallback = availableProviders.includes('local');
    
    if (hasWorkingAI) {
      console.log('✅ AI enhancement is available');
    } else if (hasLocalFallback) {
      console.log('⚠️ Only local processing available (no AI providers configured)');
    } else {
      console.log('❌ No image processing available');
    }
    
    console.log('\n🎯 Ready for AI-powered image processing!');
    
  } catch (error) {
    console.error('❌ AI connectivity test failed:', error);
  }
}

// Run the test
testAIConnectivity().then(() => {
  console.log('\n✨ AI connectivity test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});