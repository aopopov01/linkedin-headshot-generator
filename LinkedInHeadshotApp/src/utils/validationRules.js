// Validation rules and utilities for the LinkedIn Headshot app

export const ValidationRules = {
  
  // Email validation
  email: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: 'Please enter a valid email address',
    
    validate: (email) => {
      if (!email) return { isValid: false, message: 'Email is required' };
      if (!ValidationRules.email.pattern.test(email.trim())) {
        return { isValid: false, message: ValidationRules.email.message };
      }
      return { isValid: true };
    }
  },

  // Password validation
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, and number',
    
    validate: (password) => {
      if (!password) return { isValid: false, message: 'Password is required' };
      if (password.length < ValidationRules.password.minLength) {
        return { isValid: false, message: `Password must be at least ${ValidationRules.password.minLength} characters` };
      }
      if (!ValidationRules.password.pattern.test(password)) {
        return { isValid: false, message: ValidationRules.password.message };
      }
      return { isValid: true };
    }
  },

  // Name validation
  name: {
    pattern: /^[a-zA-Z\s'-]{2,50}$/,
    message: 'Name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes',
    
    validate: (name) => {
      if (!name) return { isValid: false, message: 'Name is required' };
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        return { isValid: false, message: 'Name must be at least 2 characters' };
      }
      if (trimmedName.length > 50) {
        return { isValid: false, message: 'Name must be less than 50 characters' };
      }
      if (!ValidationRules.name.pattern.test(trimmedName)) {
        return { isValid: false, message: ValidationRules.name.message };
      }
      return { isValid: true };
    }
  },

  // Phone number validation (basic)
  phone: {
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    message: 'Please enter a valid phone number',
    
    validate: (phone) => {
      if (!phone) return { isValid: true }; // Phone is optional
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      if (!ValidationRules.phone.pattern.test(cleanPhone)) {
        return { isValid: false, message: ValidationRules.phone.message };
      }
      return { isValid: true };
    }
  },
};

// Image validation rules
export const ImageValidation = {
  
  // Supported image formats
  supportedFormats: ['jpg', 'jpeg', 'png', 'heic', 'heif'],
  
  // File size limits
  maxFileSize: 10 * 1024 * 1024, // 10MB
  minFileSize: 10 * 1024, // 10KB
  
  // Image dimension limits
  minWidth: 200,
  minHeight: 200,
  maxWidth: 4096,
  maxHeight: 4096,
  
  // Validate image file
  validateImageFile: (imageInfo) => {
    const errors = [];
    const warnings = [];
    
    // Check file size
    if (imageInfo.fileSize) {
      if (imageInfo.fileSize > ImageValidation.maxFileSize) {
        errors.push(`Image file is too large (${Math.round(imageInfo.fileSize / 1024 / 1024)}MB). Maximum size is 10MB.`);
      }
      if (imageInfo.fileSize < ImageValidation.minFileSize) {
        errors.push('Image file is too small. Please select a higher quality image.');
      }
    }
    
    // Check dimensions
    if (imageInfo.width && imageInfo.height) {
      if (imageInfo.width < ImageValidation.minWidth || imageInfo.height < ImageValidation.minHeight) {
        errors.push(`Image resolution is too low (${imageInfo.width}x${imageInfo.height}). Minimum resolution is ${ImageValidation.minWidth}x${ImageValidation.minHeight}.`);
      }
      
      if (imageInfo.width > ImageValidation.maxWidth || imageInfo.height > ImageValidation.maxWidth) {
        warnings.push(`Image resolution is very high (${imageInfo.width}x${imageInfo.height}). This may slow down processing.`);
      }
      
      // Check aspect ratio
      const aspectRatio = imageInfo.width / imageInfo.height;
      if (aspectRatio < 0.5 || aspectRatio > 2.0) {
        warnings.push('For best results, use an image with an aspect ratio closer to square (1:1).');
      }
      
      // Recommend minimum size for quality
      if (imageInfo.width < 800 || imageInfo.height < 800) {
        warnings.push('For best quality results, use an image at least 800x800 pixels.');
      }
    }
    
    // Check format
    if (imageInfo.type || imageInfo.fileName) {
      const format = imageInfo.type?.toLowerCase() || 
                    imageInfo.fileName?.split('.').pop()?.toLowerCase();
      
      if (format && !ImageValidation.supportedFormats.includes(format)) {
        errors.push(`Image format '${format}' is not supported. Please use: ${ImageValidation.supportedFormats.join(', ')}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.length === 0,
    };
  },
  
  // Get image quality recommendations
  getQualityRecommendations: () => [
    'Use good lighting - natural light from a window works best',
    'Ensure your face is clearly visible and well-lit',
    'Look directly at the camera with a professional expression',
    'Use a plain or simple background',
    'Make sure your shoulders are visible in the frame',
    'Avoid shadows across your face',
    'Keep the image sharp and in focus',
  ],
};

// Form validation utilities
export const FormValidation = {
  
  // Validate entire form
  validateForm: (formData, rules) => {
    const errors = {};
    let isValid = true;
    
    Object.keys(rules).forEach(field => {
      if (rules[field] && typeof rules[field].validate === 'function') {
        const validation = rules[field].validate(formData[field]);
        if (!validation.isValid) {
          errors[field] = validation.message;
          isValid = false;
        }
      }
    });
    
    return { isValid, errors };
  },
  
  // Real-time field validation
  validateField: (fieldName, value, rule) => {
    if (rule && typeof rule.validate === 'function') {
      return rule.validate(value);
    }
    return { isValid: true };
  },
  
  // Password confirmation validation
  validatePasswordConfirmation: (password, confirmPassword) => {
    if (!confirmPassword) {
      return { isValid: false, message: 'Please confirm your password' };
    }
    if (password !== confirmPassword) {
      return { isValid: false, message: 'Passwords do not match' };
    }
    return { isValid: true };
  },
  
  // Terms acceptance validation
  validateTermsAcceptance: (accepted) => {
    if (!accepted) {
      return { isValid: false, message: 'You must accept the terms and conditions' };
    }
    return { isValid: true };
  },
};

// Business rules validation
export const BusinessRules = {
  
  // Validate user can generate photos
  canGeneratePhotos: (userInfo) => {
    const errors = [];
    
    // Check subscription status
    if (!userInfo.hasActiveSubscription && userInfo.remainingCredits <= 0) {
      errors.push('No photo generation credits remaining. Please purchase a package or subscribe.');
    }
    
    // Check daily limits (if any)
    if (userInfo.dailyGenerations >= 50) {
      errors.push('Daily generation limit reached. Please try again tomorrow.');
    }
    
    // Check if account is in good standing
    if (userInfo.accountStatus === 'suspended') {
      errors.push('Account is suspended. Please contact support.');
    }
    
    return {
      canGenerate: errors.length === 0,
      errors,
    };
  },
  
  // Validate purchase attempt
  canMakePurchase: (userInfo, productInfo) => {
    const errors = [];
    
    // Check if already has active subscription for subscription products
    if (productInfo.type === 'subscription' && userInfo.hasActiveSubscription) {
      errors.push('You already have an active subscription.');
    }
    
    // Check minimum purchase requirements
    if (productInfo.price <= 0) {
      errors.push('Invalid product price.');
    }
    
    return {
      canPurchase: errors.length === 0,
      errors,
    };
  },
  
  // Validate style selection
  validateStyleSelection: (styleId, userInfo) => {
    const errors = [];
    
    // Check if style requires premium access
    const STYLE_TEMPLATES = require('./styleTemplates').default;
    const style = STYLE_TEMPLATES[styleId];
    
    if (!style) {
      errors.push('Invalid style selection.');
    } else if (style.pricing === 'premium' && !userInfo.hasPremiumAccess) {
      errors.push('This style requires a premium subscription or package.');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

// Input sanitization utilities
export const InputSanitization = {
  
  // Sanitize text input
  sanitizeText: (text, maxLength = 1000) => {
    if (!text) return '';
    
    return text
      .trim()
      .substring(0, maxLength)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/[<>]/g, ''); // Remove HTML brackets
  },
  
  // Sanitize email
  sanitizeEmail: (email) => {
    if (!email) return '';
    return email.trim().toLowerCase();
  },
  
  // Sanitize filename
  sanitizeFilename: (filename) => {
    if (!filename) return '';
    
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars
      .replace(/_{2,}/g, '_') // Replace multiple underscores
      .substring(0, 100); // Limit length
  },
};

// Export all validation utilities
export default {
  ValidationRules,
  ImageValidation,
  FormValidation,
  BusinessRules,
  InputSanitization,
};