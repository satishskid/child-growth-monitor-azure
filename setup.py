#!/usr/bin/env python3
"""
Child Growth Monitor Project Setup Script
Initializes the entire development environment including all services.
"""

import os
import sys
import subprocess
import platform
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Project directories
PROJECT_ROOT = Path(__file__).parent
MOBILE_APP_DIR = PROJECT_ROOT / "mobile-app"
BACKEND_DIR = PROJECT_ROOT / "backend"
ML_SERVICE_DIR = PROJECT_ROOT / "ml-service"


def run_command(command, cwd=None, shell=True):
    """Run a shell command and return success status."""
    try:
        logger.info(f"Running: {command}")
        if cwd:
            logger.info(f"In directory: {cwd}")
        
        result = subprocess.run(
            command,
            shell=shell,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode == 0:
            logger.info("✓ Command completed successfully")
            return True
        else:
            logger.error(f"✗ Command failed with return code {result.returncode}")
            logger.error(f"STDOUT: {result.stdout}")
            logger.error(f"STDERR: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        logger.error("✗ Command timed out")
        return False
    except Exception as e:
        logger.error(f"✗ Command failed: {str(e)}")
        return False


def check_prerequisites():
    """Check if required software is installed."""
    logger.info("🔍 Checking prerequisites...")
    
    prerequisites = {
        "node": ["node", "--version"],
        "npm": ["npm", "--version"],
        "python": ["python3", "--version"],
        "pip": ["pip3", "--version"]
    }
    
    missing = []
    
    for name, command in prerequisites.items():
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                version = result.stdout.strip()
                logger.info(f"✓ {name}: {version}")
            else:
                missing.append(name)
                logger.error(f"✗ {name}: not found")
        except:
            missing.append(name)
            logger.error(f"✗ {name}: not found")
    
    if missing:
        logger.error(f"Missing prerequisites: {', '.join(missing)}")
        logger.error("Please install the missing software and try again.")
        return False
    
    logger.info("✓ All prerequisites found")
    return True


def setup_mobile_app():
    """Setup React Native mobile app."""
    logger.info("📱 Setting up mobile app...")
    
    if not MOBILE_APP_DIR.exists():
        logger.error(f"Mobile app directory not found: {MOBILE_APP_DIR}")
        return False
    
    # Install dependencies
    if not run_command("npm install", cwd=MOBILE_APP_DIR):
        logger.error("Failed to install mobile app dependencies")
        return False
    
    # Check for Expo CLI
    expo_check = subprocess.run(["npx", "expo", "--version"], capture_output=True)
    if expo_check.returncode != 0:
        logger.info("Installing Expo CLI...")
        if not run_command("npm install -g @expo/cli"):
            logger.warning("Failed to install Expo CLI globally, but local install should work")
    
    logger.info("✓ Mobile app setup completed")
    return True


def setup_backend():
    """Setup Flask backend."""
    logger.info("🖥️  Setting up backend...")
    
    if not BACKEND_DIR.exists():
        logger.error(f"Backend directory not found: {BACKEND_DIR}")
        return False
    
    # Create virtual environment
    venv_path = BACKEND_DIR / "venv"
    if not venv_path.exists():
        logger.info("Creating Python virtual environment...")
        if not run_command("python3 -m venv venv", cwd=BACKEND_DIR):
            logger.error("Failed to create virtual environment")
            return False
    
    # Determine activation script based on OS
    if platform.system() == "Windows":
        activate_script = venv_path / "Scripts" / "activate"
        pip_command = "venv\\Scripts\\pip install -r requirements.txt"
    else:
        activate_script = venv_path / "bin" / "activate"
        pip_command = "venv/bin/pip install -r requirements.txt"
    
    # Install dependencies
    logger.info("Installing Python dependencies...")
    if not run_command(pip_command, cwd=BACKEND_DIR):
        logger.error("Failed to install backend dependencies")
        return False
    
    # Initialize database
    logger.info("Initializing database...")
    if platform.system() == "Windows":
        init_db_command = "venv\\Scripts\\python init_db.py init"
    else:
        init_db_command = "venv/bin/python init_db.py init"
    
    if not run_command(init_db_command, cwd=BACKEND_DIR):
        logger.warning("Database initialization failed, but this might be expected on first run")
    
    logger.info("✓ Backend setup completed")
    return True


def setup_ml_service():
    """Setup ML service."""
    logger.info("🤖 Setting up ML service...")
    
    if not ML_SERVICE_DIR.exists():
        logger.error(f"ML service directory not found: {ML_SERVICE_DIR}")
        return False
    
    # Create virtual environment
    venv_path = ML_SERVICE_DIR / "venv"
    if not venv_path.exists():
        logger.info("Creating Python virtual environment for ML service...")
        if not run_command("python3 -m venv venv", cwd=ML_SERVICE_DIR):
            logger.error("Failed to create ML service virtual environment")
            return False
    
    # Determine pip command based on OS
    if platform.system() == "Windows":
        pip_command = "venv\\Scripts\\pip install -r requirements.txt"
    else:
        pip_command = "venv/bin/pip install -r requirements.txt"
    
    # Install dependencies
    logger.info("Installing ML dependencies (this may take a while)...")
    if not run_command(pip_command, cwd=ML_SERVICE_DIR):
        logger.error("Failed to install ML service dependencies")
        return False
    
    # Create necessary directories
    models_dir = ML_SERVICE_DIR / "models"
    data_dir = ML_SERVICE_DIR / "data"
    temp_dir = ML_SERVICE_DIR / "temp"
    
    for directory in [models_dir, data_dir, temp_dir]:
        directory.mkdir(exist_ok=True)
    
    logger.info("✓ ML service setup completed")
    return True


def create_env_files():
    """Create environment configuration files."""
    logger.info("📝 Creating environment configuration files...")
    
    # Mobile app .env
    mobile_env_path = MOBILE_APP_DIR / ".env"
    if not mobile_env_path.exists():
        mobile_env_content = """# Child Growth Monitor Mobile App Environment Variables
EXPO_APP_NAME=Child Growth Monitor
EXPO_APP_VERSION=1.0.0

# API Configuration
API_BASE_URL=http://localhost:5000/api
ML_SERVICE_URL=http://localhost:8001

# Development settings
EXPO_DEVELOPMENT_MODE=true
EXPO_DEBUG=true
"""
        mobile_env_path.write_text(mobile_env_content)
        logger.info("✓ Created mobile app .env file")
    
    # Backend .env
    backend_env_path = BACKEND_DIR / ".env"
    if not backend_env_path.exists():
        backend_env_content = """# Child Growth Monitor Backend Environment Variables
FLASK_ENV=development
FLASK_DEBUG=true

# Database
DATABASE_URL=sqlite:///cgm_development.db

# Security
SECRET_KEY=your-secret-key-change-in-production
ENCRYPTION_KEY=your-32-character-encryption-key

# ML Service
ML_SERVICE_URL=http://localhost:8001

# Azure (for production)
AZURE_STORAGE_CONNECTION_STRING=
AZURE_ML_WORKSPACE_NAME=
AZURE_B2C_TENANT_NAME=
"""
        backend_env_path.write_text(backend_env_content)
        logger.info("✓ Created backend .env file")
    
    # ML Service .env
    ml_env_path = ML_SERVICE_DIR / ".env"
    if not ml_env_path.exists():
        ml_env_content = """# Child Growth Monitor ML Service Environment Variables
ENVIRONMENT=development
CGM_ML_DEBUG=true

# API Configuration
CGM_ML_API_HOST=0.0.0.0
CGM_ML_API_PORT=8001

# ML Settings
CGM_ML_MODEL_PATH=models/
CGM_ML_MAX_VIDEO_SIZE_MB=100
CGM_ML_TARGET_FPS=10

# Logging
CGM_ML_LOG_LEVEL=INFO
"""
        ml_env_path.write_text(ml_env_content)
        logger.info("✓ Created ML service .env file")


def create_start_scripts():
    """Create convenient start scripts."""
    logger.info("🚀 Creating start scripts...")
    
    # Create start script for all services
    if platform.system() == "Windows":
        start_all_script = PROJECT_ROOT / "start_all.bat"
        start_all_content = """@echo off
echo Starting Child Growth Monitor Development Environment...

echo.
echo Starting Backend Server...
start "CGM Backend" cmd /k "cd backend && venv\\Scripts\\activate && python app.py"

echo.
echo Starting ML Service...
start "CGM ML Service" cmd /k "cd ml-service && venv\\Scripts\\activate && python -m uvicorn main:app --reload --port 8001"

echo.
echo Starting Mobile App...
start "CGM Mobile App" cmd /k "cd mobile-app && npm start"

echo.
echo All services started! Check the opened windows for status.
echo Backend: http://localhost:5000
echo ML Service: http://localhost:8001
echo Mobile App: Follow Expo instructions
pause
"""
        start_all_script.write_text(start_all_content)
    else:
        start_all_script = PROJECT_ROOT / "start_all.sh"
        start_all_content = """#!/bin/bash
echo "Starting Child Growth Monitor Development Environment..."

# Start backend
echo "Starting Backend Server..."
cd backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!
cd ..

# Start ML service
echo "Starting ML Service..."
cd ml-service
source venv/bin/activate
python -m uvicorn main:app --reload --port 8001 &
ML_PID=$!
cd ..

# Start mobile app
echo "Starting Mobile App..."
cd mobile-app
npm start &
MOBILE_PID=$!
cd ..

echo "All services started!"
echo "Backend: http://localhost:5000 (PID: $BACKEND_PID)"
echo "ML Service: http://localhost:8001 (PID: $ML_PID)"
echo "Mobile App: Follow Expo instructions (PID: $MOBILE_PID)"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo "Stopping services..."; kill $BACKEND_PID $ML_PID $MOBILE_PID; exit' INT
wait
"""
        start_all_script.write_text(start_all_content)
        start_all_script.chmod(0o755)  # Make executable
    
    logger.info(f"✓ Created start script: {start_all_script}")


def verify_setup():
    """Verify that the setup was successful."""
    logger.info("🔍 Verifying setup...")
    
    checks = []
    
    # Check mobile app
    package_json = MOBILE_APP_DIR / "package.json"
    node_modules = MOBILE_APP_DIR / "node_modules"
    checks.append(("Mobile app package.json", package_json.exists()))
    checks.append(("Mobile app dependencies", node_modules.exists()))
    
    # Check backend
    backend_venv = BACKEND_DIR / "venv"
    requirements_txt = BACKEND_DIR / "requirements.txt"
    checks.append(("Backend virtual environment", backend_venv.exists()))
    checks.append(("Backend requirements.txt", requirements_txt.exists()))
    
    # Check ML service
    ml_venv = ML_SERVICE_DIR / "venv"
    ml_requirements = ML_SERVICE_DIR / "requirements.txt"
    checks.append(("ML service virtual environment", ml_venv.exists()))
    checks.append(("ML service requirements.txt", ml_requirements.exists()))
    
    # Report results
    all_good = True
    for name, status in checks:
        if status:
            logger.info(f"✓ {name}")
        else:
            logger.error(f"✗ {name}")
            all_good = False
    
    return all_good


def main():
    """Main setup function."""
    logger.info("🏗️  Child Growth Monitor - Development Setup")
    logger.info("=" * 50)
    
    # Check prerequisites
    if not check_prerequisites():
        sys.exit(1)
    
    # Setup each component
    success = True
    
    success &= setup_mobile_app()
    success &= setup_backend()
    success &= setup_ml_service()
    
    # Create configuration files
    create_env_files()
    create_start_scripts()
    
    # Verify setup
    if verify_setup():
        logger.info("🎉 Setup completed successfully!")
        logger.info("")
        logger.info("Next steps:")
        logger.info("1. Review and update .env files with your specific configuration")
        logger.info("2. Run the start script to launch all services:")
        if platform.system() == "Windows":
            logger.info("   start_all.bat")
        else:
            logger.info("   ./start_all.sh")
        logger.info("3. Open your mobile device and scan the QR code from Expo")
        logger.info("")
        logger.info("Service URLs:")
        logger.info("- Backend API: http://localhost:5000")
        logger.info("- ML Service: http://localhost:8001")
        logger.info("- API Documentation: http://localhost:8001/docs")
    else:
        logger.error("❌ Setup completed with errors. Please check the logs above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
