# Azure Integration Plan for Child Growth Monitor

## 🎯 Overview

This plan outlines the complete integration of the Child Growth Monitor with Microsoft Azure cloud services, leveraging Azure ML for training and deploying anthropometric prediction models, Azure B2C for authentication, and Azure Storage for secure data management.

## 🏗️ Azure Architecture

### Core Azure Services
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Portal    │    │  Healthcare     │
│  (React Native)│    │   (React)       │    │  Partners API   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Azure API      │
                    │  Management     │
                    │  + Front Door   │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Azure B2C      │    │  Azure App      │    │  Azure ML       │
│  Authentication │    │  Service        │    │  Workspace      │
│                 │    │  (Backend API)  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                 │                       │
                    ┌─────────────────┐    ┌─────────────────┐
                    │  Azure          │    │  Azure          │
                    │  PostgreSQL     │    │  Container      │
                    │  Database       │    │  Registry       │
                    └─────────────────┘    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Azure Blob     │
                    │  Storage        │
                    │  (Videos/Models)│
                    └─────────────────┘
```

## 📋 Phase 1: Azure ML Model Training (Weeks 1-4)

### 1.1 Available Training Models & Datasets

#### Pre-trained Computer Vision Models
```python
# Azure ML Model Catalog - Available Models for Anthropometry

AVAILABLE_MODELS = {
    "pose_estimation": {
        "mediapipe_holistic": {
            "source": "Google MediaPipe",
            "accuracy": "High for adults, good for children",
            "azure_deployment": "Azure Container Instances",
            "estimated_setup": "2-3 days"
        },
        "openpose": {
            "source": "CMU OpenPose",
            "accuracy": "Very high for research",
            "azure_deployment": "Azure ML Compute",
            "estimated_setup": "1 week"
        },
        "detectron2_keypoint": {
            "source": "Facebook Research",
            "accuracy": "Excellent for person detection + pose",
            "azure_deployment": "Azure ML Endpoints",
            "estimated_setup": "3-4 days"
        }
    },
    "anthropometry_datasets": {
        "synthetic_children": {
            "source": "3D child models + poses",
            "size": "50K synthetic samples",
            "azure_storage": "Azure Blob Storage",
            "availability": "Can generate immediately"
        },
        "medical_research": {
            "source": "Published research datasets",
            "size": "5K+ real samples",
            "azure_storage": "Azure Data Lake",
            "availability": "2-3 weeks (ethical approval)"
        },
        "partner_clinics": {
            "source": "Healthcare partner data",
            "size": "10K+ samples (projected)",
            "azure_storage": "Azure Blob (encrypted)",
            "availability": "4-6 weeks (partnerships)"
        }
    }
}
```

#### Immediate Implementation Strategy
1. **Start with MediaPipe + Synthetic Data** (Week 1)
2. **Add Detectron2 for Better Accuracy** (Week 2)
3. **Integrate Real Clinical Data** (Weeks 3-4)
4. **Fine-tune Models on Azure ML** (Week 4)

### 1.2 Azure ML Workspace Setup

#### Azure ML Resources Configuration
```yaml
# azure-ml-config.yml
azure_ml_workspace:
  name: "child-growth-monitor-ml"
  resource_group: "cgm-production-rg"
  location: "East US 2"
  
compute_targets:
  training_cluster:
    name: "cgm-training-cluster"
    vm_size: "Standard_NC6s_v3"  # GPU for deep learning
    min_nodes: 0
    max_nodes: 4
    idle_seconds_before_scaledown: 1800
    
  inference_cluster:
    name: "cgm-inference-cluster"
    vm_size: "Standard_DS3_v2"
    min_nodes: 1
    max_nodes: 10
    
environments:
  training_env:
    name: "cgm-training-env"
    base_image: "mcr.microsoft.com/azureml/pytorch-1.13-ubuntu20.04-py38-cuda11.6-gpu:latest"
    conda_dependencies:
      - tensorflow==2.13.0
      - torch==2.0.1
      - mediapipe==0.10.3
      - opencv-python==4.8.0.76
      - scikit-learn==1.3.0
      - azure-ml-core
      
datastores:
  training_data:
    name: "cgm-training-data"
    type: "AzureBlobDatastore"
    container_name: "training-data"
    account_name: "cgmstorageaccount"
    
  model_registry:
    name: "cgm-model-registry"
    type: "AzureBlobDatastore"
    container_name: "model-registry"
```

### 1.3 Training Pipeline Implementation

#### Azure ML Training Script
```python
# azure_ml_training.py
import os
import argparse
from azureml.core import Run, Dataset, Model
from azureml.core.model import Model as AMLModel
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import numpy as np
from sklearn.metrics import mean_absolute_error, r2_score

class AnthropometricModel(nn.Module):
    """
    Neural network for predicting anthropometric measurements
    from pose keypoints and metadata.
    """
    def __init__(self, input_size=75, hidden_size=256):
        super().__init__()
        self.pose_encoder = nn.Sequential(
            nn.Linear(66, 128),  # 33 keypoints * 2 coordinates
            nn.ReLU(),
            nn.BatchNorm1d(128),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU()
        )
        
        self.metadata_encoder = nn.Sequential(
            nn.Linear(9, 32),  # age, gender, device info, etc.
            nn.ReLU(),
            nn.Linear(32, 16)
        )
        
        self.predictor = nn.Sequential(
            nn.Linear(80, hidden_size),  # 64 + 16
            nn.ReLU(),
            nn.BatchNorm1d(hidden_size),
            nn.Dropout(0.4),
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Linear(hidden_size // 2, 4)  # height, weight, arm_circ, head_circ
        )
        
    def forward(self, pose_keypoints, metadata):
        pose_features = self.pose_encoder(pose_keypoints)
        meta_features = self.metadata_encoder(metadata)
        combined = torch.cat([pose_features, meta_features], dim=1)
        return self.predictor(combined)

def train_anthropometric_model():
    """Main training function for Azure ML."""
    
    # Initialize Azure ML run
    run = Run.get_context()
    
    # Parse arguments
    parser = argparse.ArgumentParser()
    parser.add_argument('--data-path', type=str, help='Path to training data')
    parser.add_argument('--output-path', type=str, help='Path to output model')
    parser.add_argument('--epochs', type=int, default=100)
    parser.add_argument('--batch-size', type=int, default=32)
    parser.add_argument('--learning-rate', type=float, default=0.001)
    args = parser.parse_args()
    
    # Load datasets
    training_dataset = Dataset.get_by_name(run.experiment.workspace, 'cgm-training-data')
    validation_dataset = Dataset.get_by_name(run.experiment.workspace, 'cgm-validation-data')
    
    # Data loading logic
    train_loader = create_data_loader(training_dataset, args.batch_size, shuffle=True)
    val_loader = create_data_loader(validation_dataset, args.batch_size, shuffle=False)
    
    # Initialize model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = AnthropometricModel().to(device)
    
    # Training setup
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=args.learning_rate)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=10)
    
    best_val_loss = float('inf')
    
    # Training loop
    for epoch in range(args.epochs):
        # Training
        model.train()
        train_loss = 0.0
        for batch_idx, (pose_data, metadata, targets) in enumerate(train_loader):
            pose_data, metadata, targets = pose_data.to(device), metadata.to(device), targets.to(device)
            
            optimizer.zero_grad()
            outputs = model(pose_data, metadata)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            
            # Log to Azure ML
            run.log('batch_loss', loss.item())
        
        # Validation
        model.eval()
        val_loss = 0.0
        val_predictions = []
        val_targets = []
        
        with torch.no_grad():
            for pose_data, metadata, targets in val_loader:
                pose_data, metadata, targets = pose_data.to(device), metadata.to(device), targets.to(device)
                outputs = model(pose_data, metadata)
                loss = criterion(outputs, targets)
                val_loss += loss.item()
                
                val_predictions.extend(outputs.cpu().numpy())
                val_targets.extend(targets.cpu().numpy())
        
        avg_train_loss = train_loss / len(train_loader)
        avg_val_loss = val_loss / len(val_loader)
        
        # Calculate metrics
        val_predictions = np.array(val_predictions)
        val_targets = np.array(val_targets)
        
        metrics = {}
        measurements = ['height', 'weight', 'arm_circumference', 'head_circumference']
        for i, measurement in enumerate(measurements):
            mae = mean_absolute_error(val_targets[:, i], val_predictions[:, i])
            r2 = r2_score(val_targets[:, i], val_predictions[:, i])
            metrics[f'{measurement}_mae'] = mae
            metrics[f'{measurement}_r2'] = r2
        
        # Log to Azure ML
        run.log('epoch', epoch)
        run.log('train_loss', avg_train_loss)
        run.log('val_loss', avg_val_loss)
        for metric_name, metric_value in metrics.items():
            run.log(metric_name, metric_value)
        
        scheduler.step(avg_val_loss)
        
        # Save best model
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_loss': avg_val_loss,
                'metrics': metrics
            }, os.path.join(args.output_path, 'best_model.pth'))
    
    # Register model in Azure ML
    model_path = os.path.join(args.output_path, 'best_model.pth')
    model = AMLModel.register(
        workspace=run.experiment.workspace,
        model_path=model_path,
        model_name='cgm-anthropometric-model',
        tags={'type': 'anthropometric', 'framework': 'pytorch'},
        description='Child anthropometric measurement prediction model'
    )
    
    print(f"Model registered: {model.name} version {model.version}")

if __name__ == "__main__":
    train_anthropometric_model()
```

## 📋 Phase 2: Azure Infrastructure Setup (Weeks 2-3)

### 2.1 Azure B2C Authentication

#### B2C Configuration
```javascript
// azure-b2c-config.js
export const b2cConfig = {
    auth: {
        clientId: process.env.AZURE_B2C_CLIENT_ID,
        authority: `https://${process.env.AZURE_B2C_TENANT_NAME}.b2clogin.com/${process.env.AZURE_B2C_TENANT_NAME}.onmicrosoft.com/B2C_1_signup_signin`,
        knownAuthorities: [`${process.env.AZURE_B2C_TENANT_NAME}.b2clogin.com`],
        redirectUri: process.env.AZURE_B2C_REDIRECT_URI,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) return;
                console.log(message);
            }
        }
    }
};

export const loginRequest = {
    scopes: ["openid", "profile", "https://cgmb2c.onmicrosoft.com/api/access"],
};

export const apiConfig = {
    b2cScopes: ["https://cgmb2c.onmicrosoft.com/api/access"],
    webApi: process.env.AZURE_API_BASE_URL
};
```

#### Mobile App B2C Integration
```typescript
// mobile-app/src/services/AzureAuthService.tsx
import { PublicClientApplication } from '@azure/msal-react-native';
import { b2cConfig } from '../config/azure-b2c-config';

class AzureAuthService {
    private pca: PublicClientApplication;
    
    constructor() {
        this.pca = new PublicClientApplication(b2cConfig);
    }
    
    async signIn() {
        try {
            const result = await this.pca.acquireTokenSilent({
                scopes: ["openid", "profile"],
                account: await this.getAccount()
            });
            return result.accessToken;
        } catch (error) {
            // Fallback to interactive login
            const result = await this.pca.acquireTokenInteractive({
                scopes: ["openid", "profile"]
            });
            return result.accessToken;
        }
    }
    
    async getAccount() {
        const accounts = await this.pca.getAllAccounts();
        return accounts.length > 0 ? accounts[0] : null;
    }
    
    async signOut() {
        const account = await this.getAccount();
        if (account) {
            await this.pca.removeAccount(account);
        }
    }
}

export default new AzureAuthService();
```

### 2.2 Azure App Service Deployment

#### Dockerfile for Backend
```dockerfile
# backend/Dockerfile
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV FLASK_APP=app.py
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "app:app"]
```

#### Azure Resource Manager Template
```json
{
    "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
    "contentVersion": "1.0.0.0",
    "parameters": {
        "appServicePlanName": {
            "type": "string",
            "defaultValue": "cgm-app-service-plan"
        },
        "webAppName": {
            "type": "string",
            "defaultValue": "child-growth-monitor-api"
        },
        "mlServiceName": {
            "type": "string",
            "defaultValue": "child-growth-monitor-ml"
        }
    },
    "resources": [
        {
            "type": "Microsoft.Web/serverfarms",
            "apiVersion": "2021-02-01",
            "name": "[parameters('appServicePlanName')]",
            "location": "[resourceGroup().location]",
            "sku": {
                "name": "P1v3",
                "tier": "PremiumV3",
                "size": "P1v3",
                "family": "Pv3",
                "capacity": 1
            },
            "kind": "linux",
            "properties": {
                "reserved": true
            }
        },
        {
            "type": "Microsoft.Web/sites",
            "apiVersion": "2021-02-01",
            "name": "[parameters('webAppName')]",
            "location": "[resourceGroup().location]",
            "dependsOn": [
                "[resourceId('Microsoft.Web/serverfarms', parameters('appServicePlanName'))]"
            ],
            "properties": {
                "serverFarmId": "[resourceId('Microsoft.Web/serverfarms', parameters('appServicePlanName'))]",
                "siteConfig": {
                    "linuxFxVersion": "PYTHON|3.9",
                    "appSettings": [
                        {
                            "name": "FLASK_ENV",
                            "value": "production"
                        },
                        {
                            "name": "DATABASE_URL",
                            "value": "[concat('postgresql://', reference(resourceId('Microsoft.DBforPostgreSQL/servers', 'cgm-postgres-server')).fullyQualifiedDomainName, ':5432/cgm_production')]"
                        }
                    ]
                }
            }
        }
    ]
}
```

### 2.3 Azure Storage Configuration

#### Blob Storage Setup for Medical Data
```python
# backend/app/services/azure_storage.py
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
from azure.core.exceptions import AzureError
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class AzureStorageService:
    """Azure Blob Storage service for secure medical data storage."""
    
    def __init__(self):
        self.connection_string = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
        self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
        
        # Container names
        self.video_container = "scan-videos"
        self.model_container = "ml-models"
        self.backup_container = "database-backups"
        
        self._ensure_containers_exist()
    
    def _ensure_containers_exist(self):
        """Ensure required containers exist."""
        containers = [self.video_container, self.model_container, self.backup_container]
        
        for container_name in containers:
            try:
                self.blob_service_client.create_container(
                    name=container_name,
                    public_access=None  # Private access only
                )
                logger.info(f"Created container: {container_name}")
            except AzureError as e:
                if "ContainerAlreadyExists" not in str(e):
                    logger.error(f"Error creating container {container_name}: {e}")
    
    def upload_scan_video(self, video_data: bytes, child_id: str, scan_session_id: str, scan_type: str) -> Optional[str]:
        """Upload scan video to secure blob storage."""
        try:
            # Create hierarchical blob name for organization
            blob_name = f"children/{child_id}/sessions/{scan_session_id}/{scan_type}.mp4"
            
            blob_client = self.blob_service_client.get_blob_client(
                container=self.video_container,
                blob=blob_name
            )
            
            # Upload with encryption and metadata
            blob_client.upload_blob(
                data=video_data,
                overwrite=True,
                metadata={
                    'child_id': child_id,
                    'scan_session_id': scan_session_id,
                    'scan_type': scan_type,
                    'content_type': 'video/mp4',
                    'encrypted': 'true'
                }
            )
            
            logger.info(f"Uploaded scan video: {blob_name}")
            return blob_name
            
        except AzureError as e:
            logger.error(f"Error uploading scan video: {e}")
            return None
    
    def download_scan_video(self, blob_name: str) -> Optional[bytes]:
        """Download scan video from blob storage."""
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.video_container,
                blob=blob_name
            )
            
            video_data = blob_client.download_blob().readall()
            logger.info(f"Downloaded scan video: {blob_name}")
            return video_data
            
        except AzureError as e:
            logger.error(f"Error downloading scan video: {e}")
            return None
    
    def upload_trained_model(self, model_data: bytes, model_name: str, version: str) -> Optional[str]:
        """Upload trained ML model to blob storage."""
        try:
            blob_name = f"anthropometric/{model_name}/v{version}/model.pth"
            
            blob_client = self.blob_service_client.get_blob_client(
                container=self.model_container,
                blob=blob_name
            )
            
            blob_client.upload_blob(
                data=model_data,
                overwrite=True,
                metadata={
                    'model_name': model_name,
                    'version': version,
                    'model_type': 'anthropometric_predictor'
                }
            )
            
            logger.info(f"Uploaded model: {blob_name}")
            return blob_name
            
        except AzureError as e:
            logger.error(f"Error uploading model: {e}")
            return None

# Initialize global storage service
azure_storage = AzureStorageService()
```

## 📋 Phase 3: ML Model Deployment (Weeks 3-4)

### 3.1 Azure ML Endpoint Deployment

#### Model Deployment Script
```python
# azure_ml_deployment.py
from azureml.core import Workspace, Model, Environment
from azureml.core.model import InferenceConfig
from azureml.core.webservice import AciWebservice, Webservice
import json

def deploy_anthropometric_model():
    """Deploy trained model to Azure ML endpoint."""
    
    # Connect to workspace
    ws = Workspace.from_config()
    
    # Get the trained model
    model = Model(ws, 'cgm-anthropometric-model')
    
    # Create inference configuration
    env = Environment.from_conda_specification(
        name='cgm-inference-env',
        file_path='conda_env.yml'
    )
    
    inference_config = InferenceConfig(
        entry_script='score.py',
        environment=env
    )
    
    # Configure deployment
    aci_config = AciWebservice.deploy_configuration(
        cpu_cores=2,
        memory_gb=4,
        description='Child Growth Monitor Anthropometric Prediction Service',
        auth_enabled=True,
        enable_app_insights=True
    )
    
    # Deploy model
    service = Model.deploy(
        workspace=ws,
        name='cgm-anthropometric-service',
        models=[model],
        inference_config=inference_config,
        deployment_config=aci_config,
        overwrite=True
    )
    
    service.wait_for_deployment(show_output=True)
    print(f"Service deployed at: {service.scoring_uri}")
    print(f"Service key: {service.get_keys()[0] if service.get_keys() else 'None'}")

if __name__ == "__main__":
    deploy_anthropometric_model()
```

#### Scoring Script for Model Endpoint
```python
# score.py - Azure ML endpoint scoring script
import json
import numpy as np
import torch
import torch.nn as nn
from azureml.core.model import Model
import joblib
import os

def init():
    """Initialize the model when the endpoint starts."""
    global anthropometric_model, scaler, device
    
    # Get model path
    model_path = Model.get_model_path('cgm-anthropometric-model')
    
    # Load PyTorch model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    # Recreate model architecture (should match training)
    class AnthropometricModel(nn.Module):
        def __init__(self, input_size=75, hidden_size=256):
            super().__init__()
            self.pose_encoder = nn.Sequential(
                nn.Linear(66, 128),
                nn.ReLU(),
                nn.BatchNorm1d(128),
                nn.Dropout(0.3),
                nn.Linear(128, 64),
                nn.ReLU()
            )
            
            self.metadata_encoder = nn.Sequential(
                nn.Linear(9, 32),
                nn.ReLU(),
                nn.Linear(32, 16)
            )
            
            self.predictor = nn.Sequential(
                nn.Linear(80, hidden_size),
                nn.ReLU(),
                nn.BatchNorm1d(hidden_size),
                nn.Dropout(0.4),
                nn.Linear(hidden_size, hidden_size // 2),
                nn.ReLU(),
                nn.Linear(hidden_size // 2, 4)
            )
        
        def forward(self, pose_keypoints, metadata):
            pose_features = self.pose_encoder(pose_keypoints)
            meta_features = self.metadata_encoder(metadata)
            combined = torch.cat([pose_features, meta_features], dim=1)
            return self.predictor(combined)
    
    # Load model weights
    anthropometric_model = AnthropometricModel().to(device)
    checkpoint = torch.load(os.path.join(model_path, 'best_model.pth'), map_location=device)
    anthropometric_model.load_state_dict(checkpoint['model_state_dict'])
    anthropometric_model.eval()
    
    # Load scaler if exists
    scaler_path = os.path.join(model_path, 'scaler.joblib')
    if os.path.exists(scaler_path):
        scaler = joblib.load(scaler_path)
    else:
        scaler = None

def run(raw_data):
    """Process incoming requests and return predictions."""
    try:
        # Parse input data
        data = json.loads(raw_data)
        
        # Extract features
        pose_keypoints = np.array(data['pose_keypoints'], dtype=np.float32)
        metadata = np.array(data['metadata'], dtype=np.float32)
        
        # Normalize if scaler available
        if scaler:
            pose_keypoints = scaler.transform(pose_keypoints.reshape(1, -1)).flatten()
        
        # Convert to tensors
        pose_tensor = torch.tensor(pose_keypoints, dtype=torch.float32).unsqueeze(0).to(device)
        meta_tensor = torch.tensor(metadata, dtype=torch.float32).unsqueeze(0).to(device)
        
        # Make prediction
        with torch.no_grad():
            predictions = anthropometric_model(pose_tensor, meta_tensor)
            predictions = predictions.cpu().numpy().flatten()
        
        # Format response
        result = {
            'height_cm': float(predictions[0]),
            'weight_kg': float(predictions[1]),
            'arm_circumference_cm': float(predictions[2]),
            'head_circumference_cm': float(predictions[3]),
            'model_version': 'v1.0',
            'confidence_score': 0.85  # Would be calculated based on model uncertainty
        }
        
        return json.dumps(result)
        
    except Exception as e:
        error_msg = f"Prediction error: {str(e)}"
        return json.dumps({'error': error_msg})
```

### 3.2 Integration with Existing ML Service

#### Updated ML Service with Azure Integration
```python
# ml-service/azure_integration.py
import os
import requests
import json
import logging
from typing import Dict, Optional
from azure.ai.ml import MLClient
from azure.identity import DefaultAzureCredential

logger = logging.getLogger(__name__)

class AzureMLIntegration:
    """Integration service for Azure ML endpoints."""
    
    def __init__(self):
        self.ml_client = MLClient.from_config(DefaultAzureCredential())
        self.endpoint_url = os.getenv('AZURE_ML_ENDPOINT_URL')
        self.endpoint_key = os.getenv('AZURE_ML_ENDPOINT_KEY')
        
    def predict_anthropometric_measurements(self, pose_data: Dict, metadata: Dict) -> Optional[Dict]:
        """Call Azure ML endpoint for anthropometric predictions."""
        try:
            # Prepare request data
            request_data = {
                'pose_keypoints': pose_data['keypoints'],
                'metadata': [
                    metadata.get('age_months', 24),
                    1.0 if metadata.get('gender') == 'male' else 0.0,
                    metadata.get('height_cm', 100),  # Device height
                    metadata.get('distance_cm', 150),  # Distance to child
                    metadata.get('lighting_level', 0.7),
                    metadata.get('video_quality', 0.8),
                    metadata.get('pose_confidence', 0.9),
                    metadata.get('frame_count', 30),
                    metadata.get('duration_seconds', 10)
                ]
            }
            
            # Make request to Azure ML endpoint
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.endpoint_key}'
            }
            
            response = requests.post(
                self.endpoint_url,
                headers=headers,
                data=json.dumps(request_data),
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info("Azure ML prediction successful")
                return result
            else:
                logger.error(f"Azure ML endpoint error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error calling Azure ML endpoint: {str(e)}")
            return None

# Update main.py to use Azure ML
@app.post("/predict/video", response_model=PredictionResult)
async def predict_from_video_azure(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    metadata: ScanMetadata = None
):
    """Process video using Azure ML models."""
    try:
        import time
        start_time = time.time()
        
        # Process video locally for pose estimation
        temp_video_path = f"/tmp/{video.filename}"
        with open(temp_video_path, "wb") as f:
            content = await video.read()
            f.write(content)
        
        # Extract poses
        frames, poses = video_processor.process_video(temp_video_path)
        
        if not poses:
            raise HTTPException(status_code=400, detail="No valid poses detected in video")
        
        # Get best pose
        best_pose = max(poses, key=lambda p: p.get('quality_score', 0))
        
        # Call Azure ML endpoint
        azure_ml = AzureMLIntegration()
        azure_predictions = azure_ml.predict_anthropometric_measurements(
            pose_data=best_pose,
            metadata={
                'age_months': metadata.child_age_months,
                'gender': metadata.child_gender,
                'scan_type': metadata.scan_type
            }
        )
        
        # Fallback to local predictions if Azure fails
        if not azure_predictions:
            logger.warning("Azure ML failed, using local predictions")
            measurements = measurement_calculator.calculate_measurements(
                poses, metadata.scan_type, metadata.child_age_months
            )
            azure_predictions = anthropometric_predictor.predict(
                measurements,
                age_months=metadata.child_age_months,
                gender=metadata.child_gender
            )
        
        # Calculate WHO metrics
        who_metrics = who_standards.calculate_metrics(
            height_cm=azure_predictions.get('height_cm', 85),
            weight_kg=azure_predictions.get('weight_kg', 12),
            age_months=metadata.child_age_months,
            gender=metadata.child_gender
        )
        
        # Create result
        result = create_prediction_result(azure_predictions, who_metrics, time.time() - start_time)
        
        # Clean up
        background_tasks.add_task(cleanup_temp_file, temp_video_path)
        
        return result
        
    except Exception as e:
        logger.error(f"Error in Azure ML prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
```

## 📋 Phase 4: Production Deployment (Weeks 4-6)

### 4.1 Azure DevOps CI/CD Pipeline

#### Azure Pipelines Configuration
```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
    - main
    - develop
  paths:
    exclude:
    - docs/*
    - README.md

variables:
  - group: cgm-production-variables
  - name: dockerRegistryServiceConnection
    value: 'cgm-acr-connection'
  - name: imageRepository
    value: 'child-growth-monitor'
  - name: containerRegistry
    value: 'cgmregistry.azurecr.io'
  - name: dockerfilePath
    value: '$(Build.SourcesDirectory)/backend/Dockerfile'
  - name: tag
    value: '$(Build.BuildId)'

stages:
- stage: Test
  displayName: 'Test Stage'
  jobs:
  - job: RunTests
    displayName: 'Run Tests'
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - task: UsePythonVersion@0
      inputs:
        versionSpec: '3.9'
        displayName: 'Use Python 3.9'
    
    - script: |
        cd backend
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest pytest-cov
      displayName: 'Install dependencies'
    
    - script: |
        cd backend
        python -m pytest tests/ --junitxml=junit/test-results.xml --cov=app --cov-report=xml
      displayName: 'Run backend tests'
    
    - task: PublishTestResults@2
      inputs:
        testResultsFiles: '**/test-*.xml'
        testRunTitle: 'Backend Tests'
    
    - task: PublishCodeCoverageResults@1
      inputs:
        codeCoverageTool: Cobertura
        summaryFileLocation: '$(System.DefaultWorkingDirectory)/**/coverage.xml'

- stage: Build
  displayName: 'Build Stage'
  dependsOn: Test
  jobs:
  - job: BuildBackend
    displayName: 'Build Backend'
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - task: Docker@2
      displayName: 'Build and push backend image'
      inputs:
        command: buildAndPush
        repository: $(imageRepository)-backend
        dockerfile: $(dockerfilePath)
        containerRegistry: $(dockerRegistryServiceConnection)
        tags: |
          $(tag)
          latest

  - job: BuildMLService
    displayName: 'Build ML Service'
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - task: Docker@2
      displayName: 'Build and push ML service image'
      inputs:
        command: buildAndPush
        repository: $(imageRepository)-ml
        dockerfile: $(Build.SourcesDirectory)/ml-service/Dockerfile
        containerRegistry: $(dockerRegistryServiceConnection)
        tags: |
          $(tag)
          latest

- stage: Deploy
  displayName: 'Deploy Stage'
  dependsOn: Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployToProduction
    displayName: 'Deploy to Production'
    pool:
      vmImage: 'ubuntu-latest'
    environment: 'cgm-production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureRmWebAppDeployment@4
            inputs:
              ConnectionType: 'AzureRM'
              azureSubscription: '$(azureServiceConnection)'
              appType: 'webAppContainer'
              WebAppName: '$(webAppName)'
              DockerNamespace: '$(containerRegistry)'
              DockerRepository: '$(imageRepository)-backend'
              DockerImageTag: '$(tag)'
```

### 4.2 Monitoring and Analytics

#### Application Insights Integration
```python
# backend/app/monitoring.py
from applicationinsights import TelemetryClient
from applicationinsights.requests import WSGIApplication
import os
import logging
from functools import wraps
import time

# Initialize Application Insights
instrumentation_key = os.getenv('APPLICATIONINSIGHTS_INSTRUMENTATION_KEY')
tc = TelemetryClient(instrumentation_key)

class ApplicationMonitoring:
    """Application monitoring and analytics service."""
    
    def __init__(self, app=None):
        self.tc = tc
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize monitoring for Flask app."""
        # Wrap WSGI app for automatic request tracking
        app.wsgi_app = WSGIApplication(instrumentation_key, app.wsgi_app)
        
        # Add custom error handler
        @app.errorhandler(Exception)
        def handle_exception(e):
            self.tc.track_exception()
            self.tc.flush()
            raise e
    
    def track_scan_session(self, session_data):
        """Track scan session metrics."""
        self.tc.track_event(
            'ScanSessionCompleted',
            properties={
                'child_age_months': session_data.get('child_age_months'),
                'gender': session_data.get('gender'),
                'scan_type': session_data.get('scan_type'),
                'processing_time': session_data.get('processing_time'),
                'prediction_confidence': session_data.get('confidence'),
                'location_country': session_data.get('location_country')
            },
            measurements={
                'height_predicted': session_data.get('height'),
                'weight_predicted': session_data.get('weight'),
                'scan_quality_score': session_data.get('scan_quality', 0)
            }
        )
    
    def track_malnutrition_detection(self, prediction_data):
        """Track malnutrition detection for health analytics."""
        risk_level = prediction_data.get('overall_risk', 'unknown')
        
        self.tc.track_event(
            'MalnutritionScreening',
            properties={
                'risk_level': risk_level,
                'stunting_status': prediction_data.get('stunting_status'),
                'wasting_status': prediction_data.get('wasting_status'),
                'underweight_status': prediction_data.get('underweight_status'),
                'age_group': self._get_age_group(prediction_data.get('age_months', 24))
            },
            measurements={
                'height_z_score': prediction_data.get('height_z_score', 0),
                'weight_z_score': prediction_data.get('weight_z_score', 0),
                'wfh_z_score': prediction_data.get('wfh_z_score', 0)
            }
        )
        
        # Track critical cases separately
        if risk_level == 'critical':
            self.tc.track_event(
                'CriticalMalnutritionCase',
                properties={
                    'location': prediction_data.get('location'),
                    'healthcare_facility': prediction_data.get('facility_name')
                }
            )
    
    def _get_age_group(self, age_months):
        """Categorize age for analytics."""
        if age_months < 6:
            return '0-6_months'
        elif age_months < 12:
            return '6-12_months'
        elif age_months < 24:
            return '12-24_months'
        elif age_months < 36:
            return '24-36_months'
        else:
            return '36+_months'
    
    def track_performance_metrics(self, endpoint, duration, success=True):
        """Track API performance metrics."""
        self.tc.track_dependency(
            'HTTP',
            endpoint,
            f'API_{endpoint}',
            duration,
            success
        )

# Performance monitoring decorator
def monitor_performance(operation_name):
    """Decorator to monitor function performance."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            success = True
            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                success = False
                tc.track_exception()
                raise
            finally:
                duration = time.time() - start_time
                tc.track_dependency(
                    'Function',
                    operation_name,
                    func.__name__,
                    duration * 1000,  # Convert to milliseconds
                    success
                )
                tc.flush()
        return wrapper
    return decorator
```

## 📊 Implementation Timeline & Costs

### Timeline Summary
| Phase | Duration | Key Deliverables | Azure Services |
|-------|----------|------------------|----------------|
| **Phase 1** | 4 weeks | ML model training, Azure ML setup | Azure ML, Storage |
| **Phase 2** | 2 weeks | Infrastructure deployment | App Service, B2C, PostgreSQL |
| **Phase 3** | 2 weeks | Model deployment, API integration | ML Endpoints, Container Registry |
| **Phase 4** | 2 weeks | Production deployment, monitoring | DevOps, Application Insights |

### Estimated Azure Costs (Monthly)
```
Development Environment:
- Azure ML Basic: $100
- App Service B1: $55
- PostgreSQL Basic: $25
- Storage (100GB): $5
- B2C (1000 users): $0
Total Dev: ~$185/month

Production Environment:
- Azure ML Standard: $500
- App Service P1v3: $200
- PostgreSQL General Purpose: $150
- Storage (1TB): $25
- B2C (10K users): $15
- Application Insights: $50
- Container Registry: $20
Total Prod: ~$960/month

Scaling (100K users):
- Auto-scaling App Services: $800
- Premium ML endpoints: $1200
- Enterprise PostgreSQL: $400
- Storage (10TB): $250
- B2C Premium: $150
Total Scale: ~$2800/month
```

## 🎯 Success Metrics

### Technical KPIs
- **Model Accuracy**: >90% correlation with manual measurements
- **API Response Time**: <2 seconds for predictions
- **Uptime**: 99.9% availability
- **Scan Processing**: <30 seconds per video

### Health Impact KPIs
- **Screenings per Month**: Target 10,000+ by month 6
- **Early Detection Rate**: >80% of malnutrition cases
- **Healthcare Worker Adoption**: >500 trained users
- **Geographic Reach**: 10+ countries by year 1

This comprehensive Azure integration plan provides a roadmap for scaling the Child Growth Monitor from a development prototype to a production-ready global health solution supporting the UN SDG goal of Zero Hunger by 2030.

## 🚀 Next Steps

1. **Week 1**: Set up Azure ML workspace and start model training
2. **Week 2**: Configure Azure B2C and App Service infrastructure  
3. **Week 3**: Deploy ML models to Azure endpoints
4. **Week 4**: Set up CI/CD pipeline and monitoring
5. **Week 5-6**: Production deployment and healthcare partner onboarding

Ready to begin Azure integration! 🌍
