# Child Growth Monitor 🌟

> **Comprehensive smartphone-based 3D child scanning solution for detecting malnutrition using machine learning and computer vision.**

[![Development Status](https://img.shields.io/badge/Status-Development-yellow.svg)](DEVELOPMENT_STATUS.md)
[![Backend](https://img.shields.io/badge/Backend-Running-green.svg)](http://localhost:5002/health)
[![ML Service](https://img.shields.io/badge/ML%20Service-Running-green.svg)](http://localhost:8002/health)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🎯 Project Overview

The Child Growth Monitor is an innovative healthcare technology solution that enables healthcare workers in remote areas to detect child malnutrition using smartphones. The system combines:

- **📱 Mobile App**: React Native/Expo app for 3D child scanning
- **🧠 ML Service**: FastAPI service with computer vision models
- **⚡ Backend API**: Flask API with secure data management
- **☁️ Cloud Integration**: Azure services for scalability

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+** (3.13 tested and working)
- **Node.js 16+** 
- **npm** or **yarn**
- **Git**

### 1. Clone Repository
```bash
git clone <repository-url>
cd child-growth-monitor
```

### 2. Start All Services
```bash
# Make the script executable (first time only)
chmod +x start_dev_environment.sh

# Start all services
./start_dev_environment.sh
```

### 3. Test Integration
```bash
python test_integration.py
```

### 4. Access Services
- **Backend API**: http://localhost:5002
- **ML Service**: http://localhost:8002  
- **Mobile App**: http://localhost:8081

## 📱 Mobile App Setup

Detailed mobile app setup instructions are available in [mobile-app/README.md](mobile-app/README.md).

### Quick Mobile App Start
```bash
cd mobile-app
npm install
npm start
```

Then scan the QR code with Expo Go app on your phone.

## 🆘 Troubleshooting

### Common Issues

#### Mobile App Won't Start (macOS)
```bash
# Increase file descriptor limit
ulimit -n 65536
cd mobile-app && npm start
```

#### Services Not Communicating
```bash
# Check if services are running
curl localhost:5002/health
curl localhost:8002/health

# Restart services
./start_dev_environment.sh
```

#### Database Issues
```bash
# Reinitialize database
cd backend && python init_db.py
```

## 🎯 Next Steps

After setting up the development environment:

1. **📱 Test Mobile App**: Follow [mobile-app/README.md](mobile-app/README.md)
2. **🧪 Run Integration Tests**: `python test_integration.py`
3. **🔧 Explore APIs**: Check backend and ML service endpoints
4. **📚 Read Documentation**: Review architecture and deployment guides
5. **🚀 Start Developing**: Create your first feature or improvement

**Ready to make a difference in child healthcare? Let's build something amazing! 🌟**