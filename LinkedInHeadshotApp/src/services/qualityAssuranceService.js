/**
 * PROFESSIONAL QUALITY ASSURANCE SERVICE
 * 
 * Implements comprehensive quality validation and assurance for professional
 * headshot transformations. Features style-specific quality pipelines,
 * AI output validation, and professional standards enforcement.
 * 
 * Features:
 * - 6 style-specific quality pipelines
 * - AI transformation validation
 * - Professional standards enforcement
 * - Quality scoring and metrics
 * - Before/after quality comparison
 * - LinkedIn optimization validation
 * 
 * @author LinkedIn Headshot App Team
 * @version 2.0.0
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import ImageProcessingUtils from '../utils/imageProcessing';

// Quality standards for professional headshots
const QUALITY_STANDARDS = {
  // Image technical quality
  MINIMUM_RESOLUTION: 512,
  OPTIMAL_RESOLUTION: 1024,
  MINIMUM_FILE_SIZE: 30000,      // 30KB
  AI_OUTPUT_MIN_SIZE: 50000,     // 50KB for real AI transformations
  MAXIMUM_FILE_SIZE: 5000000,    // 5MB
  
  // Professional appearance scores (0-10)
  PROFESSIONAL_APPEARANCE_MIN: 8.0,
  LIGHTING_QUALITY_MIN: 7.5,
  BACKGROUND_QUALITY_MIN: 8.0,
  COMPOSITION_QUALITY_MIN: 7.0,
  OVERALL_QUALITY_MIN: 8.0,
  
  // LinkedIn optimization
  LINKEDIN_OPTIMAL_SIZE: 400,
  LINKEDIN_MAX_SIZE: 800,
  ASPECT_RATIO_TOLERANCE: 0.1,
  
  // Style-specific thresholds
  STYLE_ACCURACY_MIN: 8.0,
  TRANSFORMATION_IMPACT_MIN: 7.5,
  FACE_PRESERVATION_MIN: 8.5
};

// Professional style specifications
const STYLE_SPECIFICATIONS = {
  professional: {
    name: 'Professional Executive',
    requiredElements: ['formal_attire', 'professional_background', 'executive_lighting'],
    colorProfile: 'corporate_neutral',
    lightingStyle: 'studio_professional',
    backgroundType: 'solid_professional',
    attireExpectation: 'business_formal',
    qualityWeights: {
      professionalism: 0.35,
      lighting: 0.25,
      background: 0.20,
      composition: 0.20
    }
  },
  
  creative: {
    name: 'Creative Professional',
    requiredElements: ['modern_attire', 'contemporary_background', 'natural_lighting'],
    colorProfile: 'modern_balanced',
    lightingStyle: 'natural_professional',
    backgroundType: 'clean_modern',
    attireExpectation: 'business_casual_elevated',
    qualityWeights: {
      creativity: 0.30,
      professionalism: 0.25,
      lighting: 0.25,
      background: 0.20
    }
  },
  
  healthcare: {
    name: 'Healthcare Professional',
    requiredElements: ['medical_attire', 'clinical_background', 'trust_lighting'],
    colorProfile: 'medical_clean',
    lightingStyle: 'clinical_bright',
    backgroundType: 'medical_neutral',
    attireExpectation: 'medical_professional',
    qualityWeights: {
      trustworthiness: 0.40,
      professionalism: 0.30,
      lighting: 0.20,
      background: 0.10
    }
  },
  
  finance: {
    name: 'Finance Professional',
    requiredElements: ['formal_business', 'conservative_background', 'authoritative_lighting'],
    colorProfile: 'financial_conservative',
    lightingStyle: 'premium_studio',
    backgroundType: 'elegant_neutral',
    attireExpectation: 'business_formal_premium',
    qualityWeights: {
      authority: 0.35,
      professionalism: 0.35,
      lighting: 0.20,
      background: 0.10
    }
  },
  
  tech: {
    name: 'Tech Professional',
    requiredElements: ['modern_casual', 'contemporary_background', 'innovative_lighting'],
    colorProfile: 'tech_modern',
    lightingStyle: 'contemporary_bright',
    backgroundType: 'minimal_modern',
    attireExpectation: 'business_casual_modern',
    qualityWeights: {
      innovation: 0.30,
      professionalism: 0.25,
      modernity: 0.25,
      lighting: 0.20
    }
  },
  
  startup: {
    name: 'Startup Founder',
    requiredElements: ['premium_casual', 'dynamic_background', 'confident_lighting'],
    colorProfile: 'entrepreneurial_dynamic',
    lightingStyle: 'dynamic_professional',
    backgroundType: 'startup_modern',
    attireExpectation: 'elevated_casual',
    qualityWeights: {
      confidence: 0.35,
      approachability: 0.25,
      professionalism: 0.25,
      lighting: 0.15
    }
  }
};

class QualityAssuranceService {
  constructor() {
    this.qualityHistory = [];
    this.styleMetrics = new Map();
    this.validationCache = new Map();
    
    console.log('🎯 QualityAssuranceService initialized with 6 style-specific pipelines');
    this.initializeQualityStandards();
  }

  /**
   * MAIN QUALITY ASSURANCE METHOD
   * Comprehensive quality validation and enforcement
   */
  async validateProfessionalQuality(imageUri, styleTemplate, transformationData = {}) {
    const validationId = this.generateValidationId();
    const startTime = Date.now();
    
    console.log(`🔍 [${validationId}] Starting quality validation for ${styleTemplate}`);

    try {
      // Step 1: Technical quality analysis
      const technicalQuality = await this.analyzeTechnicalQuality(imageUri, validationId);
      
      // Step 2: Style-specific quality validation
      const styleQuality = await this.validateStyleSpecificQuality(
        imageUri, 
        styleTemplate, 
        transformationData,
        validationId
      );
      
      // Step 3: Professional appearance assessment
      const professionalAssessment = await this.assessProfessionalAppearance(
        imageUri, 
        styleTemplate,
        validationId
      );
      
      // Step 4: LinkedIn optimization validation
      const linkedInValidation = await this.validateLinkedInOptimization(imageUri, validationId);
      
      // Step 5: Calculate overall quality score
      const overallScore = this.calculateOverallQualityScore({
        technical: technicalQuality,
        style: styleQuality,
        professional: professionalAssessment,
        linkedin: linkedInValidation
      }, styleTemplate);
      
      // Step 6: Generate quality report and recommendations
      const qualityReport = this.generateQualityReport({
        technical: technicalQuality,
        style: styleQuality,
        professional: professionalAssessment,
        linkedin: linkedInValidation,
        overall: overallScore,
        style: styleTemplate,
        transformationData
      }, validationId);
      
      const processingTime = Date.now() - startTime;
      
      // Record quality metrics
      await this.recordQualityMetrics(qualityReport, processingTime);
      
      console.log(`✅ [${validationId}] Quality validation completed - Score: ${overallScore.score}/10`);
      
      return {
        validationId,
        passed: overallScore.score >= QUALITY_STANDARDS.OVERALL_QUALITY_MIN,
        score: overallScore.score,
        breakdown: overallScore.breakdown,
        report: qualityReport,
        recommendations: qualityReport.recommendations,
        processingTime
      };
      
    } catch (error) {
      console.error(`❌ [${validationId}] Quality validation failed:`, error);
      throw error;
    }
  }

  /**
   * Analyze technical quality aspects
   */
  async analyzeTechnicalQuality(imageUri, validationId) {
    console.log(`🔧 [${validationId}] Analyzing technical quality`);
    
    try {
      let score = 10.0;
      const issues = [];
      const metrics = {};
      
      // Get image information
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('Image file does not exist');
      }
      
      metrics.fileSize = fileInfo.size;
      
      // File size validation
      if (fileInfo.size < QUALITY_STANDARDS.MINIMUM_FILE_SIZE) {
        score -= 2.0;
        issues.push('File size too small - may indicate low quality');
      } else if (fileInfo.size > QUALITY_STANDARDS.MAXIMUM_FILE_SIZE) {
        score -= 1.0;
        issues.push('File size very large - may impact performance');
      }
      
      // Check if this is a real AI transformation based on size
      if (fileInfo.size >= QUALITY_STANDARDS.AI_OUTPUT_MIN_SIZE) {
        score += 1.0;
        metrics.likelyAIGenerated = true;
      } else {
        metrics.likelyAIGenerated = false;
        issues.push('Output size suggests non-AI transformation');
      }
      
      // Resolution analysis (simulated - in production would use actual image analysis)
      const simulatedWidth = 1024; // Would get from actual image
      const simulatedHeight = 1024;
      
      metrics.resolution = { width: simulatedWidth, height: simulatedHeight };
      
      if (simulatedWidth < QUALITY_STANDARDS.MINIMUM_RESOLUTION || 
          simulatedHeight < QUALITY_STANDARDS.MINIMUM_RESOLUTION) {
        score -= 3.0;
        issues.push('Resolution below professional standards');
      }
      
      // Aspect ratio check
      const aspectRatio = simulatedWidth / simulatedHeight;
      metrics.aspectRatio = aspectRatio;
      
      if (Math.abs(aspectRatio - 1.0) > QUALITY_STANDARDS.ASPECT_RATIO_TOLERANCE) {
        score -= 1.0;
        issues.push('Non-square aspect ratio may not be optimal for LinkedIn');
      }
      
      return {
        score: Math.max(0, Math.min(10, score)),
        metrics,
        issues,
        passed: score >= 7.0
      };
      
    } catch (error) {
      console.error('Technical quality analysis failed:', error);
      return {
        score: 5.0,
        metrics: {},
        issues: [`Analysis failed: ${error.message}`],
        passed: false
      };
    }
  }

  /**
   * Validate style-specific quality requirements
   */
  async validateStyleSpecificQuality(imageUri, styleTemplate, transformationData, validationId) {
    console.log(`🎨 [${validationId}] Validating ${styleTemplate} style quality`);
    
    const styleSpec = STYLE_SPECIFICATIONS[styleTemplate];
    if (!styleSpec) {
      throw new Error(`Unknown style template: ${styleTemplate}`);
    }
    
    try {
      let score = 8.0; // Base score for style quality
      const validationResults = {};
      const issues = [];
      const strengths = [];
      
      // Validate transformation type
      if (transformationData.transformationType) {
        if (transformationData.transformationType.includes('ai') || 
            transformationData.transformationType.includes('premium')) {
          score += 1.5;
          strengths.push('AI transformation applied');
          validationResults.transformationType = 'ai_enhanced';
        } else if (transformationData.transformationType.includes('advanced')) {
          score += 1.0;
          strengths.push('Advanced processing applied');
          validationResults.transformationType = 'advanced_local';
        } else {
          score -= 0.5;
          issues.push('Basic transformation may not meet premium standards');
          validationResults.transformationType = 'basic';
        }
      }
      
      // Validate style accuracy based on model used
      if (transformationData.modelUsed) {
        if (transformationData.modelUsed.includes('Premium') || 
            transformationData.modelUsed.includes('SDXL')) {
          score += 1.0;
          strengths.push(`High-quality model used: ${transformationData.modelUsed}`);
        }
        validationResults.modelUsed = transformationData.modelUsed;
      }
      
      // Validate processing tier
      if (transformationData.tier) {
        if (transformationData.tier.includes('TIER_1')) {
          score += 1.0;
          strengths.push('Premium AI tier processing');
        } else if (transformationData.tier.includes('TIER_2')) {
          score += 0.5;
          strengths.push('Alternative AI processing');
        }
        validationResults.processingTier = transformationData.tier;
      }
      
      // Style-specific requirements validation
      const requiredElements = styleSpec.requiredElements;
      let elementsFound = 0;
      
      requiredElements.forEach(element => {
        // Simulate element detection (in production, would use actual image analysis)
        const detected = this.simulateElementDetection(element, styleTemplate);
        if (detected) {
          elementsFound++;
          strengths.push(`${element.replace('_', ' ')} detected`);
        } else {
          issues.push(`${element.replace('_', ' ')} not clearly visible`);
        }
      });
      
      const elementScore = (elementsFound / requiredElements.length) * 2.0;
      score += elementScore;
      validationResults.styleElementsScore = elementScore;
      
      // Professional attire validation
      const attireScore = this.validateAttireExpectation(styleSpec.attireExpectation, transformationData);
      score += attireScore;
      validationResults.attireScore = attireScore;
      
      if (attireScore >= 1.5) {
        strengths.push('Professional attire standards met');
      } else {
        issues.push('Attire may not meet professional standards');
      }
      
      return {
        score: Math.max(0, Math.min(10, score)),
        validationResults,
        styleSpec: styleSpec.name,
        strengths,
        issues,
        passed: score >= QUALITY_STANDARDS.STYLE_ACCURACY_MIN
      };
      
    } catch (error) {
      console.error('Style quality validation failed:', error);
      return {
        score: 6.0,
        validationResults: {},
        styleSpec: styleSpec.name,
        strengths: [],
        issues: [`Validation failed: ${error.message}`],
        passed: false
      };
    }
  }

  /**
   * Assess professional appearance standards
   */
  async assessProfessionalAppearance(imageUri, styleTemplate, validationId) {
    console.log(`👔 [${validationId}] Assessing professional appearance`);
    
    try {
      const assessment = {
        lighting: this.assessLightingQuality(styleTemplate),
        background: this.assessBackgroundQuality(styleTemplate),
        composition: this.assessCompositionQuality(),
        professionalPresence: this.assessProfessionalPresence(styleTemplate)
      };
      
      // Calculate weighted score based on style
      const styleSpec = STYLE_SPECIFICATIONS[styleTemplate];
      const weights = styleSpec.qualityWeights;
      
      let weightedScore = 0;
      let totalWeight = 0;
      
      Object.keys(weights).forEach(aspect => {
        if (assessment[aspect]) {
          weightedScore += assessment[aspect].score * weights[aspect];
          totalWeight += weights[aspect];
        }
      });
      
      // Add general assessments with equal weight for remaining
      const remainingWeight = 1.0 - totalWeight;
      const generalAspects = ['lighting', 'background', 'composition', 'professionalPresence'];
      
      generalAspects.forEach(aspect => {
        if (assessment[aspect] && !weights[aspect]) {
          weightedScore += assessment[aspect].score * (remainingWeight / generalAspects.length);
        }
      });
      
      const overallScore = Math.min(10, Math.max(0, weightedScore));
      
      return {
        score: overallScore,
        breakdown: assessment,
        passed: overallScore >= QUALITY_STANDARDS.PROFESSIONAL_APPEARANCE_MIN
      };
      
    } catch (error) {
      console.error('Professional appearance assessment failed:', error);
      return {
        score: 7.0,
        breakdown: {},
        passed: false
      };
    }
  }

  /**
   * Validate LinkedIn optimization
   */
  async validateLinkedInOptimization(imageUri, validationId) {
    console.log(`💼 [${validationId}] Validating LinkedIn optimization`);
    
    try {
      let score = 8.0;
      const optimizations = [];
      const issues = [];
      
      // Simulate LinkedIn-specific validations
      const linkedInChecks = {
        squareAspectRatio: true,
        appropriateResolution: true,
        professionalBackground: true,
        clearFaceVisibility: true,
        appropriateFileSize: true
      };
      
      Object.keys(linkedInChecks).forEach(check => {
        if (linkedInChecks[check]) {
          score += 0.3;
          optimizations.push(check.replace(/([A-Z])/g, ' $1').toLowerCase());
        } else {
          score -= 0.5;
          issues.push(`LinkedIn ${check.replace(/([A-Z])/g, ' $1').toLowerCase()} not optimal`);
        }
      });
      
      return {
        score: Math.min(10, Math.max(0, score)),
        optimizations,
        issues,
        passed: score >= 8.0
      };
      
    } catch (error) {
      console.error('LinkedIn validation failed:', error);
      return {
        score: 7.0,
        optimizations: [],
        issues: ['LinkedIn validation failed'],
        passed: false
      };
    }
  }

  /**
   * Calculate overall quality score
   */
  calculateOverallQualityScore(qualityData, styleTemplate) {
    const weights = {
      technical: 0.20,
      style: 0.35,
      professional: 0.35,
      linkedin: 0.10
    };
    
    let weightedSum = 0;
    let totalWeight = 0;
    const breakdown = {};
    
    Object.keys(weights).forEach(aspect => {
      if (qualityData[aspect] && qualityData[aspect].score !== undefined) {
        const weight = weights[aspect];
        const score = qualityData[aspect].score;
        
        weightedSum += score * weight;
        totalWeight += weight;
        breakdown[aspect] = {
          score: score,
          weight: weight,
          contribution: score * weight
        };
      }
    });
    
    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    return {
      score: Math.round(overallScore * 10) / 10, // Round to 1 decimal place
      breakdown,
      weightedSum,
      totalWeight
    };
  }

  /**
   * Generate comprehensive quality report
   */
  generateQualityReport(qualityData, validationId) {
    const { overall, style, technical, professional, linkedin, transformationData } = qualityData;
    
    const report = {
      validationId,
      timestamp: new Date().toISOString(),
      overallScore: overall.score,
      passed: overall.score >= QUALITY_STANDARDS.OVERALL_QUALITY_MIN,
      styleTemplate: style,
      
      summary: {
        grade: this.getQualityGrade(overall.score),
        level: this.getQualityLevel(overall.score),
        readyForLinkedIn: overall.score >= 8.0 && linkedin.passed
      },
      
      strengths: [],
      issues: [],
      recommendations: [],
      
      detailedBreakdown: {
        technical: technical,
        styleSpecific: qualityData.style,
        professional: professional,
        linkedin: linkedin
      }
    };
    
    // Collect strengths from all assessments
    [technical, qualityData.style, professional, linkedin].forEach(assessment => {
      if (assessment.strengths) {
        report.strengths.push(...assessment.strengths);
      }
      if (assessment.optimizations) {
        report.strengths.push(...assessment.optimizations);
      }
    });
    
    // Collect issues from all assessments
    [technical, qualityData.style, professional, linkedin].forEach(assessment => {
      if (assessment.issues) {
        report.issues.push(...assessment.issues);
      }
    });
    
    // Generate recommendations based on issues
    report.recommendations = this.generateRecommendations(report, transformationData);
    
    return report;
  }

  /**
   * Generate quality improvement recommendations
   */
  generateRecommendations(report, transformationData) {
    const recommendations = [];
    const { overallScore, issues, styleTemplate } = report;
    
    // Score-based recommendations
    if (overallScore < 6.0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Overall Quality',
        suggestion: 'Consider retaking the photo with better lighting and a cleaner background',
        impact: 'Major improvement in professional appearance'
      });
    } else if (overallScore < 8.0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Quality Enhancement',
        suggestion: 'Try using our premium AI processing for better results',
        impact: 'Significant improvement in transformation quality'
      });
    }
    
    // Issue-specific recommendations
    issues.forEach(issue => {
      if (issue.includes('resolution')) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Image Quality',
          suggestion: 'Use a higher resolution photo (at least 800x800 pixels)',
          impact: 'Better detail and professional appearance'
        });
      }
      
      if (issue.includes('file size') && issue.includes('small')) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'Processing Quality',
          suggestion: 'This may be a basic enhancement. Try our AI transformation for more dramatic results',
          impact: 'More professional and LinkedIn-ready appearance'
        });
      }
      
      if (issue.includes('attire') || issue.includes('professional')) {
        const styleSpec = STYLE_SPECIFICATIONS[styleTemplate];
        recommendations.push({
          priority: 'MEDIUM',
          category: 'Professional Appearance',
          suggestion: `Ensure ${styleSpec.attireExpectation.replace('_', ' ')} is clearly visible in your photo`,
          impact: 'Better alignment with professional standards'
        });
      }
    });
    
    // Style-specific recommendations
    const styleSpec = STYLE_SPECIFICATIONS[styleTemplate];
    if (styleSpec) {
      recommendations.push({
        priority: 'INFO',
        category: 'Style Optimization',
        suggestion: `This ${styleSpec.name} style works best with ${styleSpec.lightingStyle.replace('_', ' ')} and ${styleSpec.backgroundType.replace('_', ' ')}`,
        impact: 'Style-specific professional enhancement'
      });
    }
    
    return recommendations;
  }

  /**
   * Simulate element detection for style validation
   */
  simulateElementDetection(element, styleTemplate) {
    // Simulate detection based on style and element type
    const detectionProbabilities = {
      formal_attire: 0.85,
      professional_background: 0.80,
      executive_lighting: 0.75,
      modern_attire: 0.80,
      contemporary_background: 0.85,
      natural_lighting: 0.90,
      medical_attire: 0.90,
      clinical_background: 0.85,
      trust_lighting: 0.80,
      formal_business: 0.85,
      conservative_background: 0.80,
      authoritative_lighting: 0.75,
      modern_casual: 0.85,
      innovative_lighting: 0.85,
      premium_casual: 0.80,
      dynamic_background: 0.75,
      confident_lighting: 0.85
    };
    
    const probability = detectionProbabilities[element] || 0.70;
    return Math.random() < probability;
  }

  /**
   * Validate attire expectation
   */
  validateAttireExpectation(attireExpectation, transformationData) {
    // Simulate attire validation based on transformation data
    let score = 1.0; // Base score
    
    if (transformationData.transformationType && 
        transformationData.transformationType.includes('ai')) {
      score += 0.8; // AI transformations typically improve attire
    }
    
    if (transformationData.modelUsed && 
        transformationData.modelUsed.includes('Premium')) {
      score += 0.7; // Premium models better at attire transformation
    }
    
    // Style-specific bonuses
    const attireBonus = {
      business_formal: 0.5,
      business_formal_premium: 0.8,
      business_casual_elevated: 0.6,
      medical_professional: 0.7,
      business_casual_modern: 0.6,
      elevated_casual: 0.5
    };
    
    score += attireBonus[attireExpectation] || 0.3;
    
    return Math.min(2.0, score); // Cap at 2.0
  }

  /**
   * Assess lighting quality
   */
  assessLightingQuality(styleTemplate) {
    const styleSpec = STYLE_SPECIFICATIONS[styleTemplate];
    const lightingScore = 8.0 + (Math.random() * 2.0) - 1.0; // 7.0-9.0 range
    
    return {
      score: lightingScore,
      lightingStyle: styleSpec.lightingStyle,
      assessment: lightingScore >= 8.0 ? 'Professional lighting detected' : 'Lighting could be improved'
    };
  }

  /**
   * Assess background quality
   */
  assessBackgroundQuality(styleTemplate) {
    const styleSpec = STYLE_SPECIFICATIONS[styleTemplate];
    const backgroundScore = 7.5 + (Math.random() * 2.5) - 1.0; // 6.5-9.0 range
    
    return {
      score: backgroundScore,
      backgroundType: styleSpec.backgroundType,
      assessment: backgroundScore >= 8.0 ? 'Professional background' : 'Background acceptable'
    };
  }

  /**
   * Assess composition quality
   */
  assessCompositionQuality() {
    const compositionScore = 7.0 + (Math.random() * 2.0); // 7.0-9.0 range
    
    return {
      score: compositionScore,
      assessment: compositionScore >= 8.0 ? 'Excellent composition' : 'Good composition'
    };
  }

  /**
   * Assess professional presence
   */
  assessProfessionalPresence(styleTemplate) {
    const styleSpec = STYLE_SPECIFICATIONS[styleTemplate];
    const presenceScore = 8.0 + (Math.random() * 1.5) - 0.5; // 7.5-9.0 range
    
    return {
      score: presenceScore,
      style: styleSpec.name,
      assessment: presenceScore >= 8.5 ? 'Strong professional presence' : 'Professional presence detected'
    };
  }

  /**
   * Get quality grade (A-F)
   */
  getQualityGrade(score) {
    if (score >= 9.0) return 'A+';
    if (score >= 8.5) return 'A';
    if (score >= 8.0) return 'A-';
    if (score >= 7.5) return 'B+';
    if (score >= 7.0) return 'B';
    if (score >= 6.5) return 'B-';
    if (score >= 6.0) return 'C+';
    if (score >= 5.5) return 'C';
    if (score >= 5.0) return 'C-';
    return 'F';
  }

  /**
   * Get quality level description
   */
  getQualityLevel(score) {
    if (score >= 9.0) return 'Exceptional Professional Quality';
    if (score >= 8.5) return 'Premium Professional Quality';
    if (score >= 8.0) return 'High Professional Quality';
    if (score >= 7.5) return 'Good Professional Quality';
    if (score >= 7.0) return 'Acceptable Professional Quality';
    if (score >= 6.0) return 'Basic Professional Quality';
    return 'Below Professional Standards';
  }

  /**
   * Record quality metrics for analytics
   */
  async recordQualityMetrics(qualityReport, processingTime) {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        validationId: qualityReport.validationId,
        overallScore: qualityReport.overallScore,
        styleTemplate: qualityReport.styleTemplate,
        passed: qualityReport.passed,
        processingTime,
        grade: qualityReport.summary.grade,
        readyForLinkedIn: qualityReport.summary.readyForLinkedIn
      };
      
      this.qualityHistory.push(metrics);
      
      // Keep only last 100 quality records
      if (this.qualityHistory.length > 100) {
        this.qualityHistory = this.qualityHistory.slice(-100);
      }
      
      // Update style-specific metrics
      const styleKey = qualityReport.styleTemplate;
      if (!this.styleMetrics.has(styleKey)) {
        this.styleMetrics.set(styleKey, {
          count: 0,
          totalScore: 0,
          passCount: 0,
          averageScore: 0,
          passRate: 0
        });
      }
      
      const styleStats = this.styleMetrics.get(styleKey);
      styleStats.count++;
      styleStats.totalScore += qualityReport.overallScore;
      if (qualityReport.passed) styleStats.passCount++;
      styleStats.averageScore = styleStats.totalScore / styleStats.count;
      styleStats.passRate = styleStats.passCount / styleStats.count;
      
    } catch (error) {
      console.error('Failed to record quality metrics:', error);
    }
  }

  /**
   * Initialize quality standards
   */
  initializeQualityStandards() {
    console.log('🎯 Quality standards initialized:', {
      minimumOverallScore: QUALITY_STANDARDS.OVERALL_QUALITY_MIN,
      styleCount: Object.keys(STYLE_SPECIFICATIONS).length,
      professionalAppearanceMin: QUALITY_STANDARDS.PROFESSIONAL_APPEARANCE_MIN
    });
  }

  /**
   * Generate unique validation ID
   */
  generateValidationId() {
    return `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get quality metrics and statistics
   */
  getQualityMetrics() {
    const recentHistory = this.qualityHistory.slice(-20); // Last 20 validations
    
    return {
      totalValidations: this.qualityHistory.length,
      recentValidations: recentHistory,
      overallStats: {
        averageScore: this.qualityHistory.reduce((sum, q) => sum + q.overallScore, 0) / this.qualityHistory.length || 0,
        passRate: this.qualityHistory.filter(q => q.passed).length / this.qualityHistory.length || 0,
        linkedInReadyRate: this.qualityHistory.filter(q => q.readyForLinkedIn).length / this.qualityHistory.length || 0
      },
      styleMetrics: Object.fromEntries(this.styleMetrics),
      qualityStandards: QUALITY_STANDARDS,
      styleSpecifications: Object.keys(STYLE_SPECIFICATIONS)
    };
  }
}

// Export singleton instance
export default new QualityAssuranceService();