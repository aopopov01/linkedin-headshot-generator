# LinkedIn Headshot Generator - React Native App

A professional AI-powered headshot generator app built with React Native, designed specifically for LinkedIn profiles and professional networking.

## 🚀 Project Structure

```
LinkedInHeadshotApp/
├── src/
│   ├── components/
│   │   ├── camera/
│   │   │   ├── PhotoCapture.jsx          # Main photo capture interface
│   │   │   ├── PhotoPreview.jsx          # Image review component (future)
│   │   │   └── PhotoGuidelines.jsx       # Guidelines component (future)
│   │   ├── ai/
│   │   │   ├── StyleSelector.jsx         # Professional style chooser
│   │   │   ├── ProcessingScreen.jsx      # AI generation progress
│   │   │   └── ResultsGallery.jsx        # Generated photos display
│   │   ├── profile/
│   │   │   ├── PaymentScreen.jsx         # In-app purchase interface
│   │   │   ├── UserProfile.jsx           # User account (future)
│   │   │   └── ShareOptions.jsx          # Social sharing (future)
│   │   └── shared/
│   │       ├── Navigation.jsx            # App navigation structure
│   │       ├── LoadingSpinner.jsx        # Loading animations
│   │       └── PremiumBadge.jsx          # Premium feature indicators
│   ├── services/
│   │   ├── aiService.js                  # Replicate API integration
│   │   ├── paymentService.js             # RevenueCat integration
│   │   ├── analyticsService.js           # User behavior tracking
│   │   └── shareService.js               # Social media sharing
│   └── utils/
│       ├── imageProcessing.js            # Photo optimization utilities
│       ├── styleTemplates.js             # Professional headshot styles
│       └── validationRules.js            # Input validation helpers
├── assets/
│   └── style-previews/                   # Style template preview images
├── android/                              # Android-specific files
├── ios/                                  # iOS-specific files
└── App.tsx                              # Main app entry point
```

## 📱 Features Implemented

### ✅ Core Components
- **PhotoCapture**: Camera integration with quality guidelines
- **StyleSelector**: Professional style template chooser
- **ProcessingScreen**: AI generation progress with animations
- **ResultsGallery**: Generated photo display and download
- **PaymentScreen**: In-app purchase interface

### ✅ Services Layer
- **AI Service**: Ready for Replicate API integration
- **Payment Service**: RevenueCat implementation for subscriptions
- **Analytics Service**: User behavior and event tracking
- **Share Service**: Social media sharing functionality

### ✅ Utility Functions
- **Image Processing**: Resize, optimize, and validate photos
- **Style Templates**: 8 professional headshot styles with industry targeting
- **Validation Rules**: Form validation and business rule enforcement

### ✅ Navigation & UI
- **React Navigation**: Stack navigation with proper flow
- **Loading Spinner**: Professional loading animations
- **Premium Badges**: Subscription and premium feature indicators
- **Responsive Design**: Optimized for various screen sizes

## 🛠 Technology Stack

- **Framework**: React Native 0.80.2
- **Navigation**: React Navigation 6
- **Camera**: react-native-image-picker
- **Payments**: react-native-purchases (RevenueCat)
- **Storage**: AsyncStorage
- **Image Processing**: @bam.tech/react-native-image-resizer
- **HTTP Client**: axios
- **File System**: react-native-fs

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **iOS Setup** (macOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Run on Android**
   ```bash
   npx react-native run-android
   ```

4. **Run on iOS** (macOS only)
   ```bash
   npx react-native run-ios
   ```

## 🔧 Configuration Required

### API Keys and Services
Before running the app in production, configure these services:

1. **Replicate API** (AI Generation)
   - Sign up at replicate.com
   - Get API token
   - Update `src/services/aiService.js`

2. **RevenueCat** (Payments)
   - Sign up at revenuecat.com
   - Configure products and offerings
   - Update API keys in `src/services/paymentService.js`

3. **Analytics** (Optional)
   - Configure analytics endpoint
   - Update `src/services/analyticsService.js`

### Environment Variables
Create a `.env` file in the root directory:

```env
REPLICATE_API_TOKEN=your_replicate_token_here
REVENUECAT_API_KEY_IOS=your_ios_api_key_here
REVENUECAT_API_KEY_ANDROID=your_android_api_key_here
ANALYTICS_ENDPOINT=your_analytics_endpoint_here
```

## 📊 App Flow

1. **Photo Capture** → User takes or selects photo
2. **Style Selection** → Choose professional template
3. **AI Processing** → Generate headshots (30-60 seconds)
4. **Results** → View, download, and share photos
5. **Payment** → Upgrade for more features

## 🎨 Professional Styles

- **Corporate**: Traditional business attire (Free)
- **Creative**: Modern, approachable style (Free)
- **Executive**: Premium leadership style (Premium)
- **Startup**: Tech-friendly casual professional (Free)
- **Healthcare**: Medical professional appearance (Premium)
- **Academic**: Scholarly presentation (Premium)
- **Sales**: Energetic, trustworthy style (Free)
- **Consulting**: Strategic, analytical appearance (Premium)

## 💳 Monetization

- **Freemium Model**: 1 free photo, then paid packages
- **Photo Packages**: 5 photos ($4.99), 10 photos ($7.99), 25 photos ($14.99)
- **Monthly Subscription**: $9.99/month unlimited
- **Premium Styles**: Exclusive templates for subscribers

## 🚀 Deployment

### Android
1. Generate signed APK
2. Upload to Google Play Console
3. Configure in-app billing products

### iOS
1. Archive and upload to App Store Connect
2. Configure in-app purchase products
3. Submit for review

## 📈 Analytics Events

The app tracks these key events:
- `app_launched`: App startup
- `photo_captured`: User takes photo
- `style_selected`: Professional style chosen
- `photo_generated`: AI processing completed
- `photo_downloaded`: User downloads result
- `purchase_completed`: Successful payment
- `milestone_reached`: User journey milestones

## 🔐 Privacy & Security

- No photos stored on servers without consent
- All payments processed through secure App Store/Google Play
- User data handled according to privacy policy
- GDPR compliant data handling

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx react-native start --reset-cache
   ```

2. **Android build issues**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

3. **iOS build issues** (macOS)
   ```bash
   cd ios && pod install --repo-update && cd ..
   ```

## 📝 Next Steps

1. **Configure API keys** for Replicate and RevenueCat
2. **Test payment flow** with sandbox accounts
3. **Add app icons** and splash screens
4. **Set up Firebase** for push notifications
5. **Configure deep linking** for sharing
6. **Add analytics** tracking implementation
7. **Implement user authentication** if needed
8. **Add photo storage** and history features

## 🤝 Contributing

This is a foundational setup. Key areas for expansion:
- User authentication system
- Photo history and gallery
- Social sharing integrations
- Advanced AI parameters
- Referral system
- Customer support chat

## 📄 License

Private project - All rights reserved

---

**Ready for Development!** 🚀

The project structure is complete with all core components, services, and utilities implemented. Configure the API keys and start building your AI-powered headshot generator!