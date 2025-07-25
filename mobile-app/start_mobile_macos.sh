#!/bin/bash
# macOS Mobile App Starter Script
# Handles file descriptor limits and common macOS issues

echo "🚀 Starting Child Growth Monitor Mobile App on macOS..."

# Check current file descriptor limit
current_limit=$(ulimit -n)
echo "📊 Current file descriptor limit: $current_limit"

# Increase file descriptor limit if needed
if [ "$current_limit" -lt 65536 ]; then
    echo "⚠️  Increasing file descriptor limit to 65536..."
    ulimit -n 65536
    new_limit=$(ulimit -n)
    echo "✅ New file descriptor limit: $new_limit"
else
    echo "✅ File descriptor limit is sufficient"
fi

# Check if we're in the mobile-app directory
if [ ! -f "package.json" ]; then
    echo "📁 Navigating to mobile-app directory..."
    cd mobile-app
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check for package conflicts and fix them
echo "🔧 Checking for package version conflicts..."
npx expo install --fix

# Start the development server with optimal settings for macOS
echo "🎯 Starting Expo development server..."
echo "📱 Scan the QR code with Expo Go app on your phone"
echo "🔗 Or press 'w' to open in web browser"
echo ""

# Start with increased limits and Metro optimizations
# Set environment variables to reduce file watching load
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
export EXPO_NO_FILE_WATCH=1
export WATCHMAN_DISABLE_FILE_WATCH=1
export EXPO_FORKED_PROCESS_CLEANUP=0

# Try web-first approach if file watching fails
echo "🌐 Starting optimized web version (reduced warnings)..."
npm run web:quiet &

# Wait a moment for web server to start
sleep 5

# Check if web server started successfully
if curl -s http://localhost:19006 > /dev/null; then
    echo "✅ Web server started successfully at http://localhost:19006"
    echo "🚀 You can now test the app in your browser"
    echo "📱 Login with: healthcare@example.org / healthcare123"
    echo ""
    echo "📱 For mobile testing, also starting QR code server..."
    # Try to start mobile server with reduced file watching
    EXPO_NO_FILE_WATCH=1 WATCHMAN_DISABLE_FILE_WATCH=1 npm start
else
    echo "❌ Web server failed to start, trying standard approach..."
    npm start
fi
