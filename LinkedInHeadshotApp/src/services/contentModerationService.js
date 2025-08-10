/**
 * Content Moderation Service
 * 
 * Comprehensive content moderation system for AI headshot generation app.
 * Ensures compliance with App Store, Google Play, and content safety policies.
 * 
 * Features:
 * - Image content analysis and filtering
 * - Text content moderation for user-generated content
 * - Real-time safety checks and policy enforcement
 * - Compliance reporting and analytics
 * - Multi-level moderation pipeline
 */

import { Alert } from 'react-native';

class ContentModerationService {
  constructor() {
    this.moderationConfig = {
      // Moderation levels: STRICT, MODERATE, PERMISSIVE
      level: 'STRICT', // For app store compliance
      
      // Content categories to check
      categories: {
        inappropriate: true,
        nudity: true,
        violence: true,
        hateSpeech: true,
        minors: true,
        misleading: true,
        copyrightViolation: true
      },
      
      // Age verification requirements
      requireAgeVerification: true,
      minimumAge: 13, // COPPA compliance
      
      // Reporting and analytics
      enableReporting: true,
      logModerationActions: true
    };

    this.blockedPatterns = this.initializeBlockedPatterns();
    this.moderationHistory = [];
  }

  /**
   * Initialize blocked content patterns for detection
   */
  initializeBlockedPatterns() {
    return {
      // Inappropriate content indicators
      inappropriate: [
        'explicit', 'adult', 'nsfw', 'inappropriate', 'obscene',
        'indecent', 'lewd', 'suggestive', 'provocative'
      ],
      
      // Hate speech and discrimination
      hateSpeech: [
        'hate', 'discrimination', 'racist', 'sexist', 'homophobic',
        'transphobic', 'xenophobic', 'bigotry', 'supremacist'
      ],
      
      // Violence and harmful content
      violence: [
        'violence', 'weapon', 'gun', 'knife', 'bomb', 'terrorist',
        'threat', 'harm', 'suicide', 'self-harm', 'abuse'
      ],
      
      // Misleading or fake content
      misleading: [
        'fake', 'impersonate', 'identity theft', 'deepfake',
        'manipulated', 'doctored', 'fabricated'
      ],
      
      // Copyright and trademark violations
      copyright: [
        'copyrighted', 'trademark', 'brand logo', 'corporate logo',
        'celebrity', 'public figure', 'licensed image'
      ]
    };
  }

  /**
   * Primary moderation pipeline for uploaded images
   * @param {Object} imageData - Image data with metadata
   * @param {Object} userContext - User information and permissions
   * @returns {Object} Moderation result with decisions and actions
   */
  async moderateImageUpload(imageData, userContext = {}) {
    const moderationResult = {
      approved: false,
      confidence: 0,
      violations: [],
      warnings: [],
      requiredActions: [],
      moderationId: this.generateModerationId(),
      timestamp: new Date().toISOString(),
      userId: userContext.userId
    };

    try {
      // Step 1: Basic validation and preprocessing
      const validationResult = await this.validateImageBasics(imageData);
      if (!validationResult.valid) {
        moderationResult.violations.push({
          type: 'INVALID_FORMAT',
          severity: 'HIGH',
          message: validationResult.message,
          action: 'REJECT'
        });
        return this.finalizeModerationResult(moderationResult);
      }

      // Step 2: Age verification check
      if (this.moderationConfig.requireAgeVerification) {
        const ageCheck = await this.verifyUserAge(userContext);
        if (!ageCheck.verified) {
          moderationResult.violations.push({
            type: 'AGE_VERIFICATION_REQUIRED',
            severity: 'CRITICAL',
            message: 'Age verification required for service usage',
            action: 'REQUIRE_VERIFICATION'
          });
          return this.finalizeModerationResult(moderationResult);
        }
      }

      // Step 3: Image content analysis
      const contentAnalysis = await this.analyzeImageContent(imageData);
      moderationResult.violations.push(...contentAnalysis.violations);
      moderationResult.warnings.push(...contentAnalysis.warnings);
      moderationResult.confidence = contentAnalysis.confidence;

      // Step 4: Face detection and validation
      const faceAnalysis = await this.analyzeFaceContent(imageData);
      if (!faceAnalysis.validFace) {
        moderationResult.violations.push({
          type: 'NO_VALID_FACE',
          severity: 'MEDIUM',
          message: 'No clear human face detected in image',
          action: 'REJECT'
        });
      }

      // Step 5: Check for celebrity/public figure detection
      const celebrityCheck = await this.detectCelebrity(imageData);
      if (celebrityCheck.isCelebrity) {
        moderationResult.violations.push({
          type: 'CELEBRITY_DETECTED',
          severity: 'HIGH',
          message: 'Possible celebrity or public figure detected',
          action: 'MANUAL_REVIEW'
        });
      }

      // Step 6: Check for copyrighted content
      const copyrightCheck = await this.checkCopyrightViolation(imageData);
      if (copyrightCheck.violation) {
        moderationResult.violations.push({
          type: 'COPYRIGHT_VIOLATION',
          severity: 'CRITICAL',
          message: 'Potential copyright violation detected',
          action: 'REJECT'
        });
      }

      // Step 7: Apply moderation decision logic
      moderationResult.approved = this.calculateModerationDecision(moderationResult);

      // Step 8: Log moderation action
      if (this.moderationConfig.logModerationActions) {
        await this.logModerationAction(moderationResult);
      }

      return this.finalizeModerationResult(moderationResult);

    } catch (error) {
      console.error('Content moderation error:', error);
      
      // Fail-safe: Reject on error for safety
      moderationResult.violations.push({
        type: 'MODERATION_ERROR',
        severity: 'CRITICAL',
        message: 'Content moderation system error - image rejected for safety',
        action: 'REJECT'
      });
      
      return this.finalizeModerationResult(moderationResult);
    }
  }

  /**
   * Validate basic image requirements
   */
  async validateImageBasics(imageData) {
    if (!imageData || !imageData.uri) {
      return { valid: false, message: 'No image provided' };
    }

    // Check file format
    const validFormats = ['jpg', 'jpeg', 'png', 'webp'];
    const format = this.extractImageFormat(imageData.uri);
    if (!validFormats.includes(format.toLowerCase())) {
      return { valid: false, message: 'Unsupported image format' };
    }

    // Check file size (10MB limit)
    if (imageData.fileSize && imageData.fileSize > 10 * 1024 * 1024) {
      return { valid: false, message: 'Image file size too large (10MB max)' };
    }

    // Check minimum dimensions (100x100 minimum)
    if (imageData.width && imageData.height) {
      if (imageData.width < 100 || imageData.height < 100) {
        return { valid: false, message: 'Image too small (minimum 100x100 pixels)' };
      }
    }

    return { valid: true };
  }

  /**
   * Analyze image content for policy violations
   */
  async analyzeImageContent(imageData) {
    const analysis = {
      violations: [],
      warnings: [],
      confidence: 0.85 // Simulated confidence score
    };

    // Simulate AI content analysis (in production, use services like AWS Rekognition, Google Vision API)
    const simulatedAnalysis = {
      nudityDetected: false,
      violenceDetected: false,
      inappropriateContent: false,
      textInImage: false,
      brandLogos: false
    };

    // Check for nudity or explicit content
    if (simulatedAnalysis.nudityDetected) {
      analysis.violations.push({
        type: 'NUDITY_DETECTED',
        severity: 'CRITICAL',
        message: 'Nudity or explicit content detected',
        action: 'REJECT'
      });
    }

    // Check for violence
    if (simulatedAnalysis.violenceDetected) {
      analysis.violations.push({
        type: 'VIOLENCE_DETECTED',
        severity: 'HIGH',
        message: 'Violence or weapons detected',
        action: 'REJECT'
      });
    }

    // Check for inappropriate content
    if (simulatedAnalysis.inappropriateContent) {
      analysis.violations.push({
        type: 'INAPPROPRIATE_CONTENT',
        severity: 'MEDIUM',
        message: 'Inappropriate content detected',
        action: 'REVIEW'
      });
    }

    // Check for text in image (potential copyright)
    if (simulatedAnalysis.textInImage) {
      analysis.warnings.push({
        type: 'TEXT_DETECTED',
        severity: 'LOW',
        message: 'Text detected in image - verify copyright compliance',
        action: 'WARNING'
      });
    }

    return analysis;
  }

  /**
   * Analyze face content and detect inappropriate facial features
   */
  async analyzeFaceContent(imageData) {
    // Simulate face analysis
    const faceAnalysis = {
      validFace: true,
      faceCount: 1,
      minorDetected: false,
      emotionAnalysis: {
        appropriate: true,
        confidence: 0.90
      }
    };

    // Check for multiple faces
    if (faceAnalysis.faceCount > 1) {
      return {
        validFace: false,
        reason: 'Multiple faces detected - headshots should contain one person'
      };
    }

    // Check for no faces
    if (faceAnalysis.faceCount === 0) {
      return {
        validFace: false,
        reason: 'No human face detected in image'
      };
    }

    // Check for potential minor
    if (faceAnalysis.minorDetected) {
      return {
        validFace: false,
        reason: 'Potential minor detected - parental consent required'
      };
    }

    return { validFace: true };
  }

  /**
   * Detect potential celebrity or public figure
   */
  async detectCelebrity(imageData) {
    // Simulate celebrity detection (in production, use services like AWS Rekognition)
    const celebrityCheck = {
      isCelebrity: false,
      confidence: 0.0,
      matchedName: null
    };

    return celebrityCheck;
  }

  /**
   * Check for potential copyright violations
   */
  async checkCopyrightViolation(imageData) {
    // Simulate copyright check (reverse image search, known copyrighted content)
    const copyrightCheck = {
      violation: false,
      source: null,
      confidence: 0.0
    };

    return copyrightCheck;
  }

  /**
   * Verify user age for COPPA compliance
   */
  async verifyUserAge(userContext) {
    if (!userContext.dateOfBirth && !userContext.ageVerified) {
      return { verified: false, reason: 'Age verification required' };
    }

    if (userContext.dateOfBirth) {
      const age = this.calculateAge(userContext.dateOfBirth);
      if (age < this.moderationConfig.minimumAge) {
        return { verified: false, reason: 'User under minimum age requirement' };
      }
    }

    return { verified: true };
  }

  /**
   * Calculate moderation decision based on violations and warnings
   */
  calculateModerationDecision(moderationResult) {
    // Reject if any critical violations
    const criticalViolations = moderationResult.violations.filter(v => v.severity === 'CRITICAL');
    if (criticalViolations.length > 0) {
      return false;
    }

    // Reject if multiple high severity violations
    const highViolations = moderationResult.violations.filter(v => v.severity === 'HIGH');
    if (highViolations.length > 1) {
      return false;
    }

    // For strict mode, reject on any high severity violation
    if (this.moderationConfig.level === 'STRICT' && highViolations.length > 0) {
      return false;
    }

    // Require manual review for certain violations
    const reviewRequired = moderationResult.violations.some(v => v.action === 'MANUAL_REVIEW');
    if (reviewRequired) {
      moderationResult.requiredActions.push('MANUAL_REVIEW');
      return false;
    }

    // Approve if confidence is high and no critical issues
    return moderationResult.confidence >= 0.7;
  }

  /**
   * Moderate user-generated text content
   */
  async moderateTextContent(text, context = {}) {
    const moderationResult = {
      approved: true,
      violations: [],
      filteredText: text,
      moderationId: this.generateModerationId()
    };

    if (!text || text.trim().length === 0) {
      return moderationResult;
    }

    const lowercaseText = text.toLowerCase();

    // Check for hate speech patterns
    const hatePatterns = this.blockedPatterns.hateSpeech;
    for (const pattern of hatePatterns) {
      if (lowercaseText.includes(pattern)) {
        moderationResult.violations.push({
          type: 'HATE_SPEECH',
          severity: 'CRITICAL',
          pattern: pattern,
          action: 'REJECT'
        });
        moderationResult.approved = false;
      }
    }

    // Check for inappropriate content
    const inappropriatePatterns = this.blockedPatterns.inappropriate;
    for (const pattern of inappropriatePatterns) {
      if (lowercaseText.includes(pattern)) {
        moderationResult.violations.push({
          type: 'INAPPROPRIATE_LANGUAGE',
          severity: 'HIGH',
          pattern: pattern,
          action: 'FILTER'
        });
        // Filter out inappropriate content
        moderationResult.filteredText = moderationResult.filteredText.replace(
          new RegExp(pattern, 'gi'), '[FILTERED]'
        );
      }
    }

    return moderationResult;
  }

  /**
   * Handle content violations and user communication
   */
  async handleContentViolation(moderationResult, userContext) {
    const criticalViolations = moderationResult.violations.filter(v => v.severity === 'CRITICAL');
    
    if (criticalViolations.length > 0) {
      // Show user-friendly error message
      const violationType = criticalViolations[0].type;
      const userMessage = this.getUserFriendlyMessage(violationType);
      
      Alert.alert(
        'Content Policy Violation',
        userMessage,
        [
          { text: 'Learn More', onPress: () => this.openContentPolicyPage() },
          { text: 'Try Again', style: 'default' }
        ]
      );

      // Log violation for compliance reporting
      await this.reportViolation(moderationResult, userContext);
    }
  }

  /**
   * Get user-friendly error messages for violations
   */
  getUserFriendlyMessage(violationType) {
    const messages = {
      'NUDITY_DETECTED': 'Please upload a professional photo suitable for workplace use. Inappropriate content is not permitted.',
      'VIOLENCE_DETECTED': 'Images containing violence or weapons are not allowed. Please choose a different photo.',
      'CELEBRITY_DETECTED': 'Please use your own photo rather than celebrity or public figure images.',
      'COPYRIGHT_VIOLATION': 'This image may be copyrighted. Please use only photos you own or have permission to use.',
      'NO_VALID_FACE': 'Please upload a clear photo that shows your face for best headshot results.',
      'AGE_VERIFICATION_REQUIRED': 'Age verification is required to use this service. Please verify you are 13 or older.',
      'INAPPROPRIATE_CONTENT': 'This image doesn\'t meet our community standards. Please upload a professional photo.',
      'MULTIPLE_FACES': 'Please upload a photo with only one person for individual headshot generation.'
    };

    return messages[violationType] || 'This content doesn\'t meet our community guidelines. Please try a different image.';
  }

  /**
   * Generate unique moderation ID for tracking
   */
  generateModerationId() {
    return `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log moderation action for compliance and analytics
   */
  async logModerationAction(moderationResult) {
    const logEntry = {
      moderationId: moderationResult.moderationId,
      timestamp: moderationResult.timestamp,
      userId: moderationResult.userId,
      approved: moderationResult.approved,
      violationCount: moderationResult.violations.length,
      violationTypes: moderationResult.violations.map(v => v.type),
      confidence: moderationResult.confidence,
      action: moderationResult.approved ? 'APPROVED' : 'REJECTED'
    };

    this.moderationHistory.push(logEntry);
    
    // In production, send to analytics service and compliance logging
    console.log('Moderation action logged:', logEntry);
  }

  /**
   * Report violation for compliance tracking
   */
  async reportViolation(moderationResult, userContext) {
    const violationReport = {
      reportId: `violation_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: userContext.userId,
      userEmail: userContext.email,
      violations: moderationResult.violations,
      deviceInfo: userContext.deviceInfo,
      reportedToAuthorities: false,
      reviewStatus: 'PENDING'
    };

    // In production, send to compliance team and potentially authorities if required
    console.log('Violation reported:', violationReport);
    
    return violationReport;
  }

  /**
   * Finalize moderation result and prepare for return
   */
  finalizeModerationResult(moderationResult) {
    // Add summary information
    moderationResult.summary = {
      totalViolations: moderationResult.violations.length,
      criticalViolations: moderationResult.violations.filter(v => v.severity === 'CRITICAL').length,
      warningsCount: moderationResult.warnings.length,
      finalDecision: moderationResult.approved ? 'APPROVED' : 'REJECTED',
      processingTime: new Date().toISOString()
    };

    return moderationResult;
  }

  /**
   * Open content policy page for user education
   */
  openContentPolicyPage() {
    // In production, open app's content policy page or terms of service
    console.log('Opening content policy page...');
  }

  /**
   * Helper methods
   */
  extractImageFormat(uri) {
    return uri.split('.').pop() || 'unknown';
  }

  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Get moderation statistics for compliance reporting
   */
  getModerationStats(timeframe = '24h') {
    const cutoffTime = new Date();
    if (timeframe === '24h') {
      cutoffTime.setHours(cutoffTime.getHours() - 24);
    } else if (timeframe === '7d') {
      cutoffTime.setDate(cutoffTime.getDate() - 7);
    }

    const relevantEntries = this.moderationHistory.filter(
      entry => new Date(entry.timestamp) >= cutoffTime
    );

    return {
      totalRequests: relevantEntries.length,
      approved: relevantEntries.filter(e => e.approved).length,
      rejected: relevantEntries.filter(e => !e.approved).length,
      violationBreakdown: this.getViolationBreakdown(relevantEntries),
      averageConfidence: this.calculateAverageConfidence(relevantEntries)
    };
  }

  getViolationBreakdown(entries) {
    const breakdown = {};
    entries.forEach(entry => {
      entry.violationTypes.forEach(type => {
        breakdown[type] = (breakdown[type] || 0) + 1;
      });
    });
    return breakdown;
  }

  calculateAverageConfidence(entries) {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, entry) => acc + (entry.confidence || 0), 0);
    return sum / entries.length;
  }
}

// Export singleton instance
export default new ContentModerationService();