# Batch Upload Feature - Child Growth Monitor PWA

## 🎉 Feature Overview

The Child Growth Monitor PWA now includes a comprehensive **batch upload system** that allows healthcare workers to efficiently import and manage multiple children's data for mass screening programs.

## ✨ Key Features

### 📊 **Data Import**
- **CSV/Excel Support**: Import children data from CSV or Excel files
- **Drag & Drop Interface**: Intuitive file upload with visual feedback
- **Real-time Validation**: Instant data validation and error reporting
- **Sample Templates**: Generate sample CSV files for easy data preparation

### 🔍 **Data Management**
- **Search & Filter**: Quick search through imported children records
- **Statistics Dashboard**: Real-time counts and data insights
- **Data Persistence**: Browser-based storage (no backend required)
- **Export Capabilities**: Generate Excel files from imported data

### 🏷️ **Unique Identification**
- **QR Code Generation**: Automatic QR codes for each child
- **Unique ID System**: UUID-based identification for mass screening
- **Quick Access**: One-click QR code viewing and sharing

### 🛡️ **Privacy & Security**
- **100% Client-Side**: All data stays on user's device
- **No Backend Required**: Zero server costs and maximum privacy
- **Offline Capable**: Works without internet connection
- **GDPR Compliant**: No data transmission to external servers

## 🚀 How to Use

### 1. Access Batch Upload
- Open the Child Growth Monitor PWA
- Navigate to Home screen
- Click on "Batch Upload" quick action

### 2. Import Data
- **Option A**: Drag and drop CSV/Excel file onto the upload area
- **Option B**: Click "Choose File" to select from device
- **Option C**: Use "Generate Sample CSV" to create a template

### 3. Manage Children Data
- View imported children in the list
- Use search bar to find specific children
- Click on any child to view their QR code
- Export data to Excel format when needed

### 4. Mass Screening Workflow
- Generate QR codes for each child
- Print or display QR codes during screening events
- Use QR codes to quickly identify children during measurements

## 📋 CSV File Format

The system expects CSV files with the following columns:

```csv
name,dateOfBirth,gender,guardianName,guardianContact,location
John Doe,2020-01-15,male,Jane Doe,+1234567890,"123 Main St, City"
Mary Smith,2019-06-20,female,Bob Smith,+0987654321,"456 Oak Ave, Town"
```

### Required Fields
- **name**: Child's full name
- **dateOfBirth**: Date in YYYY-MM-DD format
- **gender**: Either "male" or "female"
- **guardianName**: Parent/guardian full name
- **guardianContact**: Phone number or email

### Optional Fields
- **location**: Address or location information

## 🏗️ Technical Architecture

### Client-Side Implementation
- **SheetJS**: CSV/Excel parsing and generation
- **Browser Storage**: localStorage for data persistence
- **QR Code Generation**: qrcode library for unique identifiers
- **React Native Web**: Cross-platform UI components

### Zero Backend Costs
- **No Server Required**: 100% client-side processing
- **Vercel Deployment**: Static hosting with zero monthly costs
- **Offline Functionality**: Works without internet connection
- **Privacy First**: No data leaves user's device

## 🔧 Development Details

### Key Files Created/Modified
- `src/services/BatchUploadService.ts` - Core batch upload logic
- `src/screens/BatchUploadScreen.tsx` - Main UI component
- `src/styles/colors.ts` - Centralized color system
- `src/styles/typography.ts` - Typography definitions
- `shared/types/index.ts` - Updated navigation types
- `App.tsx` - Added BatchUpload screen to navigation
- `vercel.json` - Deployment configuration

### Dependencies Added
- `xlsx` - Excel/CSV file processing
- `qrcode` - QR code generation
- `uuid` - Unique identifier generation
- `@types/qrcode` - TypeScript definitions

## 🚀 Deployment

The application is configured for **Vercel deployment** with:
- Automatic builds from git repository
- PWA optimization
- Static file serving
- Zero ongoing costs

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from web-app directory
cd web-app
vercel
```

## 📱 Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile Browsers**: Responsive design

## 🔮 Future Enhancements

- **Google Drive Integration**: Direct export to Google Sheets
- **Advanced Filtering**: Filter by age, gender, location
- **Batch Measurements**: Quick measurement entry for multiple children
- **Data Analytics**: Growth trends and population insights
- **Offline Sync**: Synchronization when connection restored

## 🆘 Support

For technical support or feature requests, please refer to the main project documentation or create an issue in the repository.

---

**Built with ❤️ for global child health initiatives**
*Supporting UN SDG Goal 2: Zero Hunger by 2030*