// Test Suite for Dramatic AI Transformation System
// Validates the complete transformation pipeline and AI service integration

import aiService from '../aiService';
import dramaticTransformationPipeline from '../dramaticTransformationPipeline';
import { StyleTemplateUtils } from '../../utils/styleTemplates';
import { AttireTemplateUtils } from '../../config/professionalAttireTemplates';

// Mock image processing utilities
jest.mock('../../utils/imageProcessing', () => ({
  resizeForProcessing: jest.fn().mockResolvedValue({
    uri: 'mock://processed-image.jpg',
    dimensions: { width: 1024, height: 1024 }
  }),
  uploadToCloudinary: jest.fn().mockResolvedValue({
    success: true,
    url: 'https://cloudinary.com/mock-image.jpg'
  })
}));

// Mock axios for API calls
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn().mockResolvedValue({
      data: {
        id: 'mock-prediction-id',
        status: 'starting',
        version: 'mock-version'
      }
    }),
    get: jest.fn().mockResolvedValue({
      data: {
        id: 'mock-prediction-id',
        status: 'succeeded',
        output: [
          'https://replicate.delivery/result1.jpg',
          'https://replicate.delivery/result2.jpg',
          'https://replicate.delivery/result3.jpg',
          'https://replicate.delivery/result4.jpg'
        ]
      }
    })
  }))
}));

describe('Dramatic AI Transformation System', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Enhanced AI Service', () => {
    
    test('should select optimal AI model based on style template', () => {
      // Test executive style selects FLUX Dev
      const executiveModel = aiService.selectOptimalModel('executive', { premium: true });
      expect(executiveModel.name).toBe('FLUX.1 Dev');

      // Test healthcare style selects InstantID
      const healthcareModel = aiService.selectOptimalModel('healthcare');
      expect(healthcareModel.name).toBe('InstantID');

      // Test startup style selects ControlNet
      const startupModel = aiService.selectOptimalModel('startup');
      expect(startupModel.name).toBe('Stable Diffusion ControlNet');
    });

    test('should generate dramatic transformation configuration', () => {
      const config = aiService.getDramaticTransformationConfig('executive');
      
      expect(config).toHaveProperty('prompt');
      expect(config).toHaveProperty('negativePrompt');
      expect(config.prompt).toContain('premium dark navy business suit');
      expect(config.prompt).toContain('CEO');
      expect(config.styleStrength).toBeGreaterThan(0.9);
      expect(config.numSteps).toBeGreaterThanOrEqual(80);
    });

    test('should create model-specific API payload', () => {
      const mockModel = { name: 'FLUX.1 Dev', version: 'mock-version' };
      const mockConfig = {
        prompt: 'test prompt',
        negativePrompt: 'test negative',
        numSteps: 80,
        guidanceScale: 7.5,
        strength: 0.8
      };

      const payload = aiService.createModelSpecificPayload(
        mockModel,
        'https://test-image.jpg',
        mockConfig
      );

      expect(payload).toHaveProperty('version', 'mock-version');
      expect(payload.input).toHaveProperty('prompt', 'test prompt');
      expect(payload.input).toHaveProperty('image', 'https://test-image.jpg');
      expect(payload.input).toHaveProperty('num_inference_steps', 80);
    });

    test('should process dramatic transformation successfully', async () => {
      const result = await aiService.processImageToHeadshot(
        'mock://input-image.jpg',
        'executive',
        { dramatic: true }
      );

      expect(result).toHaveProperty('id', 'mock-prediction-id');
      expect(result).toHaveProperty('selectedModel');
      expect(result).toHaveProperty('transformationType', 'dramatic_professional');
      expect(result.styleTemplate).toBe('executive');
    });

    test('should handle batch processing multiple styles', async () => {
      const batchResult = await aiService.batchProcessMultipleStyles(
        'mock://input-image.jpg',
        ['executive', 'creative', 'healthcare']
      );

      expect(batchResult).toHaveProperty('success', true);
      expect(batchResult).toHaveProperty('batchId');
      expect(batchResult.results).toHaveLength(3);
      expect(batchResult.totalStyles).toBe(3);
    });

  });

  describe('Professional Attire Templates', () => {

    test('should generate transformation prompts for all styles', () => {
      const styles = ['executive', 'creative', 'healthcare', 'finance', 'startup', 'tech'];
      
      styles.forEach(styleId => {
        const prompt = AttireTemplateUtils.generateTransformationPrompt(styleId);
        
        expect(prompt).toHaveProperty('mainPrompt');
        expect(prompt).toHaveProperty('negativePrompt');
        expect(prompt).toHaveProperty('metadata');
        expect(prompt.mainPrompt).toContain('ultra-realistic');
        expect(prompt.mainPrompt).toContain('8K');
        expect(prompt.metadata.styleId).toBe(styleId);
      });
    });

    test('should provide gender-specific clothing configurations', () => {
      const maleConfig = AttireTemplateUtils.getAttireConfig('executive', 'male');
      const femaleConfig = AttireTemplateUtils.getAttireConfig('executive', 'female');
      const neutralConfig = AttireTemplateUtils.getAttireConfig('executive', 'neutral');

      expect(maleConfig.selectedClothing).toHaveProperty('primary');
      expect(femaleConfig.selectedClothing).toHaveProperty('primary');
      expect(typeof neutralConfig.selectedClothing).toBe('string');
    });

    test('should recommend appropriate styles for industries', () => {
      const techStyles = AttireTemplateUtils.getStylesForIndustry('Technology');
      const financeStyles = AttireTemplateUtils.getStylesForIndustry('Finance');

      expect(techStyles.length).toBeGreaterThan(0);
      expect(financeStyles.length).toBeGreaterThan(0);
      expect(techStyles.some(style => style.id === 'startup')).toBe(true);
      expect(financeStyles.some(style => style.id === 'finance')).toBe(true);
    });

  });

  describe('Enhanced Style Templates', () => {

    test('should support dramatic transformation settings', () => {
      const executiveStyle = StyleTemplateUtils.getStyleById('executive');
      const corporateStyle = StyleTemplateUtils.getStyleById('corporate');

      expect(executiveStyle).toHaveProperty('dramaticSettings');
      expect(corporateStyle).toHaveProperty('dramaticSettings');
      expect(executiveStyle.dramaticSettings.dramaticLevel).toBe(10);
      expect(executiveStyle.dramaticSettings.clothingTransformation).toBe(true);
    });

    test('should generate dramatic configuration', () => {
      const dramaticConfig = StyleTemplateUtils.getDramaticConfig('executive', {
        gender: 'neutral',
        numOutputs: 6
      });

      expect(dramaticConfig).toHaveProperty('transformationType', 'dramatic_professional');
      expect(dramaticConfig.numOutputs).toBe(6);
      expect(dramaticConfig.numSteps).toBeGreaterThanOrEqual(100);
      expect(dramaticConfig.strength).toBeGreaterThanOrEqual(0.8);
    });

    test('should check dramatic transformation support', () => {
      expect(StyleTemplateUtils.supportsDramaticTransformation('executive')).toBe(true);
      expect(StyleTemplateUtils.supportsDramaticTransformation('corporate')).toBe(true);
    });

    test('should calculate processing time estimates', () => {
      const executiveTime = StyleTemplateUtils.getDramaticProcessingTime('executive', 6);
      const corporateTime = StyleTemplateUtils.getDramaticProcessingTime('corporate', 4);

      expect(typeof executiveTime).toBe('number');
      expect(typeof corporateTime).toBe('number');
      expect(executiveTime).toBeGreaterThan(corporateTime); // Executive should take longer
    });

  });

  describe('Dramatic Transformation Pipeline', () => {

    test('should provide processing steps configuration', () => {
      const progressSteps = dramaticTransformationPipeline.getProgressSteps();

      expect(progressSteps).toBeInstanceOf(Array);
      expect(progressSteps.length).toBe(6);
      expect(progressSteps[0]).toHaveProperty('step', 1);
      expect(progressSteps[0]).toHaveProperty('title');
      expect(progressSteps[0]).toHaveProperty('estimatedTime');
    });

    test('should analyze source image successfully', async () => {
      const analysisResult = await dramaticTransformationPipeline.analyzeSourceImage(
        'mock://input-image.jpg',
        'executive',
        {}
      );

      expect(analysisResult).toHaveProperty('success', true);
      expect(analysisResult).toHaveProperty('processedImage');
      expect(analysisResult).toHaveProperty('faceAnalysis');
      expect(analysisResult.faceAnalysis.faceDetected).toBe(true);
    });

    test('should execute complete dramatic transformation', async () => {
      // Mock the pipeline execution
      const mockPipelineResult = {
        success: true,
        pipeline: 'dramatic_transformation',
        transformationResult: {
          finalResults: [
            { polished: 'https://result1.jpg', qualityScore: 9.5 },
            { polished: 'https://result2.jpg', qualityScore: 9.2 }
          ],
          qualityScore: 9.35,
          totalProcessingTime: 180000
        },
        metadata: {
          styleTemplate: 'executive',
          dramaticLevel: 10
        }
      };

      // Spy on the pipeline method
      jest.spyOn(dramaticTransformationPipeline, 'executeDramaticTransformation')
        .mockResolvedValue(mockPipelineResult);

      const result = await dramaticTransformationPipeline.executeDramaticTransformation(
        'mock://input-image.jpg',
        'executive',
        { dramatic: true }
      );

      expect(result.success).toBe(true);
      expect(result.pipeline).toBe('dramatic_transformation');
      expect(result.metadata.dramaticLevel).toBe(10);
    });

    test('should handle batch processing with pipeline', async () => {
      const batchResult = await dramaticTransformationPipeline.batchProcessWithPipeline(
        'mock://input-image.jpg',
        ['executive', 'creative'],
        {}
      );

      expect(batchResult).toHaveProperty('success', true);
      expect(batchResult).toHaveProperty('pipeline', true);
      expect(batchResult.totalStyles).toBe(2);
    });

  });

  describe('Integration Tests', () => {

    test('should integrate AI service with dramatic pipeline', async () => {
      const result = await aiService.processImageWithDramaticTransformation(
        'mock://input-image.jpg',
        'executive',
        { ultimate: true }
      );

      expect(result).toHaveProperty('ultimateTransformation', true);
      expect(result).toHaveProperty('dramaticLevel', 'maximum');
      expect(result).toHaveProperty('processingType', 'pipeline_dramatic');
    });

    test('should fallback gracefully when pipeline fails', async () => {
      // Mock pipeline failure
      jest.spyOn(dramaticTransformationPipeline, 'executeDramaticTransformation')
        .mockRejectedValue(new Error('Pipeline failed'));

      const result = await aiService.processImageWithDramaticTransformation(
        'mock://input-image.jpg',
        'executive'
      );

      // Should fallback to standard dramatic processing
      expect(result).toHaveProperty('id', 'mock-prediction-id');
      expect(result).toHaveProperty('transformationType', 'dramatic_professional');
    });

    test('should process with dramatic comparison successfully', async () => {
      const comparisonResult = await aiService.processWithDramaticComparison(
        'mock://input-image.jpg',
        'executive'
      );

      expect(comparisonResult).toHaveProperty('success', true);
      expect(comparisonResult).toHaveProperty('primaryStyle');
      expect(comparisonResult).toHaveProperty('processingType');
      expect(comparisonResult.primaryStyle.style).toBe('executive');
    });

  });

  describe('Error Handling', () => {

    test('should handle network errors gracefully', async () => {
      const networkError = new Error('Network Error');
      networkError.response = null;
      networkError.request = { status: 0 };

      const handledError = aiService.handleError(networkError);
      expect(handledError.message).toContain('Network error');
    });

    test('should handle API rate limiting', async () => {
      const rateLimitError = new Error('Rate Limited');
      rateLimitError.response = { 
        status: 429, 
        data: { detail: 'Too many requests' }
      };

      const handledError = aiService.handleError(rateLimitError);
      expect(handledError.message).toContain('Too many requests');
    });

    test('should handle invalid API credentials', async () => {
      const authError = new Error('Unauthorized');
      authError.response = { 
        status: 401, 
        data: { detail: 'Invalid credentials' }
      };

      const handledError = aiService.handleError(authError);
      expect(handledError.message).toContain('Invalid API credentials');
    });

  });

  describe('Performance & Quality', () => {

    test('should meet quality standards for dramatic transformations', () => {
      const styles = ['executive', 'healthcare', 'finance'];
      
      styles.forEach(styleId => {
        const config = aiService.getDramaticTransformationConfig(styleId);
        
        // Quality requirements
        expect(config.numSteps).toBeGreaterThanOrEqual(80);
        expect(config.styleStrength).toBeGreaterThanOrEqual(0.8);
        expect(config.guidanceScale).toBeGreaterThanOrEqual(7.0);
      });
    });

    test('should provide realistic processing time estimates', () => {
      const executiveTime = StyleTemplateUtils.getDramaticProcessingTime('executive', 6);
      const corporateTime = StyleTemplateUtils.getDramaticProcessingTime('corporate', 4);

      // Should be reasonable processing times (2-10 minutes)
      expect(executiveTime).toBeGreaterThan(120000); // At least 2 minutes
      expect(executiveTime).toBeLessThan(600000); // Less than 10 minutes
      expect(corporateTime).toBeLessThan(executiveTime);
    });

  });

});

// Test helper functions
const TestHelpers = {
  
  // Create mock image URI
  createMockImageUri: () => 'mock://test-image-' + Date.now() + '.jpg',
  
  // Create mock API response
  createMockApiResponse: (status = 'succeeded', outputs = null) => ({
    id: 'test-prediction-' + Math.random().toString(36).substr(2, 9),
    status,
    output: outputs || [
      'https://replicate.delivery/result1.jpg',
      'https://replicate.delivery/result2.jpg'
    ],
    created_at: new Date().toISOString(),
    completed_at: status === 'succeeded' ? new Date().toISOString() : null
  }),

  // Validate transformation result structure
  validateTransformationResult: (result) => {
    expect(result).toHaveProperty('success');
    if (result.success) {
      expect(result).toHaveProperty('outputs');
      expect(result.outputs).toBeInstanceOf(Array);
      expect(result.outputs.length).toBeGreaterThan(0);
    }
    return result;
  }

};

export { TestHelpers };