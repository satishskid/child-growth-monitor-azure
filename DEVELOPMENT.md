# Child Growth Monitor - Development Guide

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Expo CLI (will be installed automatically)

### Setup
1. Run the automated setup:
   ```bash
   python3 setup.py
   ```

2. Or set up manually:
   ```bash
   # Install mobile app dependencies
   cd mobile-app && npm install

   # Set up backend
   cd ../backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python init_db.py init

   # Set up ML service
   cd ../ml-service
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

### Running the Application

#### Option 1: VS Code Tasks
- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
- Type "Tasks: Run Task"
- Select "Start All Services"

#### Option 2: Individual Services
```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate && python app.py

# Terminal 2: ML Service  
cd ml-service && source venv/bin/activate && uvicorn main:app --reload --port 8001

# Terminal 3: Mobile App
cd mobile-app && npm start
```

### Service URLs
- **Backend API**: http://localhost:5000
- **ML Service**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **Mobile App**: Follow Expo QR code instructions

## Development Workflow

### Mobile App Development
- Main app code is in `mobile-app/src/`
- Screens are in `mobile-app/src/screens/`
- Services are in `mobile-app/src/services/`
- To add new screens, update `App.tsx` navigation

### Backend Development
- Main Flask app is in `backend/app.py`
- Models are in `backend/app/models/`
- Routes are in `backend/app/routes/`
- Database operations: `python init_db.py [init|migrate|reset|backup|health]`

### ML Service Development
- Main FastAPI app is in `ml-service/main.py`
- Models are in `ml-service/models/`
- Utilities are in `ml-service/utils/`
- Test endpoints at http://localhost:8001/docs

## Project Structure

```
child-growth-monitor/
├── mobile-app/           # React Native app
│   ├── src/
│   │   ├── screens/      # UI screens
│   │   └── services/     # API services
│   ├── App.tsx           # Main app component
│   └── package.json
├── backend/              # Flask API
│   ├── app/
│   │   ├── models/       # Database models
│   │   ├── routes/       # API endpoints
│   │   └── utils/        # Utilities
│   ├── app.py           # Main Flask app
│   └── init_db.py       # Database setup
├── ml-service/          # FastAPI ML service
│   ├── models/          # ML models
│   ├── utils/           # ML utilities
│   └── main.py         # Main FastAPI app
├── shared/              # Shared TypeScript types
└── docs/               # Documentation
```

## Key Features Implemented

### ✅ Completed
- **Mobile App Foundation**: React Native with Expo, navigation setup
- **Core Screens**: Welcome, Login, Home, Consent, Scanning, Results
- **Backend API**: Flask with SQLAlchemy, user auth, child management
- **ML Service**: FastAPI with pose estimation and prediction endpoints
- **Database Models**: Encrypted PII, consent management, scan sessions
- **Security**: Data encryption, authentication middleware
- **VS Code Integration**: Tasks for building and running all services

### 🔄 In Progress
- **Real ML Models**: Currently using mock predictions
- **Azure Integration**: Storage, B2C auth, ML services
- **Offline Functionality**: Data sync when connection restored
- **Testing Suite**: Unit and integration tests

### 📝 Pending
- **WHO Standards**: Complete growth standards implementation
- **Advanced ML**: Actual pose estimation and anthropometric calculations
- **Production Deployment**: Docker containers and CI/CD
- **Documentation**: API documentation and user guides

## Environment Variables

Create `.env` files (automatically created by setup script):

### Mobile App (.env)
```
API_BASE_URL=http://localhost:5000/api
ML_SERVICE_URL=http://localhost:8001
EXPO_DEVELOPMENT_MODE=true
```

### Backend (.env)
```
FLASK_ENV=development
DATABASE_URL=sqlite:///cgm_development.db
SECRET_KEY=your-secret-key
ENCRYPTION_KEY=your-32-character-key
```

### ML Service (.env)
```
ENVIRONMENT=development
CGM_ML_API_PORT=8001
CGM_ML_DEBUG=true
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change ports in .env files
   - Kill existing processes: `lsof -ti:5000 | xargs kill -9`

2. **Python dependencies fail**
   - Ensure Python 3.8+ is installed
   - Try: `pip install --upgrade pip setuptools wheel`

3. **Mobile app won't start**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

4. **Database errors**
   - Reset database: `cd backend && python init_db.py reset`
   - Check database health: `python init_db.py health`

### Getting Help
- Check the logs in each service terminal
- Verify all dependencies are installed
- Ensure all environment variables are set
- Review the API documentation at http://localhost:8001/docs

## Contributing

1. Follow the existing code structure and naming conventions
2. Add proper error handling and logging
3. Update TypeScript types in `shared/types/` when adding new features
4. Test changes across all services
5. Update documentation for new features

## Privacy and Ethics

This application handles sensitive child health data:
- All PII is encrypted at rest
- Consent is required for all scans
- Data minimization principles applied
- GDPR compliance built-in
- Ethical AI practices followed

## License

This project is open source under the GPLv3 license, supporting the UN goal of Zero Hunger by 2030.
