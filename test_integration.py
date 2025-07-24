"""
Integration test script for Child Growth Monitor
Tests communication between Backend, ML Service, and basic functionality
"""

import requests
import json
import os
from pathlib import Path

# Service URLs
BACKEND_URL = "http://localhost:5002"
ML_SERVICE_URL = "http://localhost:8002"

def test_service_health():
    """Test health endpoints of all services"""
    print("🔍 Testing service health...")
    
    # Test Backend
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        print(f"✅ Backend: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Backend: {e}")
        return False
    
    # Test ML Service
    try:
        response = requests.get(f"{ML_SERVICE_URL}/health")
        print(f"✅ ML Service: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ ML Service: {e}")
        return False
    
    return True

def test_ml_analysis():
    """Test ML service analysis endpoint"""
    print("\n🧠 Testing ML analysis...")
    
    try:
        # Use the test image we created
        test_image_path = Path("test_image.png")
        if not test_image_path.exists():
            print("❌ Test image not found")
            return False
        
        with open(test_image_path, 'rb') as img_file:
            files = {'image_file': img_file}
            data = {
                'age_months': 24,
                'gender': 'male'
            }
            
            response = requests.post(f"{ML_SERVICE_URL}/analyze", files=files, data=data)
            
        if response.status_code == 200:
            result = response.json()
            print(f"✅ ML Analysis successful:")
            print(f"   Height: {result['height_cm']} cm")
            print(f"   Weight: {result['weight_kg']} kg")
            print(f"   MUAC: {result['muac_cm']} cm")
            print(f"   Nutritional Status: {result['nutritional_status']}")
            print(f"   Confidence: {result['confidence']:.2f}")
            return True
        else:
            print(f"❌ ML Analysis failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ML Analysis error: {e}")
        return False

def test_ml_model_status():
    """Test ML service model status endpoint"""
    print("\n📊 Testing ML model status...")
    
    try:
        response = requests.get(f"{ML_SERVICE_URL}/models/status")
        if response.status_code == 200:
            models = response.json()
            print("✅ ML Models status:")
            for model_name, status in models.items():
                print(f"   {model_name}: {status['status']} (v{status['version']})")
            return True
        else:
            print(f"❌ Model status failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Model status error: {e}")
        return False

def test_backend_api_endpoints():
    """Test some basic backend API endpoints"""
    print("\n🔗 Testing backend API endpoints...")
    
    # Test available endpoints (should return 404 but show the service is responding)
    test_endpoints = [
        "/api/children",
        "/api/scans", 
        "/api/auth/login"
    ]
    
    for endpoint in test_endpoints:
        try:
            response = requests.get(f"{BACKEND_URL}{endpoint}")
            # We expect some endpoints to return 404 or 405, that's OK
            if response.status_code in [200, 404, 405]:
                print(f"✅ {endpoint}: Service responding ({response.status_code})")
            else:
                print(f"⚠️  {endpoint}: Unexpected status {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint}: {e}")

def main():
    """Run all integration tests"""
    print("🚀 Child Growth Monitor - Integration Tests")
    print("=" * 50)
    
    # Test health endpoints
    if not test_service_health():
        print("\n❌ Health check failed. Ensure all services are running:")
        print(f"   Backend: {BACKEND_URL}")
        print(f"   ML Service: {ML_SERVICE_URL}")
        return
    
    # Test ML functionality
    test_ml_analysis()
    test_ml_model_status()
    
    # Test backend endpoints
    test_backend_api_endpoints()
    
    print("\n" + "=" * 50)
    print("🎉 Integration tests completed!")
    print("\n📱 Next steps:")
    print("   1. Start mobile app: cd mobile-app && npm start")
    print("   2. Open Expo Go app on your phone")
    print("   3. Scan the QR code to run the mobile app")
    print("   4. Test end-to-end functionality")

if __name__ == "__main__":
    main()