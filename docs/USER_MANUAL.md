---
title: "Child Growth Monitor - User Manual"
subtitle: "Smartphone-based Child Malnutrition Detection System"
author: "Child Growth Monitor Team"
date: "July 2025"
version: "3.0.0"
geometry: margin=1in
documentclass: article
fontsize: 11pt
---

# Child Growth Monitor - User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Using the Mobile App](#using-the-mobile-app)
4. [Understanding Results](#understanding-results)
5. [Offline Mode](#offline-mode)
6. [Data Privacy & Security](#data-privacy--security)
7. [Troubleshooting](#troubleshooting)
8. [Support](#support)

## Introduction

The Child Growth Monitor is a revolutionary healthcare application that uses smartphone technology and artificial intelligence to detect child malnutrition. This system enables healthcare workers to quickly and accurately assess child growth using just a smartphone camera, making it ideal for use in remote and resource-limited settings.

### Key Features

- **3D Child Scanning**: Uses smartphone camera for non-contact measurements
- **AI-Powered Analysis**: Computer vision and machine learning for accurate assessments
- **WHO Growth Standards**: Calculations based on World Health Organization standards
- **Offline Capability**: Works without internet connection for rural settings
- **Instant Results**: Real-time analysis and nutritional status assessment
- **Secure Data Handling**: Healthcare-grade data encryption and privacy protection

### Who Should Use This Manual

This manual is designed for:
- Healthcare workers in clinics and hospitals
- Community health volunteers
- Nutrition specialists
- Field workers in humanitarian settings
- Anyone involved in child health monitoring

## Getting Started

### System Requirements

#### Mobile Device Requirements
- **iOS**: iPhone 7 or newer with iOS 12.0+
- **Android**: Android 7.0+ with ARCore support
- **Camera**: Rear-facing camera with autofocus
- **Storage**: At least 2GB available space
- **RAM**: Minimum 3GB recommended

#### Network Requirements
- Internet connection for initial setup and data sync
- Offline mode available for areas with limited connectivity

### Installation

#### Option 1: App Store Installation (Recommended)
1. Open App Store (iOS) or Google Play Store (Android)
2. Search for "Child Growth Monitor"
3. Tap "Install" or "Get"
4. Wait for download and installation to complete

#### Option 2: Development Installation (Healthcare Professionals)
1. Install Expo Go app from your device's app store
2. Scan the QR code provided by your healthcare organization
3. The app will load directly on your device

### Initial Setup

1. **Launch the App**: Tap the Child Growth Monitor icon
2. **Accept Permissions**: Grant camera and storage permissions
3. **Login/Register**: Create an account or login with provided credentials
4. **Organization Setup**: Enter your healthcare organization code
5. **Training Mode**: Complete the optional tutorial (recommended for first-time users)

## Using the Mobile App

### App Navigation

The app consists of five main screens:

1. **Welcome Screen**: Introduction and getting started
2. **Login Screen**: User authentication
3. **Home Screen**: Main dashboard and child management
4. **Consent Screen**: Digital consent management
5. **Scanning Screen**: Child measurement and analysis
6. **Results Screen**: Analysis results and recommendations

### Step-by-Step Process

#### Step 1: Child Registration

1. From the Home screen, tap "Add New Child"
2. Enter child information:
   - **Name**: Child's full name
   - **Date of Birth**: Use date picker for accuracy
   - **Gender**: Select male or female
   - **Guardian Information**: Parent/caregiver details
3. Tap "Save Child" to register

#### Step 2: Obtaining Consent

1. Select the registered child from the list
2. Tap "Start Assessment"
3. **Digital Consent Process**:
   - Explain the process to the guardian
   - Have them read the consent form
   - Guardian signs on the device screen
   - Take a photo of their ID (if required by protocol)
   - Generate consent QR code for records
4. Tap "Proceed to Scanning"

#### Step 3: Child Scanning

The scanning process involves capturing the child from multiple angles:

##### Front View Scan
1. **Position the Child**:
   - Child should stand upright facing the camera
   - Ensure good lighting (natural light preferred)
   - Remove bulky clothing if possible
   - Keep child calm and still
2. **Frame the Shot**:
   - Full body should be visible in frame
   - Child's feet should touch bottom of screen
   - Head should be near top of screen
   - Maintain 2-3 feet distance from child
3. **Capture**:
   - Tap and hold the capture button
   - Keep device steady for 3-5 seconds
   - Wait for green checkmark confirmation

##### Side View Scans
1. **Left Side**: Repeat process with child turned 90° left
2. **Right Side**: Repeat process with child turned 90° right

##### Back View Scan
1. **Back View**: Child facing away from camera
2. Follow same framing and capture process

#### Step 4: Review and Submit

1. **Review Captured Images**: Check all four angles are clear
2. **Retake if Needed**: Tap retake button for any unclear images
3. **Add Notes**: Optional field for additional observations
4. **Submit for Analysis**: Tap "Analyze" to process measurements

### Understanding the Scanning Interface

#### Visual Indicators
- **Green Frame**: Proper positioning detected
- **Red Frame**: Adjust positioning needed
- **Blue Dots**: Key body landmarks detected
- **Progress Bar**: Shows scanning completion status

#### Audio Cues
- **Beep**: Successful image capture
- **Voice Prompts**: Positioning guidance (if enabled)

## Understanding Results

### Measurement Results

The app provides comprehensive anthropometric measurements:

#### Primary Measurements
- **Height/Length**: In centimeters with confidence score
- **Weight**: Estimated weight in kilograms
- **MUAC**: Mid-Upper Arm Circumference in centimeters
- **Head Circumference**: In centimeters

#### Confidence Scores
Each measurement includes a confidence percentage:
- **90-100%**: Excellent measurement quality
- **80-89%**: Good measurement quality
- **70-79%**: Acceptable measurement quality
- **Below 70%**: Consider retaking measurement

### Nutritional Status Assessment

#### WHO Growth Standards
Results are compared against WHO growth standards and presented as:

- **Z-scores**: Standard deviations from mean
- **Percentiles**: Child's position relative to reference population
- **Growth Categories**: Normal, mild, moderate, or severe malnutrition

#### Malnutrition Indicators

##### Stunting (Height-for-Age)
- **Normal**: Z-score > -2
- **Mild Stunting**: Z-score -2 to -2.5
- **Moderate Stunting**: Z-score -2.5 to -3
- **Severe Stunting**: Z-score < -3

##### Wasting (Weight-for-Height)
- **Normal**: Z-score > -2
- **Mild Wasting**: Z-score -2 to -2.5
- **Moderate Wasting**: Z-score -2.5 to -3
- **Severe Wasting**: Z-score < -3

##### Underweight (Weight-for-Age)
- **Normal**: Z-score > -2
- **Mild Underweight**: Z-score -2 to -2.5
- **Moderate Underweight**: Z-score -2.5 to -3
- **Severe Underweight**: Z-score < -3

### Recommendations

The app provides automated recommendations based on nutritional status:

#### Normal Growth
- Continue current feeding practices
- Regular health check-ups
- Monitor growth progress

#### Mild Malnutrition
- Nutritional counseling
- Improved feeding practices
- Follow-up in 4-6 weeks

#### Moderate Malnutrition
- Immediate nutritional intervention
- Possible therapeutic feeding
- Weekly monitoring

#### Severe Malnutrition
- **URGENT**: Immediate medical referral
- Therapeutic feeding program
- Daily monitoring required

### Exporting Results

#### Generate Reports
1. Tap "Generate Report" on results screen
2. Choose format: PDF, Image, or Text
3. Include/exclude specific measurements
4. Add healthcare provider notes

#### Sharing Options
- **Email**: Send to healthcare team
- **Print**: Direct printing to compatible printers
- **Cloud Sync**: Automatic backup to secure servers
- **QR Code**: Generate QR for quick sharing

## Offline Mode

### When to Use Offline Mode

Offline mode is essential for:
- Remote areas with poor internet connectivity
- Emergency situations
- Field work in rural settings
- Temporary network outages

### How Offline Mode Works

1. **Local Processing**: Measurements are processed on the device
2. **Local Storage**: All data is stored securely on the device
3. **Background Sync**: Data uploads automatically when connection returns
4. **Conflict Resolution**: Handles synchronization conflicts intelligently

### Offline Capabilities

#### Available Features
- Child registration
- Consent management
- Scanning and measurements
- Results viewing
- Report generation

#### Limited Features
- User authentication (requires initial online setup)
- Cloud backup (queued for later sync)
- Software updates
- Reference data updates

### Managing Offline Data

#### Storage Monitoring
- Check available storage in app settings
- App shows storage usage and remaining capacity
- Automatic cleanup of old temporary files

#### Sync Management
1. **Manual Sync**: Tap "Sync Now" when connection available
2. **Automatic Sync**: Runs in background when online
3. **Selective Sync**: Choose which data to upload first
4. **Sync Status**: Monitor upload progress and errors

## Data Privacy & Security

### Data Protection Standards

The Child Growth Monitor follows healthcare-grade security standards:

- **HIPAA Compliance**: Meets healthcare privacy requirements
- **GDPR Compliance**: European data protection standards
- **Encryption**: All data encrypted in transit and at rest
- **Access Controls**: Role-based access to sensitive data

### What Data is Collected

#### Child Information
- Name, date of birth, gender
- Growth measurements and photos
- Nutritional status assessments
- Healthcare provider notes

#### User Information
- Healthcare provider credentials
- Organization affiliation
- Usage statistics (anonymized)

#### Technical Information
- Device type and capabilities
- App version and performance data
- Error logs (no personal data)

### Data Rights

#### Your Rights
- **Access**: View all stored data about a child
- **Correction**: Update incorrect information
- **Deletion**: Remove child records completely
- **Portability**: Export data in standard formats

#### Exercising Rights
1. Go to App Settings → Privacy
2. Select the appropriate action
3. Confirm identity verification
4. Download or deletion will be processed within 48 hours

### Data Retention

- **Active Records**: Kept while child is under care
- **Inactive Records**: Automatically deleted after 2 years
- **Legal Requirements**: Some data may be retained longer per local laws
- **User Control**: Manual deletion available at any time

## Troubleshooting

### Common Issues

#### Scanning Problems

**Problem**: Child won't stay still during scanning
**Solutions**:
- Use toys or entertainment to keep child engaged
- Have parent/caregiver nearby for comfort
- Take breaks between different angle captures
- Consider using burst mode for active children

**Problem**: Poor image quality or unclear measurements
**Solutions**:
- Ensure adequate lighting (natural light preferred)
- Clean camera lens
- Maintain proper distance (2-3 feet)
- Remove reflective or bulky clothing
- Check for steady hands during capture

**Problem**: App crashes during scanning
**Solutions**:
- Close other apps to free memory
- Restart the app
- Check available storage space
- Update to latest app version

#### Connectivity Issues

**Problem**: Cannot login or sync data
**Solutions**:
- Check internet connection
- Try switching between WiFi and mobile data
- Restart router/modem if using WiFi
- Contact IT support for organization credentials

**Problem**: Slow upload or sync failures
**Solutions**:
- Check network signal strength
- Try syncing during off-peak hours
- Use WiFi instead of mobile data for large uploads
- Enable background sync in app settings

#### Measurement Accuracy

**Problem**: Measurements seem inaccurate
**Solutions**:
- Verify child's age and gender are correct
- Ensure proper scanning technique
- Check for proper child positioning
- Consider environmental factors (clothing, posture)
- Retake scans if confidence scores are low

**Problem**: Inconsistent results between scans
**Solutions**:
- Allow proper time between measurements
- Ensure consistent positioning and lighting
- Check for child growth or weight changes
- Verify device calibration

### Error Messages

#### "Camera Permission Denied"
1. Go to device Settings → Apps → Child Growth Monitor
2. Enable Camera permission
3. Restart the app

#### "Storage Full"
1. Go to app Settings → Storage
2. Clear old cached data
3. Delete unnecessary photos/videos from device
4. Move data to external storage if available

#### "Network Error"
1. Check internet connection
2. Try switching networks
3. Restart app
4. Contact technical support if persistent

#### "Sync Failed"
1. Check network connectivity
2. Verify user credentials
3. Try manual sync
4. Contact support with error code

### Performance Optimization

#### Device Performance
- Close unnecessary background apps
- Keep at least 1GB free storage
- Regular device restarts
- Update device operating system

#### App Performance
- Update to latest app version
- Clear app cache periodically
- Restart app if sluggish
- Report persistent issues to support

## Support

### Getting Help

#### In-App Support
1. Go to Settings → Help & Support
2. Browse FAQ for common questions
3. Access video tutorials
4. Submit support ticket with details

#### Online Resources
- **User Portal**: Complete documentation and guides
- **Video Library**: Step-by-step video tutorials
- **Community Forum**: Connect with other users
- **Knowledge Base**: Comprehensive troubleshooting guides

### Contact Information

#### Technical Support
- **Email**: support@childgrowthmonitor.org
- **Phone**: +1-800-CGM-HELP (available 24/7)
- **Live Chat**: Available through app or website
- **Response Time**: Within 4 hours for urgent issues

#### Training and Education
- **Training Requests**: training@childgrowthmonitor.org
- **Certification Programs**: Available for healthcare organizations
- **Custom Training**: On-site training for large deployments

#### Partnership and Deployment
- **Healthcare Organizations**: partnerships@childgrowthmonitor.org
- **NGOs and Humanitarian Groups**: ngo@childgrowthmonitor.org
- **Research Collaborations**: research@childgrowthmonitor.org

### Feedback and Suggestions

Your feedback helps improve the Child Growth Monitor:

#### Ways to Provide Feedback
1. **In-App Feedback**: Settings → Send Feedback
2. **User Surveys**: Periodic improvement surveys
3. **Feature Requests**: Suggest new capabilities
4. **Bug Reports**: Report issues with detailed information

#### What to Include
- Specific steps that led to the issue
- Device type and operating system version
- App version number
- Screenshots or screen recordings if applicable
- Any error messages received

---

## Appendix

### Glossary

**Anthropometry**: The measurement of the human body and its parts

**MUAC**: Mid-Upper Arm Circumference, a key indicator of nutritional status

**Stunting**: Impaired growth and development in children due to poor nutrition

**Wasting**: Low weight-for-height, indicating acute malnutrition

**Z-score**: Number of standard deviations from the mean of a reference population

**WHO**: World Health Organization, source of international growth standards

### Quick Reference

#### Age Groups and Measurements
- **0-2 years**: Length (lying down), weight, head circumference
- **2-5 years**: Height (standing), weight, MUAC
- **5+ years**: Height, weight, MUAC (if needed)

#### Emergency Contact Numbers
- **Local Emergency Services**: [Your local number]
- **Child Protection Services**: [Your local number]
- **Nutrition Emergency Hotline**: [Your local number]

### Legal Information

#### Disclaimer
This application is a screening tool and should not replace professional medical diagnosis. Always consult qualified healthcare providers for medical decisions.

#### Regulatory Compliance
The Child Growth Monitor complies with relevant medical device regulations in jurisdictions where it is deployed. Check local regulatory status before use.

#### License Information
This manual and the Child Growth Monitor application are protected by international copyright and licensing agreements. Unauthorized reproduction or distribution is prohibited.

---

*This manual is updated regularly. Check for the latest version at our support portal or within the app settings.*

**Version 3.0.0 - July 2025**  
**© 2025 Child Growth Monitor Team. All rights reserved.**
