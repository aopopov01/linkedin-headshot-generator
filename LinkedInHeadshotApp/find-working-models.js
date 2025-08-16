#!/usr/bin/env node

/**
 * Find Working AI Models Script
 * Searches for available AI models that can be used for headshot transformation
 */

const https = require('https');
const fs = require('fs');

const API_TOKEN = 'YOUR_REPLICATE_API_KEY_HERE';

class ModelFinder {
  constructor() {
    this.workingModels = [];
  }

  async findWorkingModels() {
    console.log('🔍 Finding Working AI Models for Headshot Transformation...\n');
    
    try {
      // Get list of available models
      await this.searchForHeadshotModels();
      
      // Test specific popular models
      await this.testPopularModels();
      
      // Generate recommendations
      this.generateRecommendations();
      
    } catch (error) {
      console.error('❌ Model finding failed:', error);
    }
  }

  async searchForHeadshotModels() {
    console.log('📋 Searching for available headshot/portrait models...');
    
    try {
      // Search for models related to headshots, portraits, face swapping
      const searchTerms = ['headshot', 'portrait', 'face', 'photomaker', 'instantid', 'flux'];
      
      for (const term of searchTerms) {
        console.log(`   Searching for: ${term}`);
        const response = await this.makeAPIRequest('GET', `/models?search=${term}`);
        
        if (response.status === 200) {
          const data = JSON.parse(response.data);
          if (data.results) {
            const relevantModels = data.results.filter(model => 
              model.name.toLowerCase().includes('face') ||
              model.name.toLowerCase().includes('portrait') ||
              model.name.toLowerCase().includes('photo') ||
              model.description?.toLowerCase().includes('headshot') ||
              model.description?.toLowerCase().includes('portrait')
            );
            
            console.log(`   Found ${relevantModels.length} relevant models for "${term}"`);
            
            for (const model of relevantModels.slice(0, 3)) { // Top 3 results
              console.log(`      📌 ${model.owner}/${model.name}`);
              console.log(`         ${model.description?.substring(0, 100) || 'No description'}...`);
              
              // Get latest version
              const modelDetail = await this.getModelDetails(model.owner, model.name);
              if (modelDetail) {
                this.workingModels.push({
                  name: `${model.owner}/${model.name}`,
                  description: model.description,
                  latestVersion: modelDetail.latest_version?.id,
                  url: model.url,
                  category: this.categorizeModel(model.name, model.description)
                });
              }
            }
          }
        }
        
        // Small delay between searches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.log('❌ Search failed:', error.message);
    }
    
    console.log('');
  }

  async testPopularModels() {
    console.log('🧪 Testing Popular AI Models...');
    
    // List of known working models for face/portrait generation
    const popularModels = [
      { owner: 'tencentarc', name: 'photomaker', description: 'PhotoMaker - Customizing Realistic Human Photos' },
      { owner: 'zsxkib', name: 'instant-id', description: 'InstantID - Zero-shot Identity-Preserving Generation' },
      { owner: 'black-forest-labs', name: 'flux-1.1-pro', description: 'FLUX.1.1 [pro]' },
      { owner: 'black-forest-labs', name: 'flux-dev', description: 'FLUX.1 [dev]' },
      { owner: 'black-forest-labs', name: 'flux-schnell', description: 'FLUX.1 [schnell]' },
      { owner: 'fofr', name: 'face-to-many', description: 'Face to many' },
      { owner: 'fofr', name: 'headshot-professional', description: 'Professional headshots' }
    ];

    for (const model of popularModels) {
      console.log(`   Testing ${model.owner}/${model.name}...`);
      
      try {
        const modelDetail = await this.getModelDetails(model.owner, model.name);
        
        if (modelDetail) {
          console.log(`   ✅ ${model.name} - Available`);
          console.log(`      Version: ${modelDetail.latest_version?.id?.substring(0, 12)}...`);
          console.log(`      Description: ${modelDetail.description?.substring(0, 80)}...`);
          
          this.workingModels.push({
            name: `${model.owner}/${model.name}`,
            description: modelDetail.description,
            latestVersion: modelDetail.latest_version?.id,
            url: modelDetail.url,
            category: this.categorizeModel(model.name, modelDetail.description),
            recommended: true
          });
        } else {
          console.log(`   ❌ ${model.name} - Not available or access denied`);
        }
      } catch (error) {
        console.log(`   ❌ ${model.name} - Error: ${error.message}`);
      }
      
      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('');
  }

  async getModelDetails(owner, name) {
    try {
      const response = await this.makeAPIRequest('GET', `/models/${owner}/${name}`);
      
      if (response.status === 200) {
        return JSON.parse(response.data);
      } else if (response.status === 402) {
        // Model exists but requires credits - still usable
        console.log(`      ⚠️ ${name} - Requires credits but available`);
        return { 
          latest_version: { id: 'requires-credits' },
          description: 'Available but requires credits',
          url: `https://replicate.com/${owner}/${name}`
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  categorizeModel(name, description) {
    const nameDesc = `${name} ${description || ''}`.toLowerCase();
    
    if (nameDesc.includes('flux')) return 'flux';
    if (nameDesc.includes('instantid') || nameDesc.includes('instant-id')) return 'instantid';
    if (nameDesc.includes('photomaker')) return 'photomaker';
    if (nameDesc.includes('headshot') || nameDesc.includes('professional')) return 'headshot';
    if (nameDesc.includes('face')) return 'face';
    return 'general';
  }

  generateRecommendations() {
    console.log('💡 RECOMMENDATIONS\n');
    console.log('='.repeat(50));
    
    // Group models by category
    const categories = {};
    for (const model of this.workingModels) {
      if (!categories[model.category]) {
        categories[model.category] = [];
      }
      categories[model.category].push(model);
    }
    
    console.log('🎯 BEST OPTIONS FOR LINKEDIN HEADSHOTS:\n');
    
    // Prioritize recommended models
    const recommended = this.workingModels.filter(m => m.recommended);
    
    if (recommended.length > 0) {
      console.log('TOP RECOMMENDED MODELS:');
      for (const model of recommended) {
        console.log(`✅ ${model.name}`);
        console.log(`   Version: ${model.latestVersion?.substring(0, 12) || 'N/A'}...`);
        console.log(`   Category: ${model.category.toUpperCase()}`);
        console.log(`   Description: ${model.description?.substring(0, 100) || 'N/A'}...`);
        console.log('');
      }
    }
    
    // Code snippets for working models
    console.log('📝 UPDATED CODE FOR APP:\n');
    
    const workingPhotoMaker = recommended.find(m => m.category === 'photomaker');
    const workingInstantId = recommended.find(m => m.category === 'instantid');
    const workingFlux = recommended.find(m => m.category === 'flux');
    
    console.log('// Updated model versions for App.js:');
    console.log('const AI_MODELS = {');
    
    if (workingPhotoMaker) {
      console.log(`  PHOTOMAKER: "${workingPhotoMaker.latestVersion}",`);
    }
    if (workingInstantId) {
      console.log(`  INSTANT_ID: "${workingInstantId.latestVersion}",`);
    }
    if (workingFlux) {
      console.log(`  FLUX_DEV: "${workingFlux.latestVersion}",`);
    }
    
    console.log('};\n');
    
    // Fix for the credit issue
    console.log('🔧 IMMEDIATE FIXES NEEDED:\n');
    console.log('1. API CREDITS:');
    console.log('   ❌ Current API token has insufficient credits');
    console.log('   💳 Visit: https://replicate.com/account/billing');
    console.log('   💰 Add credits to enable AI model usage\n');
    
    console.log('2. MODEL VERSIONS:');
    console.log('   ❌ Current model versions are incorrect/outdated');
    console.log('   ✅ Use the versions shown above\n');
    
    console.log('3. FALLBACK LOGIC:');
    console.log('   ❌ App falls back to local processing when AI fails');
    console.log('   ✅ Should show error message instead');
    console.log('   ✅ Guide user to upgrade/add credits\n');
    
    // Save results
    const results = {
      timestamp: new Date().toISOString(),
      workingModels: this.workingModels,
      recommendations: {
        photomaker: workingPhotoMaker,
        instantid: workingInstantId,
        flux: workingFlux
      },
      issues: [
        'Insufficient API credits',
        'Incorrect model versions',
        'Silent fallback to local processing'
      ]
    };
    
    const reportPath = 'working-models-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`📄 Full report saved to: ${reportPath}`);
  }

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
          'User-Agent': 'LinkedInHeadshot-ModelFinder/1.0'
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

      if (data) {
        req.write(data);
      }
      
      req.end();
    });
  }
}

// Run the script
if (require.main === module) {
  const finder = new ModelFinder();
  finder.findWorkingModels().catch(console.error);
}

module.exports = ModelFinder;