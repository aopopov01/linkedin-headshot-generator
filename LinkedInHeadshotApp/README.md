# OmniShot - AI-Powered Multi-Platform Professional Photos

## 🎯 Overview
A premium React Native application that transforms casual photos into professional headshots optimized for every platform using cutting-edge AI technology. Built for iOS and Android with modern design guidelines, featuring advanced AI integration, premium subscriptions, and comprehensive backend infrastructure.

## ✨ Key Features
- **AI Photo Generation**: Professional photos optimized for multiple platforms in 8 different styles
- **Industry-Specific Templates**: Corporate, Creative, Healthcare, Executive styles
- **Instant Processing**: 30-60 second generation using Replicate AI
- **Premium Quality**: High-resolution outputs optimized for every platform (LinkedIn, Instagram, Facebook, Twitter, etc.)
- **Freemium Model**: 1 free photo, then paid packages
- **Cross-Platform**: Native iOS and Android applications
- **Demo Integration**: Complete web demo and Docker deployment

## 🏗️ Architecture

### Mobile App (React Native 0.80.2)
- **Platform**: iOS-first design with Apple HIG compliance
- **Navigation**: React Navigation 6 with stack-based flow
- **State Management**: React hooks with AsyncStorage persistence
- **Payments**: RevenueCat integration for subscriptions
- **Image Processing**: Native image picker and resizing
- **Analytics**: Built-in user behavior tracking

### Backend API (Node.js + Express)
- **Database**: PostgreSQL with Knex.js migrations
- **AI Integration**: Replicate API for headshot generation
- **File Storage**: Cloudinary for image management
- **Authentication**: JWT-based session management
- **Analytics**: Event tracking and user metrics
- **Rate Limiting**: Express rate limiting and security

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes deployment ready
- **Demo Server**: Standalone web interface
- **Development**: Hot reload and comprehensive testing

## 🚀 Quick Start

### Prerequisites

#### System Requirements
- Node.js 18+ (LTS recommended)
- npm 8+ or Yarn 1.22+
- React Native CLI: `npm install -g @react-native-community/cli`

#### Mobile Development
- **iOS Development** (macOS only):
  - Xcode 14+ with iOS SDK 16+
  - CocoaPods: `bundle install && bundle exec pod install`
  - iOS Simulator or device with iOS 16+
- **Android Development** (optional):
  - Android Studio with Android SDK 31+
  - Android device or emulator with API level 31+

#### Backend Services
- Docker 20.10+ and Docker Compose 2.0+
- PostgreSQL 13+ (or use Docker)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/linkedin-headshot-generator.git
cd linkedin-headshot-generator

# 2. Install mobile app dependencies
cd LinkedInHeadshotApp
npm install

# 3. iOS setup (macOS only)
bundle install
cd ios && bundle exec pod install && cd ..

# 4. Set up backend services
cd ../backend
npm install

# 5. Start database and services
docker-compose up -d

# 6. Run database migrations
npm run migrate

# 7. Start backend development server
npm run dev

# 8. In a new terminal, start mobile app
cd ../LinkedInHeadshotApp

# For iOS:
npx react-native run-ios

# For Android:
npx react-native run-android
```

### Environment Configuration

#### Backend Configuration
Create `/backend/.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://headshot_user:headshot_password@localhost:5432/linkedin_headshots_dev
REDIS_URL=redis://localhost:6379

# AI Services
REPLICATE_API_TOKEN=r8_your_replicate_api_token_here

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Payments
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Analytics
MIXPANEL_TOKEN=your_mixpanel_token

# Security
JWT_SECRET=your_jwt_secret_key_here
ENCRYPTION_KEY=your_32_character_encryption_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Mobile App Configuration
Create `/LinkedInHeadshotApp/.env`:

```env
# API Configuration
API_BASE_URL=http://localhost:3001
API_TIMEOUT_MS=60000

# RevenueCat Configuration
REVENUECAT_API_KEY_IOS=your_ios_api_key
REVENUECAT_API_KEY_ANDROID=your_android_api_key

# Analytics
MIXPANEL_TOKEN=your_mixpanel_token
ANALYTICS_ENDPOINT=http://localhost:3001/api/analytics

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_CRASH_REPORTING=true
DEBUG_MODE=true
```

## 📊 Project Structure
```
linkedin-headshot-generator/
├── LinkedInHeadshotApp/                 # React Native mobile app
│   ├── src/components/                  # UI components
│   │   ├── ai/                          # AI processing components
│   │   ├── camera/                      # Photo capture
│   │   ├── profile/                     # User profile & payments
│   │   └── shared/                      # Reusable components
│   ├── src/services/                    # API integrations
│   ├── src/utils/                       # Helper utilities
│   ├── android/                         # Android configuration
│   └── ios/                             # iOS configuration
├── backend/                             # Node.js API server
│   ├── src/routes/                      # API endpoints
│   ├── src/services/                    # Business logic
│   ├── src/middleware/                  # Express middleware
│   └── migrations/                      # Database migrations
├── demo-web/                            # Web demo interface
├── k8s/                                 # Kubernetes manifests
└── docker-compose.yml                  # Docker configuration
```

## 📱 Professional Styles

### Free Styles (1 photo included)
- **Corporate**: Traditional business professional
- **Creative**: Modern, approachable creative industry
- **Startup**: Tech-friendly casual professional
- **Sales**: Energetic, trustworthy presentation

### Premium Styles (Subscription required)
- **Executive**: C-suite leadership presence
- **Healthcare**: Medical professional appearance
- **Academic**: Scholarly, intellectual presentation
- **Consulting**: Strategic, analytical expertise

## 💰 Monetization Strategy

### Pricing Tiers
- **Free Tier**: 1 headshot in basic style
- **Photo Packages**:
  - 5 photos: $4.99
  - 10 photos: $7.99
  - 25 photos: $14.99
- **Monthly Subscription**: $9.99/month unlimited generations
- **Premium Styles**: Exclusive to subscribers

### Revenue Projections
- Target: $15,000+ monthly revenue by month 3
- Market: 900M+ LinkedIn users globally
- Conversion Rate: 3-5% freemium to paid

## 🧪 Testing

### Development Testing
```bash
# Run mobile app tests
cd LinkedInHeadshotApp
npm test

# Run backend API tests
cd backend
npm test

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

### Demo System
```bash
# Start complete demo environment
./start-demo.sh

# Access demo at http://localhost:3000
# Mobile app connects to http://localhost:3001

# Stop demo environment
./stop-demo.sh
```

## 🚀 Deployment

### Docker Deployment
```bash
# Development environment
docker-compose -f docker-compose.dev.yml up -d

# Production environment
docker-compose up -d

# View service status
docker-compose ps
```

### Kubernetes Deployment
```bash
# Deploy to Kubernetes cluster
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend/

# Check deployment status
kubectl get pods -n linkedin-headshot

# Access services
kubectl get services -n linkedin-headshot
```

### Mobile App Deployment

#### iOS Production Build
```bash
cd LinkedInHeadshotApp
# Configure signing in Xcode
# Archive and upload to App Store Connect
npx react-native run-ios --configuration=Release
```

#### Android Production Build
```bash
cd LinkedInHeadshotApp/android
./gradlew assembleRelease
# APK: app/build/outputs/apk/release/app-release.apk
```

## 🔧 Troubleshooting

### Common Issues

#### Backend Connection Issues
```bash
# Check backend status
curl http://localhost:3001/api/health

# Check database connection
docker-compose logs postgres

# Reset database
docker-compose down -v && docker-compose up -d
npm run migrate
```

#### Mobile App Issues
```bash
# Clear Metro cache
npx react-native start --reset-cache

# iOS build issues
cd ios
rm -rf build Pods Podfile.lock
bundle exec pod install
cd ..

# Android build issues
cd android
./gradlew clean
cd ..
```

#### AI Service Issues
```bash
# Test Replicate API
curl -H "Authorization: Token $REPLICATE_API_TOKEN" \
     https://api.replicate.com/v1/models

# Check rate limits
# Free tier: 100 predictions/month
# Pro tier: $0.0023 per second of compute
```

### Performance Optimization
```bash
# Monitor API response times
curl -w "%{time_total}\\n" -o /dev/null -s http://localhost:3001/api/health

# Check memory usage
docker stats --no-stream

# Scale services
docker-compose up -d --scale backend=2
```

## 📊 Analytics & Monitoring

### Key Metrics Tracked
- User onboarding completion rate
- Photo generation success rate
- Subscription conversion rate
- Style preference analytics
- Revenue per user (RPU)
- Monthly recurring revenue (MRR)

### Performance Monitoring
- API response times
- Image processing duration
- Error rates and crash reports
- User session analytics
- Payment transaction success

## 🔐 Security & Privacy

### Data Protection
- No photos stored without user consent
- Automatic deletion after 30 days
- Encrypted data transmission
- GDPR compliant data handling

### Payment Security
- All payments processed through App Store/Google Play
- RevenueCat handles subscription management
- No credit card data stored in app

## 📄 API Documentation

### Core Endpoints
- `POST /api/photos/generate` - Generate headshot
- `GET /api/photos/:id` - Retrieve generated photo
- `POST /api/users/register` - User registration
- `GET /api/styles` - Available photo styles
- `POST /api/purchases` - Handle purchases

### Authentication
```bash
# JWT token required for authenticated endpoints
Authorization: Bearer <jwt_token>
```

### Rate Limiting
- Free users: 10 requests/hour
- Paid users: 100 requests/hour
- Enterprise: Custom limits

## 🌟 Advanced Features

### Batch Processing
```bash
# Generate multiple styles simultaneously
POST /api/photos/batch-generate
{
  "photo_base64": "data:image/jpeg;base64,...",
  "styles": ["corporate", "creative", "executive"]
}
```

### Style Customization
```bash
# Apply custom parameters to styles
POST /api/photos/generate
{
  "photo_base64": "data:image/jpeg;base64,...",
  "style": "corporate",
  "customizations": {
    "background": "office",
    "lighting": "professional"
  }
}
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open Pull Request

### Code Standards
- TypeScript for type safety
- ESLint configuration enforced
- Prettier for code formatting
- Jest for testing coverage (>80%)

## 📞 Support & Documentation

### Resources
- **API Documentation**: `/docs` endpoint when server running
- **Component Library**: Storybook integration
- **Architecture Diagrams**: Available in `/docs/architecture/`
- **Deployment Guide**: Kubernetes and Docker configurations

### Support Channels
- GitHub Issues for bug reports
- Technical documentation in `/docs/`
- Community discussions and feature requests

## 📜 License

This project is licensed under a proprietary license. All rights reserved.

---

**Ready for Production Deployment** 🚀

Complete professional headshot generation app with enterprise-grade architecture, comprehensive testing, and production-ready deployment configurations.