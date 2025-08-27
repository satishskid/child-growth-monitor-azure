# Child Growth Monitor PWA - Mobile Deployment Guide

## 📱 Mobile-Ready Features

This PWA includes complete video-based BMI analysis with:

### Core Functionality
- **Video BMI Analysis**: Real-time pose estimation using OpenCV.js
- **Camera Integration**: Access device camera for child scanning
- **Anthropometric Calculations**: Height, weight, BMI, MUAC, head circumference
- **WHO Growth Standards**: Z-score calculations and nutritional status
- **Health Worker Tracking**: Capture examiner details and organization info
- **Offline Capability**: Works without internet connection
- **Data Export**: CSV export with comprehensive measurement data

### Video Analysis Features
- Real-time pose detection and body landmark identification
- Automatic frame quality assessment and selection
- Confidence scoring for measurement reliability
- Multi-angle scanning support (front, back, side views)
- Age and gender-based analysis adjustments

## 🚀 Mobile Installation Options

### Option 1: Direct Web Access
1. Open your mobile browser
2. Navigate to your hosted PWA URL
3. Tap "Add to Home Screen" when prompted
4. The app will install as a native-like application

### Option 2: Local Server Deployment
1. Extract the `child-growth-monitor-mobile-pwa.zip` file
2. Upload the `dist/` folder contents to any web server
3. Access via mobile browser
4. Install as PWA when prompted

### Option 3: Local Development Server
1. Extract the zip file
2. Navigate to the `dist/` folder
3. Run: `python3 -m http.server 8080`
4. Access via `http://localhost:8080` on mobile

## 📋 Usage Instructions

### Video BMI Analysis
1. **Setup**: Enter child details (ID, age, gender)
2. **Health Worker Info**: Add examiner name, organization, location
3. **Camera Access**: Tap "Start Camera" to begin video capture
4. **Scanning**: Select scan type (front/back/side view)
5. **Capture**: Tap "Capture Frame" multiple times for best results
6. **Analysis**: Tap "Analyze Video" to process measurements
7. **Results**: View comprehensive anthropometric data and nutritional status

### Manual Data Entry
1. Use "Start Mass Screening" for traditional measurements
2. Enter height, weight, and health worker details
3. System calculates BMI automatically
4. Data saved locally with timestamp

### Data Management
- **View Data**: See recent measurements with full details
- **Export**: Download CSV with all measurement data
- **Clear**: Remove all stored data when needed

## 🔧 Technical Requirements

### Mobile Browser Support
- **iOS**: Safari 12+ (iOS 12+)
- **Android**: Chrome 70+, Firefox 68+
- **Camera Access**: HTTPS required for camera functionality

### Device Capabilities
- **Camera**: Rear-facing camera recommended for best results
- **Storage**: ~5MB for app + data storage
- **Processing**: Modern smartphone (2018+) for optimal performance

## 🏥 Clinical Usage

### Health Worker Workflow
1. **Setup**: Configure health worker details once per session
2. **Child Registration**: Enter child ID, age, gender
3. **Video Scanning**: Use camera for automated measurements
4. **Quality Check**: Review confidence scores and measurements
5. **Data Export**: Export session data for clinical records

### Data Fields Captured
- Child identification and demographics
- Anthropometric measurements (height, weight, BMI, MUAC, head circumference)
- WHO Z-scores and nutritional status
- Health worker and organization details
- Examination location and timestamp
- Measurement method and confidence scores

## 🔒 Privacy & Security

- **Local Storage**: All data stored locally on device
- **No Cloud Sync**: No automatic data transmission
- **Camera Privacy**: Video processing happens locally
- **Data Control**: Users control all data export and deletion

## 📊 Export Format

CSV export includes:
- Child ID, Height, Weight, BMI, MUAC, Head Circumference
- Age, Gender, Nutritional Status, Confidence Score
- Health Worker, Organization, Location, Method
- Date and Timestamp

## 🆘 Troubleshooting

### Camera Issues
- Ensure HTTPS connection for camera access
- Grant camera permissions when prompted
- Try refreshing the page if camera fails to start

### Performance Issues
- Close other browser tabs for better performance
- Ensure good lighting for video analysis
- Use rear camera for better image quality

### Installation Issues
- Clear browser cache and try again
- Ensure "Add to Home Screen" option is available
- Check browser compatibility

## 📞 Support

For technical support or clinical questions, refer to the main project documentation or contact your system administrator.

---

**Version**: 2.0 with Video BMI Analysis  
**Last Updated**: January 2025  
**Compatibility**: Mobile PWA with OpenCV.js integration