# Child Growth Monitor Development Workspace

A comprehensive development environment for the Child Growth Monitor project - using smartphone technology and AI to detect child malnutrition and support the UN goal of Zero Hunger by 2030.

## 🎯 Project Overview

The Child Growth Monitor is a humanitarian technology solution that enables frontline healthcare workers to quickly and accurately assess child malnutrition using just a smartphone. The system uses 3D scanning, computer vision, and machine learning to measure child anthropometrics without physical contact.

## 🏗️ Architecture

This workspace contains three main components:

### 📱 Mobile App (`mobile-app/`)
- **Technology**: React Native with Expo
- **Features**: 3D child scanning, offline-first design, consent management
- **Platforms**: iOS and Android with ARCore/ARKit integration

### 🔧 Backend (`backend/`)
- **Technology**: Python Flask with Azure integration
- **Features**: REST API, authentication, data processing, storage management
- **Database**: PostgreSQL with Azure Storage for media files

### 🤖 ML Service (`ml-service/`)
- **Technology**: Python with TensorFlow/PyTorch
- **Features**: 3D pose estimation, anthropometric prediction, model training
- **Integration**: Azure ML for cloud-based processing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.9+
- Docker (optional, for containerized development)
- Expo CLI for mobile development
- Azure CLI for cloud services

### Setup All Components

1. **Install dependencies for all components:**
   ```bash
   # Mobile app
   cd mobile-app && npm install
   
   # Backend
   cd ../backend && pip install -r requirements.txt
   
   # ML service
   cd ../ml-service && pip install -r requirements.txt
   ```

2. **Start development servers:**
   ```bash
   # Terminal 1: Backend API
   cd backend && python app.py
   
   # Terminal 2: ML service
   cd ml-service && python main.py
   
   # Terminal 3: Mobile app
   cd mobile-app && npm start
   ```

3. **Environment setup:**
   - Copy `.env.example` files in each directory and configure
   - Set up Azure credentials for cloud services
   - Configure database connections

## 📁 Project Structure

```
child-gm/
├── mobile-app/           # React Native mobile application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── screens/      # App screens (scanning, results, etc.)
│   │   ├── services/     # API and data services
│   │   └── utils/        # Utility functions
│   ├── __tests__/        # Mobile app tests
│   └── package.json
├── backend/              # Flask API backend
│   ├── app/
│   │   ├── models/       # Database models
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   └── utils/        # Backend utilities
│   ├── tests/            # Backend tests
│   └── requirements.txt
├── ml-service/           # Machine learning pipeline
│   ├── models/           # ML model definitions
│   ├── training/         # Model training scripts
│   ├── inference/        # Prediction services
│   └── data/             # Data processing utilities
├── shared/               # Shared code and types
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Common utilities
├── docs/                 # Documentation
│   ├── api.md            # API documentation
│   ├── deployment.md     # Deployment guides
│   └── setup.md          # Setup instructions
└── .github/              # GitHub configuration
    └── copilot-instructions.md
```

## 🛠️ Development

### Mobile App Development
```bash
cd mobile-app
npm run start          # Start Expo development server
npm run android        # Run on Android emulator
npm run ios           # Run on iOS simulator
npm test              # Run tests
```

### Backend Development
```bash
cd backend
python app.py          # Start Flask development server
python -m pytest      # Run tests
flask db upgrade       # Run database migrations
```

### ML Service Development
```bash
cd ml-service
python main.py         # Start ML service
python train.py        # Train models
python evaluate.py     # Evaluate model performance
```

## 🔐 Security & Privacy

This project handles sensitive child health data. Please follow these guidelines:

- **Data Encryption**: All data encrypted in transit and at rest
- **Consent Management**: Proper consent workflows with QR verification
- **Access Control**: Role-based access with minimal permissions
- **Anonymization**: Remove PII before ML processing
- **Compliance**: GDPR and healthcare data protection standards

## 🧪 Testing

- **Unit Tests**: Individual component testing
- **Integration Tests**: API and service integration
- **E2E Tests**: Complete workflow testing
- **ML Validation**: Model accuracy and performance testing

## 📊 Key Features

- ✅ **Contactless Measurement**: 3D scanning without physical contact
- ✅ **Offline-First**: Works in areas with limited connectivity
- ✅ **AI-Powered**: Machine learning for accurate predictions
- ✅ **Privacy-Focused**: Ethical data handling and consent management
- ✅ **Cloud Integration**: Azure services for scalability
- ✅ **Multi-Platform**: iOS and Android support

## 🌍 Impact

This technology supports humanitarian efforts to:
- Detect malnutrition early before visible symptoms
- Provide healthcare workers with accurate measurement tools
- Enable rapid response in crisis situations
- Support the UN Sustainable Development Goal of Zero Hunger

## 📞 Support

- **Project Website**: [childgrowthmonitor.org](https://childgrowthmonitor.org)
- **Email**: info@childgrowthmonitor.org
- **Documentation**: See `docs/` directory
- **Issues**: Use GitHub issues for bug reports and feature requests

## 📝 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

---

**Note**: This project handles sensitive health data of children. Please ensure you understand and comply with all ethical, legal, and privacy requirements before contributing or deploying.
