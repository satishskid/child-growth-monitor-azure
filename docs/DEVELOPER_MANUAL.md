---
title: "Child Growth Monitor - Developer Manual"
subtitle: "Technical Documentation and Development Guide"
author: "Child Growth Monitor Development Team"
date: "July 2025"
version: "3.0.0"
geometry: margin=1in
documentclass: article
fontsize: 10pt
---

# Child Growth Monitor - Developer Manual

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Environment Setup](#development-environment-setup)
3. [Mobile App Development](#mobile-app-development)
4. [Backend API Development](#backend-api-development)
5. [ML Service Development](#ml-service-development)
6. [Database Management](#database-management)
7. [Security Implementation](#security-implementation)
8. [Testing Strategies](#testing-strategies)
9. [Deployment Guide](#deployment-guide)
10. [API Documentation](#api-documentation)
11. [Troubleshooting](#troubleshooting)
12. [Contributing Guidelines](#contributing-guidelines)

## Architecture Overview

### System Architecture

The Child Growth Monitor is built as a microservices architecture with three main components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │  Backend API    │    │   ML Service    │
│  (React Native) │◄──►│    (Flask)      │◄──►│   (FastAPI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │    Database     │              │
         └──────────────►│  (PostgreSQL)   │◄─────────────┘
                        └─────────────────┘
```

### Technology Stack

#### Mobile Application
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **State Management**: React Context API
- **Storage**: AsyncStorage + SQLite
- **Camera**: Expo Camera with ARKit/ARCore
- **Networking**: Fetch API with retry logic

#### Backend API
- **Framework**: Flask with SQLAlchemy
- **Language**: Python 3.9+
- **Database**: PostgreSQL (SQLite for development)
- **Authentication**: JWT tokens
- **Encryption**: Fernet symmetric encryption
- **File Storage**: Azure Blob Storage
- **Documentation**: OpenAPI/Swagger

#### ML Service
- **Framework**: FastAPI
- **Language**: Python 3.9+
- **Computer Vision**: OpenCV, MediaPipe
- **Machine Learning**: scikit-learn, TensorFlow
- **Image Processing**: PIL, NumPy
- **Growth Standards**: WHO reference data
- **Documentation**: Auto-generated OpenAPI

#### Infrastructure
- **Containerization**: Docker with Docker Compose
- **Cloud Platform**: Azure (with AWS/GCP support)
- **CI/CD**: GitHub Actions
- **Monitoring**: Azure Monitor, Application Insights
- **Authentication**: Azure B2C

### Data Flow

1. **Mobile App** captures child images using camera
2. **Image Processing** converts to base64 and compresses
3. **Backend API** handles authentication and data storage
4. **ML Service** processes images for anthropometric analysis
5. **WHO Standards** calculate growth percentiles and nutritional status
6. **Results** returned to mobile app for display
7. **Data Sync** handles offline/online synchronization

## Development Environment Setup

### Prerequisites

#### System Requirements
- **Operating System**: macOS, Linux, or Windows 10/11
- **Node.js**: Version 16.0 or higher
- **Python**: Version 3.9 or higher
- **Git**: Latest version
- **Docker**: Latest version (optional but recommended)

#### Development Tools
- **IDE**: Visual Studio Code (recommended)
- **Mobile Testing**: iOS Simulator (macOS) or Android Emulator
- **API Testing**: Postman or similar
- **Database**: PostgreSQL (or SQLite for local development)

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/your-org/child-growth-monitor.git
cd child-growth-monitor

# Install global dependencies
npm install -g @expo/cli
pip install virtualenv

# Setup all services
./setup.sh
```

### Detailed Setup

#### 1. Mobile App Setup

```bash
# Navigate to mobile app directory
cd mobile-app

# Install dependencies
npm install

# Install iOS dependencies (macOS only)
cd ios && pod install && cd ..

# Fix common issues
npx expo install --fix

# Start development server
npm start
```

#### 2. Backend API Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py init

# Start development server
python app.py
```

#### 3. ML Service Setup

```bash
# Navigate to ML service directory
cd ml-service

# Create virtual environment
python -m venv venv-real
source venv-real/bin/activate

# Install ML dependencies
pip install -r requirements-real.txt

# Start ML service
python main_real.py
```

### Environment Configuration

#### Environment Variables

Create `.env` files in each service directory:

**Mobile App (mobile-app/.env)**
```bash
API_BASE_URL=http://localhost:5002/api
ML_SERVICE_URL=http://localhost:8001
ENABLE_REAL_ML=true
MOCK_MODE=false
DEV_MODE=true
SKIP_AUTH=true
```

**Backend API (backend/.env)**
```bash
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=sqlite:///cgm_development.db
SECRET_KEY=your-secret-key-here
ENCRYPTION_KEY=your-encryption-key-here
AZURE_STORAGE_ACCOUNT=your-storage-account
```

**ML Service (ml-service/.env)**
```bash
MODEL_PATH=./models
LOG_LEVEL=DEBUG
ENABLE_GPU=false
WHO_STANDARDS_PATH=./data/who_standards.json
```

### VS Code Configuration

#### Recommended Extensions

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.pylance",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-expo",
    "ms-azuretools.vscode-docker"
  ]
}
```

#### Tasks Configuration

The project includes VS Code tasks for common operations:

- **Start Mobile App**: `Cmd+Shift+P` → "Tasks: Run Task" → "Start Mobile App (Expo)"
- **Start Backend**: "Start Backend Server"
- **Start ML Service**: "Start ML Service"
- **Type Check**: "Type Check Mobile App"

## Mobile App Development

### Project Structure

```
mobile-app/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # App screens
│   │   ├── WelcomeScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ConsentScreen.tsx
│   │   ├── ScanningScreen.tsx
│   │   └── ResultsScreen.tsx
│   ├── services/           # API and business logic
│   │   ├── AuthService.tsx
│   │   ├── DataService.tsx
│   │   └── MLService.ts
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── assets/                 # Images, fonts, etc.
├── App.tsx                 # Main app component
└── package.json           # Dependencies and scripts
```

### Key Components

#### Authentication Service

```typescript
// src/services/AuthService.tsx
export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const login = async (credentials: LoginCredentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    if (response.ok) {
      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      await AsyncStorage.setItem('auth_token', data.token);
    }
  };

  // ... other auth methods
};
```

#### ML Service Integration

```typescript
// src/services/MLService.ts
export class MLService {
  async analyzeImage(request: MLAnalysisRequest): Promise<MLAnalysisResponse | null> {
    try {
      const response = await this.makeRequest('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_data: request.image_data,
          age_months: request.age_months,
          sex: request.sex
        }),
      });

      return await response.json();
    } catch (error) {
      return await this.handleOfflineAnalysis(request);
    }
  }
}
```

### Camera Integration

```typescript
// ScanningScreen.tsx
import { Camera } from 'expo-camera';

const ScanningScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (camera) {
      const photo = await camera.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });
      
      // Process image and send to ML service
      await processAndAnalyze(photo);
    }
  };
};
```

### Offline Data Management

```typescript
// src/services/DataService.tsx
const storeOfflineAction = async (action: string, data: any) => {
  const offlineQueue = await AsyncStorage.getItem('offline_queue') || '[]';
  const queue = JSON.parse(offlineQueue);
  
  queue.push({
    action,
    data,
    timestamp: new Date().toISOString(),
  });
  
  await AsyncStorage.setItem('offline_queue', JSON.stringify(queue));
};

const syncOfflineData = async () => {
  const offlineQueue = await AsyncStorage.getItem('offline_queue') || '[]';
  const queue = JSON.parse(offlineQueue);
  
  for (const item of queue) {
    try {
      await processOfflineAction(item);
    } catch (error) {
      console.warn('Sync failed for item:', item, error);
    }
  }
};
```

### State Management

```typescript
// Context-based state management
export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Network status monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return unsubscribe;
  }, []);

  const value = {
    children,
    setChildren,
    currentUser,
    setCurrentUser,
    isOffline,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
```

## Backend API Development

### Project Structure

```
backend/
├── backend_app/
│   ├── __init__.py         # App factory
│   ├── config.py           # Configuration settings
│   ├── extensions.py       # SQLAlchemy, etc.
│   ├── models/             # Database models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── child.py
│   │   ├── consent.py
│   │   └── scan_session.py
│   ├── routes/             # API endpoints
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── children.py
│   │   ├── consent.py
│   │   └── scans.py
│   ├── middleware/         # Security middleware
│   └── utils/              # Utilities
├── app.py                  # Application entry point
├── init_db.py             # Database initialization
└── requirements.txt       # Python dependencies
```

### Database Models

```python
# backend_app/models/child.py
from sqlalchemy_utils import EncryptedType
from sqlalchemy_utils.types.encrypted.encrypted_type import AesEngine

class Child(db.Model):
    __tablename__ = 'children'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Encrypted PII
    name = db.Column(EncryptedType(db.String(100), secret_key, AesEngine, 'pkcs5'))
    date_of_birth = db.Column(EncryptedType(db.Date, secret_key, AesEngine, 'pkcs5'))
    
    # Non-PII
    gender = db.Column(db.String(1))  # 'M' or 'F'
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    scan_sessions = db.relationship('ScanSession', backref='child', lazy=True)
    consents = db.relationship('Consent', backref='child', lazy=True)
```

### API Routes

```python
# backend_app/routes/children.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

children_bp = Blueprint('children', __name__)

@children_bp.route('/children', methods=['POST'])
@jwt_required()
def create_child():
    data = request.get_json()
    
    # Validate input
    if not all(k in data for k in ['name', 'date_of_birth', 'gender']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Create child record
    child = Child(
        name=data['name'],
        date_of_birth=datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date(),
        gender=data['gender'],
        organization_id=get_jwt_identity()['organization_id']
    )
    
    db.session.add(child)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': child.to_dict()
    }), 201

@children_bp.route('/children', methods=['GET'])
@jwt_required()
def list_children():
    user_identity = get_jwt_identity()
    children = Child.query.filter_by(
        organization_id=user_identity['organization_id']
    ).all()
    
    return jsonify({
        'success': True,
        'data': [child.to_dict() for child in children]
    })
```

### Authentication Middleware

```python
# backend_app/middleware/security.py
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

def require_role(required_role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            current_user = get_jwt_identity()
            
            if current_user['role'] != required_role:
                return jsonify({'error': 'Insufficient permissions'}), 403
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def audit_log(action):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            result = f(*args, **kwargs)
            
            # Log the action
            log_audit_event(
                user_id=get_jwt_identity()['user_id'],
                action=action,
                resource=request.endpoint,
                timestamp=datetime.utcnow()
            )
            
            return result
        return decorated_function
    return decorator
```

### Data Encryption

```python
# backend_app/utils/encryption.py
from cryptography.fernet import Fernet
import base64

class DataEncryption:
    def __init__(self, key: str):
        self.fernet = Fernet(key.encode())
    
    def encrypt_pii(self, data: str) -> str:
        """Encrypt personally identifiable information"""
        encrypted_data = self.fernet.encrypt(data.encode())
        return base64.b64encode(encrypted_data).decode()
    
    def decrypt_pii(self, encrypted_data: str) -> str:
        """Decrypt personally identifiable information"""
        decoded_data = base64.b64decode(encrypted_data.encode())
        decrypted_data = self.fernet.decrypt(decoded_data)
        return decrypted_data.decode()
    
    def encrypt_file(self, file_data: bytes) -> bytes:
        """Encrypt file data"""
        return self.fernet.encrypt(file_data)
    
    def decrypt_file(self, encrypted_file_data: bytes) -> bytes:
        """Decrypt file data"""
        return self.fernet.decrypt(encrypted_file_data)
```

## ML Service Development

### Architecture

The ML service is built with FastAPI and includes:

- **Real-time image processing** using OpenCV
- **Pose estimation** with MediaPipe
- **Anthropometric calculations** from body landmarks
- **WHO growth standards** integration
- **Confidence scoring** and quality assessment

### Project Structure

```
ml-service/
├── models/
│   ├── __init__.py
│   ├── anthropometric_predictor.py
│   ├── pose_estimator.py
│   └── who_standards.py
├── utils/
│   ├── __init__.py
│   ├── image_processor.py
│   ├── measurement_calculator.py
│   └── video_processor.py
├── main_real.py           # Production ML service
├── main_minimal.py        # Minimal service for testing
└── requirements-real.txt  # ML dependencies
```

### Real ML Implementation

```python
# models/anthropometric_predictor.py
import cv2
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from typing import Dict, Any, Tuple

class RealAnthropometricPredictor:
    def __init__(self):
        self.height_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.weight_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.muac_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.head_circumference_model = RandomForestRegressor(n_estimators=100, random_state=42)
        
        self._train_models()
    
    def predict_measurements(self, 
                           pose_landmarks: np.ndarray, 
                           age_months: int, 
                           sex: str, 
                           image_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict anthropometric measurements from pose landmarks.
        """
        # Extract features from pose landmarks
        features = self._extract_features(pose_landmarks, age_months, sex)
        
        # Make predictions
        height = self.height_model.predict([features])[0]
        weight = self.weight_model.predict([features])[0]
        muac = self.muac_model.predict([features])[0]
        head_circumference = self.head_circumference_model.predict([features])[0]
        
        # Calculate confidence scores
        height_confidence = self._calculate_confidence(features, 'height')
        weight_confidence = self._calculate_confidence(features, 'weight')
        muac_confidence = self._calculate_confidence(features, 'muac')
        hc_confidence = self._calculate_confidence(features, 'head_circumference')
        
        return {
            'height': {
                'value': round(height, 1),
                'unit': 'cm',
                'confidence': height_confidence,
                'method': 'pose_estimation'
            },
            'weight': {
                'value': round(weight, 2),
                'unit': 'kg',
                'confidence': weight_confidence,
                'method': 'ml_prediction'
            },
            'muac': {
                'value': round(muac, 1),
                'unit': 'cm',
                'confidence': muac_confidence,
                'method': 'arm_circumference'
            },
            'head_circumference': {
                'value': round(head_circumference, 1),
                'unit': 'cm',
                'confidence': hc_confidence,
                'method': 'head_detection'
            }
        }
```

### Pose Estimation

```python
# models/pose_estimator.py
import cv2
import mediapipe as mp
import numpy as np
from typing import Optional, Tuple, Dict, Any

class RealPoseEstimator:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=True,
            model_complexity=2,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils
    
    def estimate_pose(self, image: np.ndarray) -> Tuple[Optional[np.ndarray], float, Dict[str, Any]]:
        """
        Estimate pose from input image and return landmarks with confidence.
        """
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process the image
        results = self.pose.process(rgb_image)
        
        if results.pose_landmarks:
            # Extract landmark coordinates
            landmarks = []
            for landmark in results.pose_landmarks.landmark:
                landmarks.extend([landmark.x, landmark.y, landmark.z, landmark.visibility])
            
            landmarks_array = np.array(landmarks).reshape(-1, 4)
            
            # Calculate overall confidence
            confidence = np.mean(landmarks_array[:, 3])  # Average visibility scores
            
            # Extract key measurements
            measurements = self._extract_key_measurements(landmarks_array, image.shape)
            
            return landmarks_array, confidence, measurements
        
        return None, 0.0, {}
    
    def _extract_key_measurements(self, landmarks: np.ndarray, image_shape: Tuple[int, int, int]) -> Dict[str, Any]:
        """
        Extract key body measurements from pose landmarks.
        """
        height, width = image_shape[:2]
        
        # Key landmark indices (MediaPipe pose landmarks)
        NOSE = 0
        LEFT_SHOULDER = 11
        RIGHT_SHOULDER = 12
        LEFT_HIP = 23
        RIGHT_HIP = 24
        LEFT_ANKLE = 27
        RIGHT_ANKLE = 28
        
        measurements = {}
        
        # Calculate body height (nose to average ankle)
        if all(landmarks[i, 3] > 0.5 for i in [NOSE, LEFT_ANKLE, RIGHT_ANKLE]):
            nose_y = landmarks[NOSE, 1] * height
            avg_ankle_y = (landmarks[LEFT_ANKLE, 1] + landmarks[RIGHT_ANKLE, 1]) / 2 * height
            body_height_pixels = abs(avg_ankle_y - nose_y)
            measurements['body_height_pixels'] = body_height_pixels
        
        # Calculate shoulder width
        if all(landmarks[i, 3] > 0.5 for i in [LEFT_SHOULDER, RIGHT_SHOULDER]):
            shoulder_width_pixels = abs(
                landmarks[LEFT_SHOULDER, 0] - landmarks[RIGHT_SHOULDER, 0]
            ) * width
            measurements['shoulder_width_pixels'] = shoulder_width_pixels
        
        # Calculate torso length
        if all(landmarks[i, 3] > 0.5 for i in [LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP]):
            avg_shoulder_y = (landmarks[LEFT_SHOULDER, 1] + landmarks[RIGHT_SHOULDER, 1]) / 2 * height
            avg_hip_y = (landmarks[LEFT_HIP, 1] + landmarks[RIGHT_HIP, 1]) / 2 * height
            torso_length_pixels = abs(avg_hip_y - avg_shoulder_y)
            measurements['torso_length_pixels'] = torso_length_pixels
        
        return measurements
```

### WHO Growth Standards Integration

```python
# models/who_standards.py
import json
import numpy as np
from typing import Dict, Any, Optional
from scipy import stats

class WHOGrowthStandards:
    def __init__(self, standards_path: str = "data/who_standards.json"):
        self.standards = self._load_standards(standards_path)
    
    def calculate_z_scores(self, 
                          measurements: Dict[str, float], 
                          age_months: int, 
                          sex: str) -> Dict[str, Any]:
        """
        Calculate Z-scores based on WHO growth standards.
        """
        sex_key = 'boys' if sex.upper() == 'M' else 'girls'
        
        results = {}
        
        # Height-for-age Z-score (stunting indicator)
        if 'height' in measurements:
            height_z = self._calculate_height_for_age_z(
                measurements['height'], age_months, sex_key
            )
            results['height_for_age_z'] = height_z
            results['stunting_status'] = self._classify_stunting(height_z)
        
        # Weight-for-height Z-score (wasting indicator)
        if 'weight' in measurements and 'height' in measurements:
            weight_height_z = self._calculate_weight_for_height_z(
                measurements['weight'], measurements['height'], sex_key
            )
            results['weight_for_height_z'] = weight_height_z
            results['wasting_status'] = self._classify_wasting(weight_height_z)
        
        # Weight-for-age Z-score (underweight indicator)
        if 'weight' in measurements:
            weight_age_z = self._calculate_weight_for_age_z(
                measurements['weight'], age_months, sex_key
            )
            results['weight_for_age_z'] = weight_age_z
            results['underweight_status'] = self._classify_underweight(weight_age_z)
        
        return results
    
    def _classify_stunting(self, z_score: float) -> Dict[str, Any]:
        """Classify stunting severity based on height-for-age Z-score."""
        if z_score >= -2:
            status = 'normal'
            risk_level = 'low'
        elif z_score >= -3:
            status = 'moderate'
            risk_level = 'medium'
        else:
            status = 'severe'
            risk_level = 'high'
        
        return {
            'status': status,
            'z_score': round(z_score, 2),
            'risk_level': risk_level
        }
```

### FastAPI Service Implementation

```python
# main_real.py
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(
    title="Child Growth Monitor ML Service - Real Implementation",
    description="Production-ready anthropometric analysis using computer vision",
    version="3.0.0-real"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5002", "http://localhost:19006"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class AnalysisRequest(BaseModel):
    image_data: str  # Base64 encoded image
    age_months: Optional[int] = None
    sex: Optional[str] = None  # 'M' or 'F'
    reference_object_size_cm: Optional[float] = None

@app.post("/analyze")
async def analyze_image(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """
    Analyze child image for anthropometric measurements.
    """
    start_time = time.time()
    
    try:
        # Decode base64 image
        image_data = base64.b64decode(request.image_data)
        image = Image.open(io.BytesIO(image_data))
        cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Estimate pose
        landmarks, pose_confidence, pose_measurements = pose_estimator.estimate_pose(cv_image)
        
        if landmarks is None:
            raise HTTPException(status_code=400, detail="No pose detected in image")
        
        # Predict anthropometric measurements
        measurements = anthropometric_predictor.predict_measurements(
            landmarks, 
            request.age_months or 24, 
            request.sex or 'M',
            {'image_shape': cv_image.shape}
        )
        
        # Calculate WHO Z-scores if age and sex provided
        nutritional_status = {}
        if request.age_months and request.sex:
            who_results = who_standards.calculate_z_scores(
                {k: v['value'] for k, v in measurements.items()},
                request.age_months,
                request.sex
            )
            nutritional_status = format_nutritional_status(who_results)
        
        processing_time = (time.time() - start_time) * 1000
        
        return {
            "success": True,
            "measurements": measurements,
            "nutritional_status": nutritional_status,
            "pose_data": {
                "landmarks_detected": len(landmarks),
                "pose_confidence": float(pose_confidence),
                "key_measurements": pose_measurements
            },
            "confidence_score": float(pose_confidence),
            "processing_time_ms": processing_time,
            "model_info": {
                "version": "3.0.0-real",
                "algorithms": ["MediaPipe", "RandomForest", "WHO-Standards"],
                "confidence_threshold": 0.7
            }
        }
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
```

## Database Management

### Schema Design

```sql
-- User management
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Child data (with encryption)
CREATE TABLE children (
    id UUID PRIMARY KEY,
    name_encrypted TEXT NOT NULL,  -- Encrypted PII
    date_of_birth_encrypted TEXT NOT NULL,  -- Encrypted PII
    gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Consent management
CREATE TABLE consents (
    id UUID PRIMARY KEY,
    child_id UUID REFERENCES children(id),
    guardian_name_encrypted TEXT NOT NULL,
    consent_type VARCHAR(50) NOT NULL,
    consent_given BOOLEAN NOT NULL,
    digital_signature TEXT,
    consent_date TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    qr_code_data TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Scan sessions
CREATE TABLE scan_sessions (
    id UUID PRIMARY KEY,
    child_id UUID REFERENCES children(id),
    consent_id UUID REFERENCES consents(id),
    session_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Measurements and analysis
CREATE TABLE anthropometric_measurements (
    id UUID PRIMARY KEY,
    scan_session_id UUID REFERENCES scan_sessions(id),
    measurement_type VARCHAR(50) NOT NULL,
    value DECIMAL(10,3) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    confidence_score DECIMAL(5,3),
    z_score DECIMAL(5,2),
    percentile DECIMAL(5,2),
    measurement_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Database Initialization

```python
# init_db.py
import click
from flask.cli import with_appcontext
from backend_app import create_app
from backend_app.extensions import db

def init_database():
    """Initialize the database with tables and initial data."""
    db.create_all()
    
    # Create default organization
    from backend_app.models.organization import Organization
    default_org = Organization(
        name="Development Organization",
        country="US"
    )
    db.session.add(default_org)
    
    # Create admin user
    from backend_app.models.user import User
    admin_user = User(
        username="admin",
        email="admin@childgrowthmonitor.org",
        role="admin",
        organization_id=default_org.id
    )
    admin_user.set_password("admin123")
    db.session.add(admin_user)
    
    db.session.commit()
    click.echo("Database initialized successfully!")

@click.command()
@click.option('--drop', is_flag=True, help='Drop all tables first')
def init_db(drop):
    """Initialize the database."""
    if drop:
        db.drop_all()
        click.echo("Dropped all tables.")
    
    init_database()

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        init_db()
```

### Migrations

```python
# Database migration management
from flask_migrate import Migrate, upgrade, init, migrate

def setup_migrations(app, db):
    """Setup Flask-Migrate for database migrations."""
    migrate = Migrate(app, db)
    return migrate

# Migration commands
def run_migrations():
    """Run database migrations."""
    upgrade()

def create_migration(message):
    """Create a new migration."""
    migrate(message=message)
```

## Security Implementation

### Data Encryption

```python
# Encryption utilities
from cryptography.fernet import Fernet
import os
import base64

class SecurityManager:
    def __init__(self):
        self.encryption_key = os.getenv('ENCRYPTION_KEY')
        if not self.encryption_key:
            raise ValueError("ENCRYPTION_KEY environment variable not set")
        
        self.fernet = Fernet(self.encryption_key.encode())
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data like PII."""
        encrypted_data = self.fernet.encrypt(data.encode())
        return base64.b64encode(encrypted_data).decode()
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data."""
        decoded_data = base64.b64decode(encrypted_data.encode())
        decrypted_data = self.fernet.decrypt(decoded_data)
        return decrypted_data.decode()
    
    def hash_password(self, password: str) -> str:
        """Hash password for storage."""
        from werkzeug.security import generate_password_hash
        return generate_password_hash(password)
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash."""
        from werkzeug.security import check_password_hash
        return check_password_hash(password_hash, password)
```

### Authentication & Authorization

```python
# JWT token management
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity
import datetime

class AuthManager:
    def __init__(self, app):
        self.jwt = JWTManager(app)
        app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
        app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=24)
    
    def create_token(self, user_id: str, user_data: dict) -> str:
        """Create JWT token for user."""
        additional_claims = {
            "user_id": user_id,
            "role": user_data.get('role'),
            "organization_id": user_data.get('organization_id')
        }
        
        return create_access_token(
            identity=user_id,
            additional_claims=additional_claims
        )
    
    def require_permission(self, permission: str):
        """Decorator to require specific permission."""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                current_user = get_jwt_identity()
                if not self.has_permission(current_user, permission):
                    return jsonify({'error': 'Insufficient permissions'}), 403
                return f(*args, **kwargs)
            return decorated_function
        return decorator
```

### Audit Logging

```python
# Audit trail implementation
class AuditLogger:
    def __init__(self, db):
        self.db = db
    
    def log_action(self, user_id: str, action: str, resource: str, 
                   resource_id: str = None, details: dict = None):
        """Log user actions for audit trail."""
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            details=json.dumps(details) if details else None,
            timestamp=datetime.utcnow(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        self.db.session.add(audit_log)
        self.db.session.commit()
    
    def get_audit_trail(self, user_id: str = None, 
                       start_date: datetime = None, 
                       end_date: datetime = None):
        """Retrieve audit trail with filters."""
        query = AuditLog.query
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        if start_date:
            query = query.filter(AuditLog.timestamp >= start_date)
        if end_date:
            query = query.filter(AuditLog.timestamp <= end_date)
        
        return query.order_by(AuditLog.timestamp.desc()).all()
```

## Testing Strategies

### Unit Testing

```python
# test_anthropometric_predictor.py
import unittest
import numpy as np
from ml_service.models.anthropometric_predictor import RealAnthropometricPredictor

class TestAnthropometricPredictor(unittest.TestCase):
    def setUp(self):
        self.predictor = RealAnthropometricPredictor()
        
        # Sample pose landmarks (33 landmarks x 4 coordinates)
        self.sample_landmarks = np.random.rand(33, 4)
        self.sample_landmarks[:, 3] = 0.8  # Set visibility scores
    
    def test_predict_measurements_male_toddler(self):
        """Test predictions for male toddler."""
        measurements = self.predictor.predict_measurements(
            self.sample_landmarks, 
            age_months=24, 
            sex='M',
            image_metadata={'image_shape': (480, 640, 3)}
        )
        
        # Verify all expected measurements are present
        expected_keys = ['height', 'weight', 'muac', 'head_circumference']
        for key in expected_keys:
            self.assertIn(key, measurements)
            self.assertIn('value', measurements[key])
            self.assertIn('confidence', measurements[key])
            self.assertIn('unit', measurements[key])
        
        # Verify reasonable ranges for 2-year-old
        self.assertGreater(measurements['height']['value'], 70)
        self.assertLess(measurements['height']['value'], 120)
        self.assertGreater(measurements['weight']['value'], 5)
        self.assertLess(measurements['weight']['value'], 25)
    
    def test_confidence_scores(self):
        """Test confidence score calculations."""
        measurements = self.predictor.predict_measurements(
            self.sample_landmarks, 24, 'M', {}
        )
        
        for measurement in measurements.values():
            confidence = measurement['confidence']
            self.assertGreaterEqual(confidence, 0.0)
            self.assertLessEqual(confidence, 1.0)

if __name__ == '__main__':
    unittest.main()
```

### Integration Testing

```python
# test_integration.py
import pytest
import requests
import base64
from PIL import Image
import io

class TestMLServiceIntegration:
    @pytest.fixture
    def ml_service_url(self):
        return "http://localhost:8001"
    
    @pytest.fixture
    def sample_image_base64(self):
        """Create a sample image and convert to base64."""
        # Create a simple test image
        img = Image.new('RGB', (640, 480), color='white')
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_data = buffer.getvalue()
        return base64.b64encode(img_data).decode()
    
    def test_health_endpoint(self, ml_service_url):
        """Test ML service health endpoint."""
        response = requests.get(f"{ml_service_url}/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data['status'] == 'healthy'
        assert data['models_loaded'] is True
    
    def test_analyze_endpoint(self, ml_service_url, sample_image_base64):
        """Test image analysis endpoint."""
        payload = {
            'image_data': sample_image_base64,
            'age_months': 24,
            'sex': 'M'
        }
        
        response = requests.post(
            f"{ml_service_url}/analyze",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert 'success' in data
        assert 'measurements' in data
        assert 'processing_time_ms' in data
        
        # Verify measurements structure
        measurements = data['measurements']
        for measurement_type in ['height', 'weight', 'muac', 'head_circumference']:
            assert measurement_type in measurements
            measurement = measurements[measurement_type]
            assert 'value' in measurement
            assert 'unit' in measurement
            assert 'confidence' in measurement
```

### End-to-End Testing

```python
# test_e2e.py
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
import time

class TestMobileAppE2E:
    @pytest.fixture
    def driver(self):
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        driver = webdriver.Chrome(options=options)
        driver.get('http://localhost:19006')  # Expo web app
        yield driver
        driver.quit()
    
    def test_complete_workflow(self, driver):
        """Test complete child assessment workflow."""
        # Wait for app to load
        time.sleep(3)
        
        # Navigate to child registration
        register_button = driver.find_element(By.TEXT, "Add New Child")
        register_button.click()
        
        # Fill child information
        name_input = driver.find_element(By.PLACEHOLDER_TEXT, "Child's name")
        name_input.send_keys("Test Child")
        
        # Continue with consent and scanning...
        # This would be expanded for full E2E testing
        
        assert "Child Growth Monitor" in driver.title
```

## Deployment Guide

### Docker Configuration

```dockerfile
# Dockerfile.mobile-app
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 19006
CMD ["npm", "run", "web"]
```

```dockerfile
# Dockerfile.backend
FROM python:3.9-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5002
CMD ["python", "app.py"]
```

```dockerfile
# Dockerfile.ml-service
FROM python:3.9-slim
WORKDIR /app

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-real.txt .
RUN pip install -r requirements-real.txt

COPY . .
EXPOSE 8001
CMD ["python", "main_real.py"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  database:
    image: postgres:13
    environment:
      POSTGRES_DB: cgm_db
      POSTGRES_USER: cgm_user
      POSTGRES_PASSWORD: cgm_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://cgm_user:cgm_password@database:5432/cgm_db
      FLASK_ENV: production
    ports:
      - "5002:5002"
    depends_on:
      - database

  ml-service:
    build:
      context: ./ml-service
      dockerfile: Dockerfile
    ports:
      - "8001:8001"
    volumes:
      - ml_models:/app/models

  mobile-app:
    build:
      context: ./mobile-app
      dockerfile: Dockerfile
    ports:
      - "19006:19006"
    environment:
      API_BASE_URL: http://backend:5002/api
      ML_SERVICE_URL: http://ml-service:8001

volumes:
  postgres_data:
  ml_models:
```

### Azure Deployment

```yaml
# azure-pipelines.yml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

stages:
- stage: Build
  jobs:
  - job: BuildServices
    steps:
    - task: Docker@2
      displayName: 'Build Backend Image'
      inputs:
        command: 'buildAndPush'
        repository: 'cgm-backend'
        dockerfile: 'backend/Dockerfile'
        containerRegistry: 'ACRConnection'
        tags: '$(Build.BuildId)'

    - task: Docker@2
      displayName: 'Build ML Service Image'
      inputs:
        command: 'buildAndPush'
        repository: 'cgm-ml-service'
        dockerfile: 'ml-service/Dockerfile'
        containerRegistry: 'ACRConnection'
        tags: '$(Build.BuildId)'

- stage: Deploy
  dependsOn: Build
  jobs:
  - deployment: DeployToProduction
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebAppContainer@1
            displayName: 'Deploy Backend'
            inputs:
              azureSubscription: 'AzureConnection'
              appName: 'cgm-backend-prod'
              imageName: 'cgm-backend:$(Build.BuildId)'

          - task: AzureWebAppContainer@1
            displayName: 'Deploy ML Service'
            inputs:
              azureSubscription: 'AzureConnection'
              appName: 'cgm-ml-service-prod'
              imageName: 'cgm-ml-service:$(Build.BuildId)'
```

### Environment Configuration

```bash
# Production environment variables
# backend/.env.production
FLASK_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/cgm_prod
SECRET_KEY=production-secret-key
ENCRYPTION_KEY=production-encryption-key
AZURE_STORAGE_ACCOUNT=cgmstorageprod
AZURE_B2C_TENANT=cgmb2cprod

# ml-service/.env.production
MODEL_PATH=/app/models
LOG_LEVEL=INFO
ENABLE_GPU=true
WHO_STANDARDS_PATH=/app/data/who_standards.json
REDIS_URL=redis://prod-redis:6379
```

## API Documentation

### Authentication Endpoints

```
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response:
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "username": "string",
    "role": "string",
    "organization_id": "uuid"
  }
}
```

### Child Management Endpoints

```
POST /api/children
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "date_of_birth": "YYYY-MM-DD",
  "gender": "M|F",
  "guardian_name": "string"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "age_months": 24,
    "gender": "M",
    "created_at": "ISO-8601"
  }
}
```

### ML Analysis Endpoints

```
POST /analyze
Content-Type: application/json

{
  "image_data": "base64-encoded-image",
  "age_months": 24,
  "sex": "M",
  "reference_object_size_cm": 10.0
}

Response:
{
  "success": true,
  "measurements": {
    "height": {
      "value": 85.2,
      "unit": "cm",
      "confidence": 0.87
    },
    "weight": {
      "value": 12.5,
      "unit": "kg",
      "confidence": 0.82
    }
  },
  "nutritional_status": {
    "stunting": {
      "status": "normal",
      "z_score": -1.2,
      "risk_level": "low"
    }
  },
  "processing_time_ms": 245.7
}
```

## Troubleshooting

### Common Development Issues

#### macOS File Descriptor Limits
```bash
# Increase file descriptor limits
ulimit -n 65536

# Permanent fix
echo "kern.maxfiles=65536" | sudo tee -a /etc/sysctl.conf
sudo sysctl -w kern.maxfiles=65536
```

#### React Native Metro Issues
```bash
# Clear Metro cache
npx react-native start --reset-cache

# Fix watchman issues
brew install watchman
watchman watch-del-all
```

#### Python Environment Issues
```bash
# Recreate virtual environment
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Performance Optimization

#### Mobile App Optimization
- Use React.memo for expensive components
- Implement lazy loading for screens
- Optimize image compression
- Use background processing for ML analysis

#### Backend Optimization
- Implement database connection pooling
- Add caching with Redis
- Use async processing for heavy operations
- Optimize database queries with indexes

#### ML Service Optimization
- Use GPU acceleration when available
- Implement model caching
- Batch processing for multiple images
- Optimize image preprocessing

### Monitoring and Logging

```python
# Logging configuration
import logging
from logging.handlers import RotatingFileHandler

def setup_logging(app):
    if not app.debug:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        file_handler = RotatingFileHandler(
            'logs/cgm.log', 
            maxBytes=10240000, 
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        
        app.logger.setLevel(logging.INFO)
        app.logger.info('Child Growth Monitor startup')
```

## Contributing Guidelines

### Code Standards

#### Python (Backend & ML Service)
- Follow PEP 8 style guidelines
- Use type hints for all functions
- Include docstrings for all public methods
- Maximum line length: 88 characters
- Use Black for code formatting

#### TypeScript (Mobile App)
- Use ESLint with strict configuration
- Prefer functional components with hooks
- Use meaningful variable and function names
- Include JSDoc comments for complex functions

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new anthropometric measurement"

# Push and create pull request
git push origin feature/new-feature
```

### Commit Message Format

```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Scope: mobile, backend, ml-service, docs
```

### Pull Request Process

1. Create feature branch from main
2. Implement changes with tests
3. Update documentation if needed
4. Ensure all tests pass
5. Request code review
6. Address feedback
7. Merge after approval

### Testing Requirements

- All new features must include unit tests
- Integration tests for API endpoints
- E2E tests for critical user workflows
- Minimum 80% code coverage

---

**Version 3.0.0 - July 2025**  
**© 2025 Child Growth Monitor Development Team. All rights reserved.**
