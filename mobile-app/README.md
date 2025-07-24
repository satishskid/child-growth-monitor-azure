# Child Growth Monitor - Mobile App Setup & Run Guide 📱

## Overview
The Child Growth Monitor mobile app is built with React Native and Expo, designed for healthcare workers to perform 3D child scanning for malnutrition detection using smartphone technology.

## Prerequisites 📋

### Required Software
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Expo CLI** - Install globally: `npm install -g @expo/cli`
- **Git** for version control

### Mobile Device Setup
- **iOS**: Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) from App Store
- **Android**: Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) from Play Store

### Development Environment
- **macOS**: For iOS simulator (requires Xcode)
- **Any OS**: For Android emulator (requires Android Studio)

## Quick Start 🚀

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd child-growth-monitor

# Navigate to mobile app directory
cd mobile-app

# Install dependencies
npm install
```

### 2. Start Development Server
```bash
# Start Expo development server
npm start
```

### 3. Run on Device/Simulator

#### Option A: Physical Device (Recommended)
1. Open Expo Go app on your phone
2. Scan the QR code displayed in terminal/browser
3. App will load on your device

#### Option B: iOS Simulator (macOS only)
```bash
# Press 'i' in terminal or run:
npm run ios
```

#### Option C: Android Emulator
```bash
# Press 'a' in terminal or run:
npm run android
```

#### Option D: Web Browser
```bash
# Press 'w' in terminal or run:
npm run web
```

## Configuration ⚙️

### Environment Variables
Create `.env` file in `mobile-app/` directory:

```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:5002
EXPO_PUBLIC_ML_SERVICE_URL=http://localhost:8002

# App Configuration
EXPO_PUBLIC_APP_NAME=Child Growth Monitor
EXPO_PUBLIC_VERSION=1.0.0

# Development Settings
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_ENABLE_LOGGING=true
```

### API Endpoints Setup
The app connects to:
- **Backend API**: `http://localhost:5002` (or your deployed URL)
- **ML Service**: `http://localhost:8002` (or your deployed URL)

## Troubleshooting 🔧

### Common Issues

#### 1. "EMFILE: too many open files" (macOS) 🍎
This is a common file watching limit issue on macOS. Multiple solutions available:

**🎯 Option A: Use our macOS script (Recommended)**
```bash
# Use the provided macOS-optimized script
./start_mobile_macos.sh
```

**⚙️ Option B: Manual file descriptor increase**
```bash
# Check current limit
ulimit -n

# Increase limit (session-only)
ulimit -n 65536

# Start Expo
npm start
```

**🔧 Option C: Permanent system-wide fix**
```bash
# Create/edit launchd limit file
sudo nano /Library/LaunchDaemons/limit.maxfiles.plist

# Add this content:
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>limit.maxfiles</string>
    <key>ProgramArguments</key>
    <array>
      <string>launchctl</string>
      <string>limit</string>
      <string>maxfiles</string>
      <string>65536</string>
      <string>65536</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>ServiceIPC</key>
    <false/>
  </dict>
</plist>

# Set permissions and load
sudo chown root:wheel /Library/LaunchDaemons/limit.maxfiles.plist
sudo launchctl load -w /Library/LaunchDaemons/limit.maxfiles.plist

# Restart required
```

**🚫 Option D: Disable file watching (fallback)**
```bash
WATCHMAN_DISABLE_FILE_WATCH=1 npm start
```

**🌐 Option E: Use tunnel mode**
```bash
npm start -- --tunnel
```

#### 2. Package Version Conflicts
```bash
# Fix package versions automatically
npx expo install --fix

# Or manually update
npm update
```

#### 3. Metro Bundler Issues
```bash
# Clear Metro cache
npx expo start -c

# Or clear npm cache
npm start -- --reset-cache
```

#### 4. Network Connection Issues
- Ensure your computer and phone are on the same WiFi network
- Check firewall settings aren't blocking Expo
- Try using tunnel mode: `npm start -- --tunnel`

#### 5. Expo Go App Not Loading
- Update Expo Go app to latest version
- Restart Expo Go app
- Clear Expo Go app cache

### Platform-Specific Issues

#### macOS Optimizations 🍎
```bash
# Quick start with all macOS optimizations
./start_mobile_macos.sh

# Manual optimizations
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
export WATCHMAN_DISABLE_FILE_WATCH=1  # If still having issues
ulimit -n 65536
npm start
```

**Common macOS Issues:**
- **File descriptor limits**: Use `ulimit -n 65536` or permanent fix above
- **Firewall blocking**: Allow Node.js through macOS firewall
- **Network discovery**: Ensure iPhone and Mac on same WiFi
- **Developer tools**: Install Xcode command line tools: `xcode-select --install`

#### iOS
- Ensure iOS simulator is installed (Xcode required)
- For physical device: Enable Developer Mode in iOS Settings

#### Android
- Ensure Android Studio and emulator are properly set up
- Enable USB debugging for physical device
- Check Android SDK path is correctly configured

## Development Commands 🛠️

### Available Scripts
```bash
# Start development server
npm start

# Start specific platforms
npm run android    # Android emulator/device
npm run ios        # iOS simulator/device  
npm run web        # Web browser

# Code quality
npm run lint       # ESLint code checking
npm run type-check # TypeScript type checking

# Testing
npm test           # Run test suite
npm run test:watch # Watch mode testing

# Building
npm run build      # Build for production
```

### Useful Expo Commands
```bash
# Clear cache and restart
npx expo start --clear

# Install compatible package versions
npx expo install --fix

# Check bundle size
npx expo bundle-analyzer

# Run on specific device
npx expo start --ios
npx expo start --android
npx expo start --web
```

## Project Structure 📁

```
mobile-app/
├── App.tsx                 # Main app component
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── babel.config.js        # Babel configuration
├── .env                   # Environment variables
└── src/
    ├── screens/           # App screens
    │   ├── WelcomeScreen.tsx
    │   ├── LoginScreen.tsx
    │   ├── ConsentScreen.tsx
    │   ├── ScanningScreen.tsx
    │   ├── ResultsScreen.tsx
    │   └── HomeScreen.tsx
    ├── services/          # API services
    │   ├── AuthService.tsx
    │   └── DataService.tsx
    ├── components/        # Reusable components
    ├── navigation/        # Navigation setup
    ├── utils/            # Utility functions
    └── types/            # TypeScript types
```

## Features & Capabilities 🌟

### Current Features
- ✅ User authentication and consent management
- ✅ QR code scanning for parent consent
- ✅ 3D child scanning using device camera
- ✅ Offline data storage and sync
- ✅ Real-time anthropometric analysis
- ✅ WHO growth standards integration
- ✅ Multi-language support
- ✅ Accessibility features for healthcare workers

### Planned Features
- 🔄 Advanced camera calibration
- 🔄 Batch scan processing
- 🔄 Enhanced data visualization
- 🔄 Integration with health management systems
- 🔄 Telemedicine consultation features

## Performance Optimization 🚀

### Tips for Better Performance
1. **Use Expo Go for development** - Faster reload times
2. **Enable Hermes** - Better JavaScript performance
3. **Optimize images** - Use appropriate formats and sizes
4. **Minimize bundle size** - Remove unused dependencies
5. **Use production builds** - For performance testing

### Memory Management
- Monitor memory usage during scanning
- Implement proper cleanup for camera resources
- Use lazy loading for heavy components
- Optimize image processing pipeline

## Security Considerations 🔒

### Data Protection
- All child data is encrypted at rest and in transit
- Biometric data is anonymized before ML processing
- GDPR compliance built-in
- Secure authentication with JWT tokens
- No sensitive data stored in device logs

### Privacy Features
- Automatic data anonymization
- Consent verification with QR codes
- Local data encryption
- Secure API communication

## Testing 🧪

### Manual Testing
1. Start the app using instructions above
2. Navigate through all screens
3. Test camera functionality
4. Verify API connectivity
5. Test offline mode

### Automated Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests (if configured)
npm run test:e2e
```

## Deployment 📦

### Development Build
```bash
# Create development build
npx expo build:ios
npx expo build:android
```

### Production Build
```bash
# Build for app stores
eas build --platform ios
eas build --platform android
```

## Getting Help 🆘

### Resources
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Child Growth Monitor Documentation](../docs/)

### Common Solutions
1. **App won't start**: Check Node.js version and dependencies
2. **QR code won't scan**: Ensure devices are on same network
3. **Build errors**: Run `npx expo install --fix`
4. **Performance issues**: Use production build for testing

### Support
For technical issues:
1. Check this README
2. Review error logs in Expo CLI
3. Check browser console (web version)
4. Create issue in project repository

## Next Steps 🎯

After getting the mobile app running:
1. **Test with backend**: Ensure API connectivity
2. **Test ML integration**: Verify image processing
3. **Setup authentication**: Configure user accounts
4. **Test offline mode**: Verify local data storage
5. **Performance testing**: Test on target devices

---

## Quick Reference 📝

### Essential Commands
```bash
# Start development
cd mobile-app && npm start

# Fix common issues
npx expo install --fix
npx expo start --clear

# Platform specific
npm run ios     # iOS
npm run android # Android
npm run web     # Browser
```

### Important URLs
- Development server: `http://localhost:8081`
- Backend API: `http://localhost:5002`
- ML Service: `http://localhost:8002`

### File Locations
- Environment config: `mobile-app/.env`
- App entry point: `mobile-app/App.tsx`
- Main screens: `mobile-app/src/screens/`
