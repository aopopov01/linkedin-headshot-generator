const sharp = require('sharp');
const logger = require('../config/logger');

class PhotoQualityService {
  constructor() {
    this.initialized = false;
    
    // Professional headshot quality standards
    this.qualityStandards = {
      resolution: {
        min_width: 400,
        min_height: 400,
        recommended_width: 1024,
        recommended_height: 1024,
        optimal_width: 2048,
        optimal_height: 2048
      },
      professional_requirements: {
        face_size_ratio: { min: 0.2, max: 0.6, optimal: 0.35 },
        face_position: { center_tolerance: 0.15 },
        lighting_score: { min: 60, recommended: 80 },
        background_complexity: { max: 30, recommended: 15 },
        sharpness_threshold: 120,
        contrast_range: { min: 40, max: 200 }
      },
      file_requirements: {
        max_size_mb: 15,
        accepted_formats: ['jpeg', 'jpg', 'png', 'webp'],
        compression_quality: { min: 70, recommended: 90 }
      }
    };

    // Professional style assessment criteria
    this.professionalCriteria = {
      attire: {
        business_formal: ['suit', 'tie', 'blazer', 'dress_shirt'],
        business_casual: ['polo', 'sweater', 'blouse', 'cardigan'],
        creative_professional: ['unique_style', 'branded_clothing']
      },
      background_types: {
        professional: ['plain', 'gradient', 'office', 'studio'],
        acceptable: ['outdoor_professional', 'minimal_indoor'],
        problematic: ['busy', 'distracting', 'personal']
      },
      lighting_quality: {
        excellent: 'even_soft_lighting',
        good: 'natural_window_light',
        acceptable: 'controlled_artificial',
        poor: 'harsh_shadows_or_underexposed'
      }
    };
  }

  async initialize() {
    try {
      logger.info('Initializing Photo Quality Service...');
      this.initialized = true;
      logger.info('Photo Quality Service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Photo Quality Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Comprehensive photo quality assessment for headshot generation
   */
  async assessPhotoForHeadshot(imageBuffer, options = {}) {
    try {
      const startTime = Date.now();
      
      // Basic image analysis
      const imageMetadata = await this.getImageMetadata(imageBuffer);
      
      // Professional quality assessment
      const qualityAssessment = await this.assessProfessionalQuality(imageBuffer, imageMetadata);
      
      // Face detection and analysis
      const faceAnalysis = await this.analyzeFaceForHeadshot(imageBuffer);
      
      // Background suitability analysis
      const backgroundAnalysis = await this.analyzeBackgroundSuitability(imageBuffer);
      
      // Lighting analysis
      const lightingAnalysis = await this.analyzeLightingQuality(imageBuffer);
      
      // Overall suitability scoring
      const suitabilityScore = this.calculateHeadshotSuitability({
        qualityAssessment,
        faceAnalysis,
        backgroundAnalysis,
        lightingAnalysis,
        imageMetadata
      });
      
      // Generate enhancement recommendations
      const recommendations = this.generateHeadshotRecommendations({
        qualityAssessment,
        faceAnalysis,
        backgroundAnalysis,
        lightingAnalysis,
        suitabilityScore
      });
      
      const processingTime = Date.now() - startTime;
      
      const assessment = {
        overall_suitability_score: suitabilityScore.overall_score,
        processing_time_ms: processingTime,
        image_metadata: imageMetadata,
        quality_assessment: qualityAssessment,
        face_analysis: faceAnalysis,
        background_analysis: backgroundAnalysis,
        lighting_analysis: lightingAnalysis,
        professional_readiness: this.assessProfessionalReadiness(suitabilityScore),
        recommendations: recommendations,
        estimated_success_rate: this.estimateGenerationSuccessRate(suitabilityScore),
        required_preprocessing: this.determinePreprocessingNeeds(qualityAssessment, faceAnalysis)
      };
      
      logger.info('Photo quality assessment completed:', {
        processingTime: `${processingTime}ms`,
        suitabilityScore: suitabilityScore.overall_score,
        professionalReadiness: assessment.professional_readiness.level
      });
      
      return assessment;
      
    } catch (error) {
      logger.error('Photo quality assessment failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive image metadata
   */
  async getImageMetadata(imageBuffer) {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      const stats = await image.stats();
      
      // Calculate additional metrics
      const fileSize = imageBuffer.length;
      const aspectRatio = metadata.width / metadata.height;
      const pixelDensity = metadata.width * metadata.height;
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        file_size_bytes: fileSize,
        file_size_mb: (fileSize / 1024 / 1024).toFixed(2),
        aspect_ratio: parseFloat(aspectRatio.toFixed(3)),
        pixel_density: pixelDensity,
        channels: metadata.channels,
        has_alpha: metadata.channels === 4,
        color_space: metadata.space,
        bit_depth: metadata.depth,
        density: metadata.density,
        color_stats: stats.channels.map((channel, index) => ({
          channel: index,
          mean: Math.round(channel.mean),
          std: Math.round(channel.std),
          min: channel.min,
          max: channel.max
        }))
      };
    } catch (error) {
      logger.error('Failed to get image metadata:', error);
      throw error;
    }
  }

  /**
   * Assess professional quality standards
   */
  async assessProfessionalQuality(imageBuffer, metadata) {
    try {
      const assessment = {
        resolution_score: this.assessResolution(metadata),
        sharpness_score: await this.assessSharpness(imageBuffer),
        noise_score: await this.assessImageNoise(imageBuffer),
        compression_score: this.assessCompressionQuality(metadata),
        color_accuracy_score: this.assessColorAccuracy(metadata),
        overall_technical_quality: 0
      };
      
      // Calculate weighted overall score
      assessment.overall_technical_quality = Math.round(
        assessment.resolution_score * 0.25 +
        assessment.sharpness_score * 0.30 +
        assessment.noise_score * 0.20 +
        assessment.compression_score * 0.15 +
        assessment.color_accuracy_score * 0.10
      );
      
      return assessment;
    } catch (error) {
      logger.error('Professional quality assessment failed:', error);
      return {
        overall_technical_quality: 50,
        error: error.message
      };
    }
  }

  /**
   * Analyze face for headshot suitability
   */
  async analyzeFaceForHeadshot(imageBuffer) {
    try {
      // This is a simplified face analysis - in production, use specialized face detection
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      // Simplified face region estimation using center crop analysis
      const centerCrop = await image
        .extract({
          left: Math.floor(metadata.width * 0.2),
          top: Math.floor(metadata.height * 0.15),
          width: Math.floor(metadata.width * 0.6),
          height: Math.floor(metadata.height * 0.7)
        })
        .stats();
      
      // Analyze center region for face-like characteristics
      const faceAnalysis = {
        face_detected: true, // Simplified assumption
        face_confidence: 0.75, // Estimated
        face_size_ratio: this.estimateFaceSizeRatio(centerCrop, metadata),
        face_position: this.analyzeFacePosition(metadata),
        face_orientation: this.estimateFaceOrientation(centerCrop),
        eye_contact_estimate: this.estimateEyeContact(centerCrop),
        expression_suitability: this.assessExpressionSuitability(centerCrop),
        face_clarity_score: await this.assessFaceClarity(imageBuffer),
        professional_appearance: this.assessProfessionalAppearance(centerCrop)
      };
      
      return faceAnalysis;
    } catch (error) {
      logger.error('Face analysis failed:', error);
      return {
        face_detected: false,
        face_confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Analyze background suitability for professional headshots
   */
  async analyzeBackgroundSuitability(imageBuffer) {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      // Analyze background regions (edges of image)
      const backgroundRegions = await this.extractBackgroundRegions(image, metadata);
      
      const backgroundAnalysis = {
        complexity_score: await this.calculateBackgroundComplexity(backgroundRegions),
        color_uniformity: this.analyzeBackgroundColorUniformity(backgroundRegions),
        distraction_level: this.assessBackgroundDistractions(backgroundRegions),
        professional_suitability: 0,
        background_type: this.classifyBackgroundType(backgroundRegions),
        color_palette: this.analyzeBackgroundColors(backgroundRegions),
        texture_analysis: await this.analyzeBackgroundTexture(backgroundRegions)
      };
      
      backgroundAnalysis.professional_suitability = this.calculateBackgroundProfessionalScore(backgroundAnalysis);
      
      return backgroundAnalysis;
    } catch (error) {
      logger.error('Background analysis failed:', error);
      return {
        professional_suitability: 50,
        background_type: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Analyze lighting quality for professional standards
   */
  async analyzeLightingQuality(imageBuffer) {
    try {
      const image = sharp(imageBuffer);
      const stats = await image.stats();
      
      const lightingAnalysis = {
        brightness_score: this.assessBrightness(stats),
        contrast_score: this.assessContrast(stats),
        exposure_score: this.assessExposure(stats),
        shadow_highlights_balance: this.analyzeShadowHighlightBalance(stats),
        color_temperature: this.estimateColorTemperature(stats),
        lighting_evenness: await this.assessLightingEvenness(image),
        professional_lighting_score: 0
      };
      
      lightingAnalysis.professional_lighting_score = Math.round(
        lightingAnalysis.brightness_score * 0.25 +
        lightingAnalysis.contrast_score * 0.25 +
        lightingAnalysis.exposure_score * 0.20 +
        lightingAnalysis.shadow_highlights_balance * 0.20 +
        lightingAnalysis.lighting_evenness * 0.10
      );
      
      return lightingAnalysis;
    } catch (error) {
      logger.error('Lighting analysis failed:', error);
      return {
        professional_lighting_score: 50,
        error: error.message
      };
    }
  }

  /**
   * Calculate overall headshot suitability
   */
  calculateHeadshotSuitability({ qualityAssessment, faceAnalysis, backgroundAnalysis, lightingAnalysis, imageMetadata }) {
    const weights = {
      technical_quality: 0.25,
      face_suitability: 0.35,
      background_suitability: 0.25,
      lighting_quality: 0.15
    };
    
    const scores = {
      technical_quality: qualityAssessment.overall_technical_quality || 50,
      face_suitability: this.calculateFaceSuitabilityScore(faceAnalysis),
      background_suitability: backgroundAnalysis.professional_suitability || 50,
      lighting_quality: lightingAnalysis.professional_lighting_score || 50
    };
    
    const overallScore = Math.round(
      Object.keys(weights).reduce((total, key) => {
        return total + (scores[key] * weights[key]);
      }, 0)
    );
    
    return {
      overall_score: overallScore,
      component_scores: scores,
      score_breakdown: Object.keys(scores).map(key => ({
        component: key,
        score: scores[key],
        weight: weights[key],
        contribution: Math.round(scores[key] * weights[key])
      })),
      quality_tier: this.determineQualityTier(overallScore)
    };
  }

  /**
   * Assessment helper methods
   */
  assessResolution(metadata) {
    const { width, height } = metadata;
    const standards = this.qualityStandards.resolution;
    
    if (width >= standards.optimal_width && height >= standards.optimal_height) {
      return 100;
    } else if (width >= standards.recommended_width && height >= standards.recommended_height) {
      return 90;
    } else if (width >= standards.min_width && height >= standards.min_height) {
      return 70;
    } else {
      return Math.max(20, (width * height) / (standards.min_width * standards.min_height) * 60);
    }
  }

  async assessSharpness(imageBuffer) {
    try {
      const image = sharp(imageBuffer);
      const { data, info } = await image
        .greyscale()
        .convolve({
          width: 3,
          height: 3,
          kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0] // Laplacian kernel
        })
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      // Calculate Laplacian variance
      const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
      const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
      
      // Scale variance to 0-100 score
      const sharpnessScore = Math.min(100, Math.max(0, (variance / 20) * 100));
      return Math.round(sharpnessScore);
    } catch (error) {
      logger.error('Sharpness assessment failed:', error);
      return 50;
    }
  }

  async assessImageNoise(imageBuffer) {
    try {
      const image = sharp(imageBuffer);
      const original = await image.raw().toBuffer();
      const filtered = await image.median(3).raw().toBuffer();
      
      let difference = 0;
      for (let i = 0; i < original.length; i++) {
        difference += Math.abs(original[i] - filtered[i]);
      }
      
      const avgDifference = difference / original.length;
      const noiseScore = Math.max(0, 100 - (avgDifference * 1.5));
      
      return Math.round(noiseScore);
    } catch (error) {
      logger.error('Noise assessment failed:', error);
      return 70;
    }
  }

  assessCompressionQuality(metadata) {
    const fileSize = metadata.file_size_bytes;
    const pixelCount = metadata.width * metadata.height;
    const bytesPerPixel = fileSize / pixelCount;
    
    // Estimate compression quality based on bytes per pixel
    if (bytesPerPixel > 3) {
      return 95; // Minimal compression
    } else if (bytesPerPixel > 2) {
      return 85; // Light compression
    } else if (bytesPerPixel > 1) {
      return 70; // Moderate compression
    } else if (bytesPerPixel > 0.5) {
      return 50; // Heavy compression
    } else {
      return 25; // Very heavy compression
    }
  }

  assessColorAccuracy(metadata) {
    const colorStats = metadata.color_stats;
    if (!colorStats || colorStats.length < 3) return 70;
    
    // Analyze color balance
    const [r, g, b] = colorStats;
    const avgMean = (r.mean + g.mean + b.mean) / 3;
    
    // Calculate color cast (deviation from neutral)
    const rDeviation = Math.abs(r.mean - avgMean);
    const gDeviation = Math.abs(g.mean - avgMean);
    const bDeviation = Math.abs(b.mean - avgMean);
    const maxDeviation = Math.max(rDeviation, gDeviation, bDeviation);
    
    // Lower deviation = better color accuracy
    const colorAccuracy = Math.max(40, 100 - (maxDeviation / 2));
    return Math.round(colorAccuracy);
  }

  estimateFaceSizeRatio(centerCrop, metadata) {
    // Simplified estimation based on center region variance
    const faceRegionVariance = centerCrop.channels[0].std;
    const estimatedFaceSize = Math.min(0.6, Math.max(0.1, faceRegionVariance / 100));
    return parseFloat(estimatedFaceSize.toFixed(3));
  }

  analyzeFacePosition(metadata) {
    // Since we don't have actual face detection, return centered position
    return {
      x: 0.5,
      y: 0.45, // Slightly above center for headshots
      center_deviation: 0.05,
      is_well_positioned: true
    };
  }

  estimateFaceOrientation(centerCrop) {
    // Simplified orientation estimation
    return {
      frontal_score: 85,
      angle_estimate: 0,
      is_suitable_angle: true
    };
  }

  estimateEyeContact(centerCrop) {
    // Simplified eye contact estimation
    return {
      eye_contact_score: 80,
      gaze_direction: 'forward',
      is_engaging: true
    };
  }

  assessExpressionSuitability(centerCrop) {
    // Simplified expression assessment
    return {
      expression_score: 85,
      expression_type: 'professional_smile',
      is_appropriate: true
    };
  }

  async assessFaceClarity(imageBuffer) {
    try {
      // Focus on center region where face would be
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      const faceRegion = await image
        .extract({
          left: Math.floor(metadata.width * 0.25),
          top: Math.floor(metadata.height * 0.2),
          width: Math.floor(metadata.width * 0.5),
          height: Math.floor(metadata.height * 0.6)
        })
        .greyscale()
        .convolve({
          width: 3,
          height: 3,
          kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
        })
        .raw()
        .toBuffer();
      
      const clarity = faceRegion.reduce((sum, val) => sum + Math.abs(val - 128), 0) / faceRegion.length;
      return Math.min(100, Math.max(30, clarity / 2));
    } catch (error) {
      logger.error('Face clarity assessment failed:', error);
      return 60;
    }
  }

  assessProfessionalAppearance(centerCrop) {
    // Simplified professional appearance assessment
    return {
      attire_score: 75,
      grooming_score: 80,
      overall_professional_score: 78,
      appears_professional: true
    };
  }

  async extractBackgroundRegions(image, metadata) {
    try {
      // Extract edge regions for background analysis
      const regions = {
        top: await image.extract({ left: 0, top: 0, width: metadata.width, height: Math.floor(metadata.height * 0.2) }).stats(),
        bottom: await image.extract({ left: 0, top: Math.floor(metadata.height * 0.8), width: metadata.width, height: Math.floor(metadata.height * 0.2) }).stats(),
        left: await image.extract({ left: 0, top: 0, width: Math.floor(metadata.width * 0.2), height: metadata.height }).stats(),
        right: await image.extract({ left: Math.floor(metadata.width * 0.8), top: 0, width: Math.floor(metadata.width * 0.2), height: metadata.height }).stats()
      };
      
      return regions;
    } catch (error) {
      logger.error('Background region extraction failed:', error);
      return {};
    }
  }

  async calculateBackgroundComplexity(backgroundRegions) {
    try {
      if (!backgroundRegions.top) return 50;
      
      // Calculate complexity based on standard deviation across regions
      const complexities = Object.values(backgroundRegions).map(region => 
        region.channels[0].std
      );
      
      const avgComplexity = complexities.reduce((sum, val) => sum + val, 0) / complexities.length;
      
      // Lower complexity = better for headshots
      return Math.max(0, 100 - (avgComplexity / 2));
    } catch (error) {
      logger.error('Background complexity calculation failed:', error);
      return 50;
    }
  }

  analyzeBackgroundColorUniformity(backgroundRegions) {
    try {
      if (!backgroundRegions.top) return 50;
      
      const means = Object.values(backgroundRegions).map(region => 
        region.channels[0].mean
      );
      
      const avgMean = means.reduce((sum, val) => sum + val, 0) / means.length;
      const variance = means.reduce((sum, val) => sum + Math.pow(val - avgMean, 2), 0) / means.length;
      
      // Lower variance = more uniform
      return Math.max(40, 100 - (variance / 5));
    } catch (error) {
      logger.error('Background uniformity analysis failed:', error);
      return 50;
    }
  }

  assessBackgroundDistractions(backgroundRegions) {
    try {
      if (!backgroundRegions.top) return 50;
      
      // High standard deviation indicates potential distractions
      const distractionScores = Object.values(backgroundRegions).map(region => 
        Math.min(100, region.channels[0].std * 2)
      );
      
      const avgDistraction = distractionScores.reduce((sum, val) => sum + val, 0) / distractionScores.length;
      
      // Return inverted score (lower distraction = higher score)
      return Math.max(0, 100 - avgDistraction);
    } catch (error) {
      logger.error('Background distraction assessment failed:', error);
      return 50;
    }
  }

  classifyBackgroundType(backgroundRegions) {
    try {
      if (!backgroundRegions.top) return 'unknown';
      
      const complexity = Object.values(backgroundRegions).reduce((sum, region) => 
        sum + region.channels[0].std, 0
      ) / 4;
      
      if (complexity < 20) return 'plain';
      if (complexity < 40) return 'minimal';
      if (complexity < 60) return 'moderate';
      return 'complex';
    } catch (error) {
      logger.error('Background type classification failed:', error);
      return 'unknown';
    }
  }

  analyzeBackgroundColors(backgroundRegions) {
    try {
      if (!backgroundRegions.top) return { dominant_color: 'unknown' };
      
      // Analyze dominant colors in background
      const colorValues = Object.values(backgroundRegions).map(region => ({
        r: region.channels[0]?.mean || 0,
        g: region.channels[1]?.mean || 0,
        b: region.channels[2]?.mean || 0
      }));
      
      const avgColor = {
        r: Math.round(colorValues.reduce((sum, c) => sum + c.r, 0) / colorValues.length),
        g: Math.round(colorValues.reduce((sum, c) => sum + c.g, 0) / colorValues.length),
        b: Math.round(colorValues.reduce((sum, c) => sum + c.b, 0) / colorValues.length)
      };
      
      return {
        dominant_color: `rgb(${avgColor.r}, ${avgColor.g}, ${avgColor.b})`,
        color_temperature: this.classifyColorTemperature(avgColor),
        neutrality_score: this.assessColorNeutrality(avgColor)
      };
    } catch (error) {
      logger.error('Background color analysis failed:', error);
      return { dominant_color: 'unknown' };
    }
  }

  async analyzeBackgroundTexture(backgroundRegions) {
    try {
      // Simplified texture analysis
      return {
        texture_score: 70,
        texture_type: 'smooth',
        is_professional: true
      };
    } catch (error) {
      logger.error('Background texture analysis failed:', error);
      return { texture_score: 50, texture_type: 'unknown' };
    }
  }

  calculateBackgroundProfessionalScore(backgroundAnalysis) {
    const weights = {
      complexity_score: 0.3,
      color_uniformity: 0.25,
      distraction_level: 0.25,
      neutrality_score: 0.2
    };
    
    const scores = {
      complexity_score: backgroundAnalysis.complexity_score || 50,
      color_uniformity: backgroundAnalysis.color_uniformity || 50,
      distraction_level: backgroundAnalysis.distraction_level || 50,
      neutrality_score: backgroundAnalysis.color_palette?.neutrality_score || 50
    };
    
    return Math.round(
      Object.keys(weights).reduce((total, key) => {
        return total + (scores[key] * weights[key]);
      }, 0)
    );
  }

  assessBrightness(stats) {
    const brightness = stats.channels[0].mean;
    const optimal = 128; // Mid-gray
    const deviation = Math.abs(brightness - optimal);
    
    return Math.max(20, 100 - (deviation / 2));
  }

  assessContrast(stats) {
    const contrast = stats.channels[0].std;
    
    // Optimal contrast range for professional headshots
    if (contrast >= 40 && contrast <= 80) {
      return 90;
    } else if (contrast >= 25 && contrast <= 100) {
      return 70;
    } else {
      return Math.max(30, 70 - Math.abs(contrast - 60));
    }
  }

  assessExposure(stats) {
    const channels = stats.channels;
    const overexposed = channels.reduce((count, ch) => count + (ch.max >= 250 ? 1 : 0), 0);
    const underexposed = channels.reduce((count, ch) => count + (ch.min <= 5 ? 1 : 0), 0);
    
    if (overexposed === 0 && underexposed === 0) {
      return 95;
    } else if (overexposed <= 1 && underexposed <= 1) {
      return 75;
    } else {
      return Math.max(25, 75 - ((overexposed + underexposed) * 15));
    }
  }

  analyzeShadowHighlightBalance(stats) {
    // Simplified shadow/highlight analysis
    const brightness = stats.channels[0].mean;
    const contrast = stats.channels[0].std;
    
    // Good balance has moderate brightness and contrast
    const brightnessScore = Math.max(0, 100 - Math.abs(brightness - 128) * 2);
    const contrastScore = contrast >= 30 && contrast <= 70 ? 100 : Math.max(40, 100 - Math.abs(contrast - 50));
    
    return Math.round((brightnessScore + contrastScore) / 2);
  }

  estimateColorTemperature(stats) {
    if (stats.channels.length < 3) return 'neutral';
    
    const [r, g, b] = stats.channels;
    const rMean = r.mean;
    const bMean = b.mean;
    
    const colorTempRatio = rMean / bMean;
    
    if (colorTempRatio > 1.2) return 'warm';
    if (colorTempRatio < 0.8) return 'cool';
    return 'neutral';
  }

  async assessLightingEvenness(image) {
    try {
      // Divide image into grid and analyze lighting consistency
      const metadata = await image.metadata();
      const gridSize = 4;
      const cellWidth = Math.floor(metadata.width / gridSize);
      const cellHeight = Math.floor(metadata.height / gridSize);
      
      const lightingValues = [];
      
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const cell = await image
            .extract({
              left: col * cellWidth,
              top: row * cellHeight,
              width: cellWidth,
              height: cellHeight
            })
            .stats();
          
          lightingValues.push(cell.channels[0].mean);
        }
      }
      
      // Calculate lighting evenness
      const avgLighting = lightingValues.reduce((sum, val) => sum + val, 0) / lightingValues.length;
      const variance = lightingValues.reduce((sum, val) => sum + Math.pow(val - avgLighting, 2), 0) / lightingValues.length;
      
      // Lower variance = more even lighting
      return Math.max(30, 100 - (Math.sqrt(variance) / 2));
    } catch (error) {
      logger.error('Lighting evenness assessment failed:', error);
      return 60;
    }
  }

  calculateFaceSuitabilityScore(faceAnalysis) {
    if (!faceAnalysis.face_detected) return 10;
    
    const weights = {
      face_confidence: 0.2,
      face_size_ratio: 0.2,
      face_position: 0.15,
      face_clarity_score: 0.25,
      professional_appearance: 0.2
    };
    
    const scores = {
      face_confidence: (faceAnalysis.face_confidence || 0) * 100,
      face_size_ratio: this.scoreFaceSizeRatio(faceAnalysis.face_size_ratio),
      face_position: faceAnalysis.face_position?.is_well_positioned ? 85 : 50,
      face_clarity_score: faceAnalysis.face_clarity_score || 50,
      professional_appearance: faceAnalysis.professional_appearance?.overall_professional_score || 50
    };
    
    return Math.round(
      Object.keys(weights).reduce((total, key) => {
        return total + (scores[key] * weights[key]);
      }, 0)
    );
  }

  scoreFaceSizeRatio(ratio) {
    if (!ratio) return 40;
    
    const standards = this.qualityStandards.professional_requirements.face_size_ratio;
    
    if (ratio >= standards.min && ratio <= standards.max) {
      // Score based on how close to optimal
      const deviation = Math.abs(ratio - standards.optimal);
      return Math.max(70, 100 - (deviation * 200));
    } else {
      // Outside acceptable range
      const minDeviation = Math.max(0, standards.min - ratio);
      const maxDeviation = Math.max(0, ratio - standards.max);
      const deviation = minDeviation + maxDeviation;
      return Math.max(20, 70 - (deviation * 100));
    }
  }

  determineQualityTier(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'very_good';
    if (score >= 70) return 'good';
    if (score >= 60) return 'acceptable';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  assessProfessionalReadiness(suitabilityScore) {
    const score = suitabilityScore.overall_score;
    
    if (score >= 85) {
      return {
        level: 'ready',
        confidence: 'high',
        message: 'Photo is excellent for professional headshot generation'
      };
    } else if (score >= 70) {
      return {
        level: 'good',
        confidence: 'medium',
        message: 'Photo is suitable with minor optimizations'
      };
    } else if (score >= 55) {
      return {
        level: 'needs_improvement',
        confidence: 'low',
        message: 'Photo requires improvements for optimal results'
      };
    } else {
      return {
        level: 'not_recommended',
        confidence: 'very_low',
        message: 'Photo is not suitable for professional headshot generation'
      };
    }
  }

  estimateGenerationSuccessRate(suitabilityScore) {
    const score = suitabilityScore.overall_score;
    
    if (score >= 85) return { percentage: 95, confidence: 'very_high' };
    if (score >= 75) return { percentage: 85, confidence: 'high' };
    if (score >= 65) return { percentage: 70, confidence: 'medium' };
    if (score >= 55) return { percentage: 50, confidence: 'low' };
    return { percentage: 25, confidence: 'very_low' };
  }

  determinePreprocessingNeeds(qualityAssessment, faceAnalysis) {
    const needs = [];
    
    if (qualityAssessment.sharpness_score < 70) {
      needs.push({
        type: 'sharpening',
        priority: 'medium',
        description: 'Apply sharpening to improve image clarity'
      });
    }
    
    if (qualityAssessment.noise_score < 60) {
      needs.push({
        type: 'noise_reduction',
        priority: 'high',
        description: 'Reduce image noise for cleaner results'
      });
    }
    
    if (faceAnalysis.face_size_ratio && faceAnalysis.face_size_ratio < 0.2) {
      needs.push({
        type: 'face_enhancement',
        priority: 'high',
        description: 'Face region needs to be more prominent'
      });
    }
    
    return needs;
  }

  generateHeadshotRecommendations({ qualityAssessment, faceAnalysis, backgroundAnalysis, lightingAnalysis, suitabilityScore }) {
    const recommendations = [];
    
    // Technical quality recommendations
    if (qualityAssessment.overall_technical_quality < 70) {
      recommendations.push({
        category: 'technical',
        priority: 'high',
        issue: 'Image quality below professional standards',
        suggestion: 'Use a higher quality camera or improve image capture settings',
        impact: 'Significant improvement in final headshot quality'
      });
    }
    
    // Face-related recommendations
    if (!faceAnalysis.face_detected || faceAnalysis.face_confidence < 0.6) {
      recommendations.push({
        category: 'composition',
        priority: 'critical',
        issue: 'Face not clearly detected or visible',
        suggestion: 'Ensure face is clearly visible, well-lit, and facing the camera',
        impact: 'Essential for headshot generation'
      });
    }
    
    if (faceAnalysis.face_size_ratio && faceAnalysis.face_size_ratio < 0.2) {
      recommendations.push({
        category: 'composition',
        priority: 'high',
        issue: 'Face too small in frame',
        suggestion: 'Move closer to camera or crop tighter around face',
        impact: 'Better face detail in generated headshots'
      });
    }
    
    // Background recommendations
    if (backgroundAnalysis.professional_suitability < 60) {
      recommendations.push({
        category: 'background',
        priority: 'medium',
        issue: 'Background not optimal for professional headshots',
        suggestion: 'Use a plain, neutral background or professional backdrop',
        impact: 'More professional-looking final results'
      });
    }
    
    // Lighting recommendations
    if (lightingAnalysis.professional_lighting_score < 70) {
      recommendations.push({
        category: 'lighting',
        priority: 'medium',
        issue: 'Lighting not optimal for professional results',
        suggestion: 'Use natural window light or professional lighting setup',
        impact: 'Improved skin tone and professional appearance'
      });
    }
    
    // Overall recommendations
    if (suitabilityScore.overall_score < 70) {
      recommendations.push({
        category: 'general',
        priority: 'high',
        issue: 'Overall photo quality needs improvement',
        suggestion: 'Consider retaking photo with better camera, lighting, and composition',
        impact: 'Significant improvement in all aspects of generated headshots'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  classifyColorTemperature(color) {
    const { r, g, b } = color;
    
    if (r > g && r > b && (r - b) > 30) return 'warm';
    if (b > r && b > g && (b - r) > 30) return 'cool';
    return 'neutral';
  }

  assessColorNeutrality(color) {
    const { r, g, b } = color;
    const avg = (r + g + b) / 3;
    
    const rDev = Math.abs(r - avg);
    const gDev = Math.abs(g - avg);
    const bDev = Math.abs(b - avg);
    const maxDev = Math.max(rDev, gDev, bDev);
    
    // Lower deviation = more neutral
    return Math.max(40, 100 - (maxDev * 2));
  }

  /**
   * Validate image for headshot generation
   */
  async validateForHeadshot(imageBuffer) {
    try {
      const metadata = await this.getImageMetadata(imageBuffer);
      const errors = [];
      const warnings = [];
      
      // File size validation
      if (metadata.file_size_mb > this.qualityStandards.file_requirements.max_size_mb) {
        errors.push(`File too large: ${metadata.file_size_mb}MB (max ${this.qualityStandards.file_requirements.max_size_mb}MB)`);
      }
      
      // Format validation
      if (!this.qualityStandards.file_requirements.accepted_formats.includes(metadata.format.toLowerCase())) {
        errors.push(`Unsupported format: ${metadata.format}`);
      }
      
      // Resolution validation
      const minRes = this.qualityStandards.resolution;
      if (metadata.width < minRes.min_width || metadata.height < minRes.min_height) {
        errors.push(`Resolution too low: ${metadata.width}x${metadata.height} (minimum ${minRes.min_width}x${minRes.min_height})`);
      }
      
      // Warnings for sub-optimal conditions
      if (metadata.width < minRes.recommended_width || metadata.height < minRes.recommended_height) {
        warnings.push(`Below recommended resolution for best quality`);
      }
      
      if (Math.abs(metadata.aspect_ratio - 1.0) > 0.3) {
        warnings.push(`Non-square aspect ratio may be cropped`);
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings,
        metadata
      };
    } catch (error) {
      logger.error('Headshot validation failed:', error);
      return {
        valid: false,
        errors: ['Validation process failed'],
        warnings: [],
        error: error.message
      };
    }
  }
}

module.exports = new PhotoQualityService();