# OmniShot App Icon Specifications

## Design Concept
The OmniShot app icon features a sophisticated camera aperture design that transforms into a multi-directional arrow system, representing our multi-platform capability. The icon uses our signature Deep Blue gradient background with Orange accents for premium appeal and instant recognition.

## Icon Elements
1. **Background**: Deep Blue gradient (#1B365D to #0F1F3A) with iOS-compliant corner radius
2. **Main Symbol**: Stylized camera aperture with multiple rings for depth
3. **Center Focus**: Orange aperture opening with white highlight
4. **Multi-Platform Arrows**: Four-directional arrows in Orange showing platform reach
5. **Subtle Details**: Corner platform indicators for premium feel

## Required Sizes for iOS

### iPhone
- **180×180px** - iPhone 6 Plus, 6s Plus, 7 Plus, 8 Plus, X, XS, XS Max, 11, 11 Pro, 11 Pro Max (@3x)
- **120×120px** - iPhone 6, 6s, 7, 8, SE (2nd gen), 12 mini, 13 mini (@2x)
- **87×87px** - iPhone 6 Plus, 6s Plus, 7 Plus, 8 Plus (@3x) Settings
- **80×80px** - iPhone 6, 6s, 7, 8, SE (2nd gen), 12 mini, 13 mini (@2x) Settings
- **60×60px** - iPhone (@2x) Settings
- **58×58px** - iPhone 6 Plus, 6s Plus, 7 Plus, 8 Plus (@3x) Spotlight
- **40×40px** - iPhone (@2x) Spotlight

### iPad
- **152×152px** - iPad Pro 12.9", iPad Pro 11", iPad Air (3rd gen), iPad mini (5th gen) (@2x)
- **76×76px** - iPad Pro 12.9", iPad Pro 11", iPad Air (3rd gen), iPad mini (5th gen) (@1x)

### App Store
- **1024×1024px** - App Store listing (no alpha channel, no transparency)

### iOS Universal
- **20×20px** - iPhone/iPad Notifications (@1x)
- **29×29px** - iPhone/iPad Settings (@1x)

## Required Sizes for Android

### Launcher Icons (Adaptive)
- **432×432px** - XXXHDPI (4.0x density)
- **324×324px** - XXHDPI (3.0x density)  
- **216×216px** - XHDPI (2.0x density)
- **162×162px** - HDPI (1.5x density)
- **108×108px** - MDPI (1.0x density) - baseline

### Play Store
- **512×512px** - Google Play Store listing (32-bit PNG with alpha)

### Notification Icons (Monochrome)
- **96×96px** - XXXHDPI (white/transparent only)
- **72×72px** - XXHDPI
- **48×48px** - XHDPI  
- **36×36px** - HDPI
- **24×24px** - MDPI

## Web/Progressive Web App
- **192×192px** - Android Chrome
- **144×144px** - Windows Phone
- **96×96px** - Standard web app
- **72×72px** - iPad homescreen (non-retina)
- **57×57px** - iPhone homescreen (non-retina)
- **32×32px** - Standard favicon
- **16×16px** - Browser favicon

## Design Guidelines

### iOS Compliance
- Use corner radius of 17.5% (179.2px for 1024×1024)
- No transparency in background
- Avoid text in the icon
- Ensure visibility on light and dark backgrounds
- Test at smallest required size (20×20px) for clarity

### Android Compliance  
- Adaptive icons: 108×108dp total, 72×72dp safe area
- Provide both foreground and background layers
- Support monochrome variant for themed icons
- Ensure 1:1 aspect ratio
- Test on various device backgrounds

### Universal Best Practices
- Maintain visual hierarchy at all sizes
- Use consistent color palette across all variants
- Ensure center focal point remains visible when scaled
- Test legibility on both light and dark backgrounds
- Consider accessibility for color-blind users

## Color Specifications
- **Primary Background**: #1B365D (Deep Blue)
- **Secondary Background**: #0F1F3A (Darker Blue for gradient)
- **Accent Color**: #FF6B35 (Orange)
- **Highlight**: #FFFFFF (White)
- **Shadow/Depth**: #000000 at 30% opacity

## Export Settings
- **Format**: PNG (24-bit for most, 32-bit for transparent)
- **Color Profile**: sRGB
- **Compression**: Optimized for web/app distribution
- **Naming Convention**: `icon-[size]x[size].png` (e.g., `icon-120x120.png`)

## Implementation Notes
1. Icons should be exported from the 1024×1024px master file
2. Use bicubic scaling for down-sampling
3. Manual optimization may be needed for very small sizes (≤40px)
4. Test on actual devices at various zoom levels
5. Validate with iOS and Android design guidelines
6. Consider seasonal or promotional variants for special releases

## Brand Consistency
- Icon aligns with overall OmniShot brand identity
- Camera aperture concept reinforces professional photography focus  
- Multi-directional arrows communicate multi-platform capability
- Orange accent provides energy and premium positioning
- Deep blue background ensures professional trust and reliability