# LinkedIn Headshot Generator API Documentation

## 📋 Overview

The LinkedIn Headshot Generator API provides endpoints for transforming casual selfies into professional headshots using AI technology. Built with Node.js, Express, integrated with Replicate AI, RevenueCat, and Cloudinary for enterprise-grade image processing.

### Base URL
- **Development**: `http://localhost:3001`
- **Staging**: `https://staging-api.linkedinheadshots.com`
- **Production**: `https://api.linkedinheadshots.com`

### API Version
Current version: `v1`

All API endpoints are prefixed with `/api/v1/`

## 🔐 Authentication

### JWT Token Authentication
Protected endpoints require JWT authentication.

```bash
Authorization: Bearer <jwt_token>
```

### User Registration and Authentication
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "subscription_status": "free",
    "free_credits": 1
  }
}
```

### User Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

## 👤 User Management

### Get User Profile
```http
GET /api/v1/users/profile
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "subscription_status": "premium",
    "subscription_plan": "monthly_unlimited",
    "subscription_expires": "2024-03-01T00:00:00Z",
    "credits_remaining": "unlimited",
    "total_headshots_generated": 47,
    "favorite_style": "corporate",
    "account_created": "2024-01-15T10:00:00Z",
    "last_generation": "2024-02-01T14:30:00Z"
  }
}
```

### Update User Profile
```http
PATCH /api/v1/users/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "John Smith",
  "industry": "Software Development",
  "preferred_styles": ["corporate", "creative", "startup"],
  "notification_preferences": {
    "email_updates": true,
    "new_features": true,
    "marketing": false
  }
}
```

## 🎨 Style Templates

### Get Available Styles
```http
GET /api/v1/styles
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "free_styles": [
      {
        "id": "corporate",
        "name": "Corporate Professional",
        "description": "Traditional business attire with neutral background",
        "preview_url": "https://cdn.example.com/previews/corporate.jpg",
        "industry_focus": ["finance", "consulting", "legal"],
        "formality_level": "high",
        "background_type": "office",
        "lighting_style": "professional"
      },
      {
        "id": "creative",
        "name": "Creative Professional",
        "description": "Modern, approachable style for creative industries",
        "preview_url": "https://cdn.example.com/previews/creative.jpg",
        "industry_focus": ["design", "marketing", "media"],
        "formality_level": "medium",
        "background_type": "modern",
        "lighting_style": "natural"
      },
      {
        "id": "startup",
        "name": "Startup Casual",
        "description": "Tech-friendly casual professional appearance",
        "preview_url": "https://cdn.example.com/previews/startup.jpg",
        "industry_focus": ["tech", "startups", "innovation"],
        "formality_level": "low",
        "background_type": "casual",
        "lighting_style": "bright"
      }
    ],
    "premium_styles": [
      {
        "id": "executive",
        "name": "C-Suite Executive",
        "description": "Premium leadership presence for executives",
        "preview_url": "https://cdn.example.com/previews/executive.jpg",
        "industry_focus": ["executive", "leadership", "board"],
        "formality_level": "very_high",
        "background_type": "luxury",
        "lighting_style": "dramatic",
        "subscription_required": true
      },
      {
        "id": "healthcare",
        "name": "Healthcare Professional",
        "description": "Medical and healthcare industry optimized",
        "preview_url": "https://cdn.example.com/previews/healthcare.jpg",
        "industry_focus": ["healthcare", "medical", "pharmaceutical"],
        "formality_level": "high",
        "background_type": "clinical",
        "lighting_style": "clean",
        "subscription_required": true
      }
    ]
  }
}
```

### Get Style Details
```http
GET /api/v1/styles/{style_id}
Authorization: Bearer <jwt_token>
```

## 📸 Headshot Generation

### Upload Photo and Generate Headshots
```http
POST /api/v1/photos/generate
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

photo: File                           # Required: Source photo (JPEG/PNG, max 10MB)
style: "corporate"                    # Required: Style template ID
quality: "high" | "standard"          # Optional: Output quality (default: high)
custom_parameters: {                  # Optional: Style customizations
  "background_blur": 0.3,
  "brightness_adjustment": 0.1,
  "contrast_enhancement": 0.2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "generation_id": "uuid",
    "status": "processing",
    "estimated_completion": "2024-02-01T15:32:00Z",
    "webhook_url": "https://api.linkedinheadshots.com/webhooks/completion",
    "style_used": "corporate",
    "quality_level": "high",
    "credits_used": 1,
    "credits_remaining": 24,
    "processing_queue_position": 3
  }
}
```

### Check Generation Status
```http
GET /api/v1/photos/generation/{generation_id}/status
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "generation_id": "uuid",
    "status": "completed",
    "progress_percentage": 100,
    "started_at": "2024-02-01T15:30:00Z",
    "completed_at": "2024-02-01T15:31:45Z",
    "processing_time_seconds": 45,
    "result": {
      "generated_photos": [
        {
          "photo_id": "uuid",
          "url": "https://cdn.cloudinary.com/headshot_final.jpg",
          "thumbnail_url": "https://cdn.cloudinary.com/headshot_thumb.jpg",
          "download_url": "https://api.linkedinheadshots.com/api/v1/photos/download/uuid",
          "dimensions": {
            "width": 1024,
            "height": 1024
          },
          "file_size_bytes": 245760,
          "format": "JPEG",
          "quality_score": 96,
          "ai_confidence_score": 94
        }
      ],
      "style_applied": "corporate",
      "enhancements_made": [
        "background_replacement",
        "lighting_enhancement", 
        "color_correction",
        "skin_smoothing",
        "professional_attire"
      ],
      "before_after_comparison": {
        "original_url": "https://cdn.cloudinary.com/original.jpg",
        "enhanced_url": "https://cdn.cloudinary.com/enhanced.jpg"
      }
    }
  }
}
```

### Get Generated Photo
```http
GET /api/v1/photos/{photo_id}
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "photo_id": "uuid",
    "generation_id": "uuid",
    "user_id": "uuid",
    "style": "corporate",
    "original_photo_url": "https://cdn.cloudinary.com/original.jpg",
    "generated_photo_url": "https://cdn.cloudinary.com/generated.jpg",
    "thumbnail_url": "https://cdn.cloudinary.com/thumb.jpg",
    "high_resolution_url": "https://cdn.cloudinary.com/high_res.jpg",
    "download_url": "https://api.linkedinheadshots.com/api/v1/photos/download/uuid",
    "metadata": {
      "dimensions": "1024x1024",
      "file_size": "245KB",
      "format": "JPEG",
      "creation_date": "2024-02-01T15:31:45Z",
      "ai_model_version": "v2.1",
      "processing_parameters": {
        "style": "corporate",
        "quality": "high",
        "background_blur": 0.3
      }
    },
    "analytics": {
      "views": 12,
      "downloads": 3,
      "shares": 1,
      "linkedin_uploads": 1
    },
    "expiry_date": "2024-03-02T15:31:45Z"
  }
}
```

### Download High-Resolution Photo
```http
GET /api/v1/photos/download/{photo_id}
Authorization: Bearer <jwt_token>
```

Returns the high-resolution image file directly.

### Batch Generation
```http
POST /api/v1/photos/batch-generate
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

photo: File                           # Source photo
styles: ["corporate", "creative", "executive"]  # Multiple styles
quality: "high"
priority: "normal" | "high"           # Processing priority
```

## 🛒 Payments & Subscriptions

### Get Pricing Plans
```http
GET /api/v1/payments/plans
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "photo_pack_5",
        "name": "5-Photo Package",
        "type": "one_time",
        "price": 4.99,
        "currency": "USD",
        "credits": 5,
        "description": "Perfect for testing different styles",
        "features": [
          "5 professional headshots",
          "All free styles available",
          "High-resolution downloads",
          "30-day photo storage"
        ],
        "stripe_price_id": "price_photo_pack_5",
        "popular": false
      },
      {
        "id": "photo_pack_10", 
        "name": "10-Photo Package",
        "type": "one_time",
        "price": 7.99,
        "currency": "USD",
        "credits": 10,
        "description": "Great value for multiple looks",
        "features": [
          "10 professional headshots",
          "All free styles available",
          "High-resolution downloads",
          "30-day photo storage",
          "Batch generation"
        ],
        "stripe_price_id": "price_photo_pack_10",
        "popular": true,
        "savings_percentage": 20
      },
      {
        "id": "monthly_unlimited",
        "name": "Monthly Unlimited",
        "type": "subscription",
        "price": 9.99,
        "currency": "USD", 
        "billing_cycle": "monthly",
        "credits": "unlimited",
        "description": "Unlimited generations with premium styles",
        "features": [
          "Unlimited headshot generation",
          "All premium styles included",
          "Priority processing",
          "Batch generation up to 10 styles",
          "Extended 90-day photo storage",
          "Advanced customization options",
          "Email support"
        ],
        "stripe_price_id": "price_monthly_unlimited",
        "trial_days": 7
      }
    ],
    "current_promotions": [
      {
        "code": "FIRST50",
        "description": "50% off first purchase",
        "discount_percentage": 50,
        "valid_until": "2024-02-29T23:59:59Z",
        "applicable_plans": ["photo_pack_5", "photo_pack_10"]
      }
    ]
  }
}
```

### Create Payment Session
```http
POST /api/v1/payments/create-session
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "plan_id": "monthly_unlimited",
  "success_url": "https://yourapp.com/success",
  "cancel_url": "https://yourapp.com/cancel",
  "promotion_code": "FIRST50"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "cs_stripe_session_id",
    "url": "https://checkout.stripe.com/pay/cs_stripe_session_id",
    "expires_at": "2024-02-01T16:30:00Z"
  }
}
```

### Get Purchase History
```http
GET /api/v1/payments/history
Authorization: Bearer <jwt_token>
```

### Cancel Subscription
```http
POST /api/v1/payments/subscription/cancel
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "cancellation_reason": "switching_plans",
  "feedback": "Switching to annual plan"
}
```

## 📊 Analytics & Usage

### Get Usage Statistics
```http
GET /api/v1/analytics/usage
Authorization: Bearer <jwt_token>
?period=month&year=2024
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "month": 2,
    "year": 2024,
    "total_generations": 47,
    "credits_used": 47,
    "credits_remaining": "unlimited",
    "most_used_style": "corporate",
    "style_breakdown": {
      "corporate": 18,
      "creative": 12,
      "startup": 8,
      "executive": 6,
      "healthcare": 3
    },
    "average_processing_time": 42.5,
    "success_rate": 98.3,
    "quality_ratings": {
      "average": 4.7,
      "total_ratings": 23
    },
    "monthly_trend": [
      {
        "date": "2024-02-01",
        "generations": 3,
        "styles": ["corporate", "creative"]
      }
    ]
  }
}
```

### Rate Photo Quality
```http
POST /api/v1/analytics/rate-photo
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "photo_id": "uuid",
  "rating": 5,
  "feedback": "Perfect for my LinkedIn profile!",
  "categories": {
    "realism": 5,
    "professional_appearance": 5, 
    "background_quality": 4,
    "lighting": 5
  }
}
```

### Track Photo Usage
```http
POST /api/v1/analytics/track-usage
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "photo_id": "uuid",
  "action": "linkedin_upload" | "download" | "share",
  "platform": "linkedin" | "other",
  "metadata": {
    "user_agent": "LinkedIn Mobile App",
    "referrer": "linkedin.com"
  }
}
```

## 🔄 Photo Management

### List User Photos
```http
GET /api/v1/photos
Authorization: Bearer <jwt_token>
?limit=20&offset=0&style=corporate&sort=created_desc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "photos": [
      {
        "photo_id": "uuid",
        "style": "corporate",
        "created_at": "2024-02-01T15:31:45Z",
        "thumbnail_url": "https://cdn.cloudinary.com/thumb.jpg",
        "download_url": "https://api.linkedinheadshots.com/api/v1/photos/download/uuid",
        "quality_score": 96,
        "views": 12,
        "downloads": 3,
        "expiry_date": "2024-03-02T15:31:45Z"
      }
    ],
    "pagination": {
      "total": 47,
      "limit": 20,
      "offset": 0,
      "has_next": true
    }
  }
}
```

### Delete Photo
```http
DELETE /api/v1/photos/{photo_id}
Authorization: Bearer <jwt_token>
```

### Extend Photo Storage
```http
POST /api/v1/photos/{photo_id}/extend-storage
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "extension_days": 30
}
```

## 🔍 Quality & Enhancement

### Enhance Existing Photo
```http
POST /api/v1/photos/{photo_id}/enhance
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "enhancements": [
    "skin_smoothing",
    "eye_brightening", 
    "color_correction",
    "background_blur"
  ],
  "intensity": 0.5
}
```

### Compare Styles
```http
POST /api/v1/photos/style-comparison
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

photo: File
styles: ["corporate", "creative", "executive"]
```

### Get Photo Suggestions
```http
GET /api/v1/photos/suggestions
Authorization: Bearer <jwt_token>
?industry=software_development&role=senior_engineer
```

## 🔗 Integrations

### LinkedIn Integration
```http
POST /api/v1/integrations/linkedin/connect
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "linkedin_auth_code": "auth_code_from_linkedin",
  "redirect_uri": "https://yourapp.com/linkedin/callback"
}
```

### Social Media Sharing
```http
POST /api/v1/photos/{photo_id}/share
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "platform": "linkedin" | "facebook" | "twitter",
  "message": "Just updated my professional headshot!",
  "include_watermark": false
}
```

## 🤖 AI Model Information

### Get Model Status
```http
GET /api/v1/ai/model-status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current_model_version": "v2.1",
    "model_capabilities": [
      "professional_styling",
      "background_replacement",
      "lighting_enhancement",
      "color_correction",
      "facial_feature_enhancement"
    ],
    "supported_input_formats": ["JPEG", "PNG"],
    "max_input_resolution": "4096x4096",
    "output_resolution": "1024x1024",
    "average_processing_time": 45,
    "success_rate": 98.7,
    "last_updated": "2024-01-15T10:00:00Z"
  }
}
```

### Report Generation Issue
```http
POST /api/v1/ai/report-issue
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "generation_id": "uuid",
  "issue_type": "poor_quality" | "style_mismatch" | "processing_failed",
  "description": "The background replacement didn't work properly",
  "severity": "low" | "medium" | "high"
}
```

## 🚨 Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "You don't have enough credits. Please purchase a package.",
    "details": {
      "credits_required": 1,
      "credits_available": 0,
      "suggested_action": "purchase_credits"
    }
  },
  "request_id": "req_uuid_here"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_REQUIRED` | 401 | Valid JWT token required |
| `INSUFFICIENT_CREDITS` | 402 | Not enough credits for operation |
| `SUBSCRIPTION_REQUIRED` | 402 | Premium subscription required for style |
| `INVALID_PHOTO_FORMAT` | 400 | Unsupported photo format |
| `PHOTO_TOO_LARGE` | 413 | Photo exceeds 10MB limit |
| `PHOTO_QUALITY_TOO_LOW` | 400 | Photo quality insufficient for processing |
| `FACE_NOT_DETECTED` | 400 | No face detected in uploaded photo |
| `MULTIPLE_FACES_DETECTED` | 400 | Multiple faces detected, single face required |
| `PROCESSING_FAILED` | 500 | AI processing failed |
| `STYLE_NOT_FOUND` | 404 | Requested style template not found |
| `GENERATION_EXPIRED` | 410 | Generation result has expired |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

## 📈 Rate Limiting

### Rate Limits by Subscription

| Subscription | Endpoint Type | Requests/Hour | Concurrent Generations |
|-------------|---------------|---------------|----------------------|
| Free | Generation | 3 | 1 |
| Photo Package | Generation | 20 | 2 |
| Monthly Unlimited | Generation | Unlimited | 5 |
| Monthly Unlimited | Other Endpoints | 1000 | N/A |

### Rate Limit Headers
```http
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 17
X-RateLimit-Reset: 1642789200
X-RateLimit-Type: generation
```

## 🔔 Webhooks

### Configure Webhook URL
```http
POST /api/v1/webhooks/configure
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "url": "https://yourapp.com/webhook",
  "events": [
    "generation.started",
    "generation.completed",
    "generation.failed",
    "payment.succeeded"
  ],
  "secret": "your_webhook_secret"
}
```

### Webhook Events

#### Generation Completed
```json
{
  "event": "generation.completed",
  "data": {
    "user_id": "uuid",
    "generation_id": "uuid",
    "photo_id": "uuid",
    "style": "corporate",
    "processing_time_seconds": 45,
    "result_url": "https://cdn.cloudinary.com/generated.jpg",
    "quality_score": 96
  },
  "timestamp": "2024-02-01T15:31:45Z",
  "webhook_id": "webhook_uuid"
}
```

#### Payment Succeeded
```json
{
  "event": "payment.succeeded",
  "data": {
    "user_id": "uuid",
    "plan_id": "monthly_unlimited",
    "transaction_id": "txn_stripe_id",
    "amount": 9.99,
    "currency": "USD",
    "credits_added": "unlimited"
  },
  "timestamp": "2024-02-01T15:30:00Z",
  "webhook_id": "webhook_uuid"
}
```

## 🧪 Development & Testing

### Health Check
```http
GET /api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-02-01T15:30:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy", 
    "replicate_ai": "healthy",
    "cloudinary": "healthy",
    "stripe": "healthy"
  },
  "performance": {
    "average_response_time_ms": 156,
    "average_generation_time_s": 45,
    "success_rate_24h": 98.7
  }
}
```

### Test Photo Generation
```http
POST /api/v1/test/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "use_sample_photo": true,
  "style": "corporate",
  "test_mode": true
}
```

## 📱 Mobile App Integration

### React Native SDK Example
```javascript
import { LinkedInHeadshotAPI } from '@linkedin-headshot/react-native';

const client = new LinkedInHeadshotAPI({
  apiKey: process.env.LINKEDIN_HEADSHOT_API_KEY,
  environment: 'production'
});

// Generate headshot
const generateHeadshot = async (photoUri, style) => {
  try {
    const result = await client.generateHeadshot({
      photo: photoUri,
      style: style,
      quality: 'high'
    });
    
    return result;
  } catch (error) {
    console.error('Generation failed:', error);
  }
};

// Check generation status
const checkStatus = async (generationId) => {
  const status = await client.getGenerationStatus(generationId);
  return status;
};
```

### iOS SDK Integration
```swift
import LinkedInHeadshotSDK

let client = LinkedInHeadshotClient(apiKey: "your_api_key")

// Generate headshot
client.generateHeadshot(
    photo: photoData,
    style: .corporate,
    quality: .high
) { result in
    switch result {
    case .success(let generation):
        print("Generation started: \\(generation.id)")
    case .failure(let error):
        print("Error: \\(error.localizedDescription)")
    }
}
```

## 🔒 Security Features

### Photo Privacy & Security
- All photos encrypted in transit using TLS 1.3
- Photos encrypted at rest using AES-256
- Automatic photo deletion after expiry period
- No photos used for AI training without consent
- GDPR and CCPA compliant data handling

### Authentication Security
- JWT tokens with short expiration times
- Refresh token rotation
- Rate limiting per user and IP
- Input validation and sanitization
- SQL injection protection

### API Security Headers
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

## 📞 Support & Resources

### API Support
- **Technical Documentation**: Complete guides in repository
- **Status Page**: https://status.linkedinheadshots.com
- **GitHub Issues**: Bug reports and feature requests
- **Email Support**: api-support@linkedinheadshots.com

### Development Resources
- **Swagger/OpenAPI**: Available at `/docs` endpoint
- **Postman Collection**: Download from documentation site  
- **SDK Documentation**: Available for React Native, iOS, and Android
- **Integration Examples**: Sample code in repository

---

**API Version**: 1.0.0  
**Last Updated**: February 1, 2024  
**Swagger Documentation**: Available at `/api/v1/docs`