# OmniShot Mobile App - Connectivity & Permissions Troubleshooting Guide

## Issues Fixed in This Update

### 1. API Connectivity Issues ✅ FIXED
**Problem**: "API call failed (GET /health): [TypeError: Network request failed]"

**Solutions Implemented**:
- ✅ Environment-aware API endpoint configuration
- ✅ Automatic detection of device IP for development
- ✅ Retry logic with alternative endpoints
- ✅ Network diagnostics and debugging
- ✅ Better error messages with actionable recommendations

### 2. Android Media Library Permissions ✅ FIXED
**Problem**: "Due to changes in Androids permission requirements, Expo Go can no longer provide full access to the media library"

**Solutions Implemented**:
- ✅ Added proper Android permissions to app.json
- ✅ Added iOS permission descriptions
- ✅ Created development build configuration
- ✅ EAS build setup for full permission access

## Quick Setup Guide

### For Immediate Testing (Expo Go)
1. **Start the backend server**:
   ```bash
   cd backend
   node server.js
   ```

2. **Start Expo with tunnel** (recommended for Expo Go):
   ```bash
   npx expo start --tunnel
   ```

3. **Alternative: Start with clear IP**:
   ```bash
   npx expo start --clear
   ```

### For Full Permissions (Development Build)
1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Build development version**:
   ```bash
   # For Android
   npm run dev-build:android
   
   # For iOS
   npm run dev-build:ios
   ```

4. **Install the development build** on your device and test

## Network Configuration Details

### Automatic Endpoint Detection
The app now automatically detects the correct API endpoint based on your environment:

- **Expo Go**: Uses your machine's IP address from Expo host URI
- **Android Emulator**: Uses `10.0.2.2:3000`
- **iOS Simulator**: Uses `localhost:3000`
- **Physical Device**: Uses your machine's network IP
- **Production**: Uses `https://api.omnishot.app`

### Network Diagnostics
If connectivity fails, the app will:
1. Try the main endpoint with 3 retry attempts
2. Test alternative endpoints automatically
3. Provide detailed diagnostics in console
4. Show helpful recommendations

## Troubleshooting Steps

### If Backend Connection Still Fails

1. **Check if backend is running**:
   ```bash
   curl http://localhost:3000/api/health
   ```
   Should return: `{"success": true, "message": "OmniShot API is healthy"}`

2. **Find your machine's IP address**:
   ```bash
   # On macOS/Linux:
   ipconfig getifaddr en0
   
   # On Windows:
   ipconfig
   ```

3. **Test from your device**:
   - Open browser on your mobile device
   - Navigate to `http://YOUR_IP:3000/api/health`
   - Should see the health check response

4. **Check firewall settings**:
   - Ensure port 3000 is not blocked
   - Allow Node.js through firewall if prompted

### For Android Emulator Issues

If using Android Studio emulator:
```bash
# The emulator uses a special IP for localhost
curl http://10.0.2.2:3000/api/health
```

### For iOS Simulator Issues

```bash
# iOS simulator can use localhost directly
curl http://localhost:3000/api/health
```

### Network Debugging

Enable detailed network logging by checking the console output. Look for:
- 🌐 Network Request logs
- 🔄 API attempt logs
- ✅ Successful connections
- ❌ Failed attempts with reasons

## Permission Issues

### Expo Go Limitations
Expo Go has limited access to device permissions. For full functionality:

1. **Use development build** (recommended)
2. **Or use tunnel mode**:
   ```bash
   npx expo start --tunnel
   ```

### Development Build Benefits
- Full media library access
- All native permissions
- Better performance
- Production-like behavior

## Testing the Fixes

### 1. Test Network Connectivity
1. Start the backend server
2. Launch the app
3. Check console for health check logs
4. Look for "🏥 OmniShot Service Status: Available"

### 2. Test Media Library Access
1. Tap "Upload Photo"
2. Should open photo library without warnings
3. Select a photo successfully

### 3. Test Camera Access
1. Tap "Take Photo"
2. Should open camera without issues
3. Take a photo successfully

## Common Error Messages & Solutions

### "Network request failed"
- ✅ Fixed: App now tries multiple endpoints
- Check: Backend server is running
- Check: Device is on same network as development machine

### "Permission denied - media library"
- ✅ Fixed: Added proper permissions
- Use: Development build for full access
- Alternative: Use tunnel mode in Expo Go

### "API call failed: timeout"
- ✅ Fixed: Better timeout handling and retries
- Check: Network connection stability
- Check: Backend server performance

## Development Build vs Expo Go

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| Media Library | Limited | Full Access ✅ |
| Camera | Works | Works ✅ |
| Network Access | Works | Works ✅ |
| Performance | Good | Better ✅ |
| Debugging | Good | Better ✅ |

## Need More Help?

1. **Check console logs** for detailed error information
2. **Run network diagnostics** - automatically triggered on connection failure
3. **Try tunnel mode** if using Expo Go
4. **Build development version** for full functionality

## Files Modified in This Fix

1. **src/config/environment.js** - Environment configuration
2. **src/services/omnishotApiService.js** - Enhanced network handling
3. **app.json** - Added permissions and bundle IDs
4. **eas.json** - Development build configuration
5. **package.json** - Added build scripts and dependencies
6. **App.js** - Enhanced error handling and diagnostics

All fixes are backward compatible and improve the app experience across all platforms.