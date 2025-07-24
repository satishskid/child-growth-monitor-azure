#!/bin/bash
# Child Growth Monitor - Start All Services Script

echo "🚀 Starting Child Growth Monitor Development Environment"
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if script is run from the correct directory
if [ ! -d "backend" ] || [ ! -d "ml-service" ] || [ ! -d "mobile-app" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    echo "Expected directories: backend/, ml-service/, mobile-app/"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Start Backend Service
echo -e "${BLUE}🔧 Starting Backend Service (Port 5002)...${NC}"
if check_port 5002; then
    echo -e "${YELLOW}⚠️  Port 5002 already in use. Backend may already be running.${NC}"
else
    cd backend
    source venv/bin/activate
    export PORT=5002
    python app.py &
    BACKEND_PID=$!
    cd ..
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
fi

# Wait a moment for backend to start
sleep 2

# Start ML Service
echo -e "${BLUE}🧠 Starting ML Service (Port 8002)...${NC}"
if check_port 8002; then
    echo -e "${YELLOW}⚠️  Port 8002 already in use. ML Service may already be running.${NC}"
else
    cd ml-service
    source venv/bin/activate
    export PORT=8002
    python main_minimal.py &
    ML_PID=$!
    cd ..
    echo -e "${GREEN}✅ ML Service started (PID: $ML_PID)${NC}"
fi

# Wait a moment for ML service to start
sleep 2

# Test services
echo -e "${BLUE}🔍 Testing services...${NC}"

# Test Backend
if curl -s http://localhost:5002/health > /dev/null; then
    echo -e "${GREEN}✅ Backend is responding on http://localhost:5002${NC}"
else
    echo -e "${RED}❌ Backend is not responding${NC}"
fi

# Test ML Service
if curl -s http://localhost:8002/health > /dev/null; then
    echo -e "${GREEN}✅ ML Service is responding on http://localhost:8002${NC}"
else
    echo -e "${RED}❌ ML Service is not responding${NC}"
fi

# Start Mobile App (with file descriptor workaround)
echo -e "${BLUE}📱 Starting Mobile App...${NC}"
echo -e "${YELLOW}Note: The mobile app may have file watching issues on macOS.${NC}"
echo -e "${YELLOW}If it crashes, try one of these solutions:${NC}"
echo -e "${YELLOW}1. Use Expo Go app and scan the QR code${NC}"
echo -e "${YELLOW}2. Run: cd mobile-app && npm run web${NC}"
echo -e "${YELLOW}3. Increase file limits: ulimit -n 65536${NC}"

cd mobile-app
echo -e "${BLUE}Attempting to start mobile app...${NC}"

# Try to start with reduced file watching
WATCHMAN_DISABLE_FILE_WATCH=1 npm start &
MOBILE_PID=$!
cd ..

echo ""
echo "======================================================"
echo -e "${GREEN}🎉 Development Environment Started!${NC}"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo "• Backend API: http://localhost:5002"
echo "• ML Service:  http://localhost:8002"
echo "• Mobile App:  http://localhost:8081 (if started successfully)"
echo ""
echo -e "${BLUE}Test Integration:${NC}"
echo "python test_integration.py"
echo ""
echo -e "${BLUE}To stop all services:${NC}"
echo "• Press Ctrl+C to stop this script"
echo "• Or run: pkill -f 'python app.py' && pkill -f 'python main_minimal.py' && pkill -f 'expo start'"
echo ""
echo -e "${YELLOW}📝 Check DEVELOPMENT_STATUS.md for detailed setup information${NC}"

# Wait for user to interrupt
echo "Press Ctrl+C to stop all services..."
wait
