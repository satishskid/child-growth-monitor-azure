# 🚀 Quick Start Guide - Child Growth Monitor

## Overview
This guide gets you from zero to a fully deployed Child Growth Monitor system on Azure in under 2 hours.

## 📋 Prerequisites (5 minutes)

### Required Software
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install azure-cli
brew install --cask docker
brew install node
brew install python@3.9
```

### Azure Account Setup
1. **Create Azure Account**: [https://azure.microsoft.com/free/](https://azure.microsoft.com/free/)
2. **Get $200 free credits** for new accounts
3. **Login to Azure CLI**:
   ```bash
   az login
   ```

## 🌐 Step 1: Push to Git Repository (10 minutes)

### Option A: GitHub (Recommended)
```bash
# 1. Create new repository on GitHub
# Go to: https://github.com/new
# Repository name: child-growth-monitor
# Make it private (contains health data handling code)

# 2. Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/child-growth-monitor.git
git branch -M main
git push -u origin main
```

### Option B: Azure DevOps
```bash
# 1. Create Azure DevOps organization
# Go to: https://dev.azure.com

# 2. Create new project: "Child Growth Monitor"

# 3. Add remote and push
git remote add origin https://YOUR_ORG@dev.azure.com/YOUR_ORG/child-growth-monitor/_git/child-growth-monitor
git push -u origin main
```

### Option C: Use Automated Git Setup
```bash
# Run our automated git setup script
./scripts/git-setup.sh
```

## ☁️ Step 2: Deploy to Azure (45 minutes)

### Quick Deployment (Automated)
```bash
# One-command deployment to Azure
./scripts/azure-deploy.sh --environment production

# This will create:
# - Resource group with all Azure services
# - ML workspace with compute instances
# - App Services for backend and ML service
# - PostgreSQL database with encryption
# - Storage accounts for scan data
# - Container registry for Docker images
# - Application Insights for monitoring
```

### Manual Deployment (If you prefer step-by-step)
```bash
# Follow the detailed guide
open AZURE_DEPLOYMENT_GUIDE.md
```

## 📱 Step 3: Set Up Mobile Development (15 minutes)

### Install Dependencies
```bash
# Install mobile app dependencies
cd mobile-app
npm install

# Install Expo CLI globally
npm install -g @expo/cli

# Start development server
npm start
```

### Test on Device
1. **Install Expo Go** on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan QR code** from terminal to test on device

## 🤖 Step 4: Start ML Service (10 minutes)

### Local Development
```bash
# Start ML service locally
cd ml-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Test ML Endpoints
```bash
# Test pose estimation endpoint
curl -X POST "http://localhost:8001/health" | jq

# Test with sample data
curl -X POST "http://localhost:8001/predict/pose" \
  -H "Content-Type: application/json" \
  -d '{"test": true}' | jq
```

## 🖥️ Step 5: Start Backend API (10 minutes)

### Local Development
```bash
# Start backend server
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Initialize Database
```bash
# Create initial database schema
python init_db.py
```

### Test API Endpoints
```bash
# Test health endpoint
curl http://localhost:5000/health | jq

# Test authentication endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}' | jq
```

## 🎯 Step 6: Verify Complete System (5 minutes)

### Check All Services
```bash
# Check if all services are running
echo "🔍 Checking service status..."

# Mobile app (should show QR code)
echo "📱 Mobile App: Check terminal for QR code"

# Backend API
curl -s http://localhost:5000/health && echo "✅ Backend API: Running" || echo "❌ Backend API: Not running"

# ML Service  
curl -s http://localhost:8001/health && echo "✅ ML Service: Running" || echo "❌ ML Service: Not running"

# Azure services (if deployed)
if command -v az &> /dev/null; then
    az webapp show --name child-growth-monitor-backend-production --resource-group cgm-production-rg &> /dev/null && echo "✅ Azure Backend: Deployed" || echo "⏳ Azure Backend: Not deployed"
fi
```

### Test End-to-End Flow
1. **Open mobile app** on device via Expo Go
2. **Navigate through screens**:
   - Welcome → Login → Home → Consent → Scanning → Results
3. **Test camera permissions** on Scanning screen
4. **Check API connectivity** (login should work)

## 📊 Step 7: Monitor Deployment (Ongoing)

### Azure Portal Monitoring
1. **Open Azure Portal**: [https://portal.azure.com](https://portal.azure.com)
2. **Navigate to Resource Group**: `cgm-production-rg`
3. **Check Application Insights** for real-time metrics
4. **Monitor costs** in Cost Management

### Local Development Monitoring
```bash
# Monitor logs in real-time
tail -f backend/logs/app.log
tail -f ml-service/logs/ml.log

# Check system resources
htop  # or Activity Monitor on macOS
```

## 🎉 Success! Your Child Growth Monitor is Now Running

### 📱 **Mobile App**: Running on your device via Expo Go
### 🖥️ **Backend API**: http://localhost:5000
### 🤖 **ML Service**: http://localhost:8001  
### ☁️ **Azure Deployment**: Production-ready in the cloud
### 📊 **Monitoring**: Real-time metrics and alerts

## 🔄 Next Steps for Production

### 1. Healthcare Partner Integration (Week 1)
- Partner with local clinics for field testing
- Train healthcare workers on app usage
- Collect feedback and iterate

### 2. Model Training with Real Data (Week 2-3)
- Collect anonymized scan data from pilot programs
- Train custom ML models using Azure ML
- Validate accuracy against manual measurements

### 3. Regulatory Compliance (Week 3-4)
- Complete HIPAA compliance certification
- Implement GDPR data handling procedures
- Get healthcare regulatory approvals

### 4. Scale to Multiple Countries (Month 2-3)
- Deploy to additional Azure regions
- Localize app for different languages
- Partner with international health organizations

## 📞 Support & Resources

### Documentation
- **Development Guide**: [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Azure Integration**: [AZURE_INTEGRATION_PLAN.md](./AZURE_INTEGRATION_PLAN.md)
- **Project Status**: [PROJECT_STATUS.md](./PROJECT_STATUS.md)

### Emergency Support
- **Azure Support**: Available 24/7 with paid subscription
- **GitHub Issues**: Create issues for bugs and feature requests
- **Documentation**: Comprehensive guides in `/docs` folder

### Community
- **WHO Nutrition**: Partner with World Health Organization
- **UNICEF**: Collaborate on global malnutrition initiatives
- **Microsoft AI for Good**: Apply for AI for Good program support

---

**🌍 Impact Goal**: Help achieve UN SDG Goal 2 (Zero Hunger) by 2030 through technology-enabled malnutrition detection in underserved communities worldwide.

**💡 Remember**: This system handles sensitive child health data. Always prioritize privacy, security, and ethical data use in all implementations.
