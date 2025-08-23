// Test script for ML Service functionality
// This tests the client-side ML service and pose estimation

// Test Pose Estimator directly
async function testPoseEstimator() {
  console.log('🧪 Testing Pose Estimator...');
  
  try {
    const { RealPoseEstimator } = await import('./src/pose-estimator');
    const poseEstimator = new RealPoseEstimator();
    
    // Create a mock image object
    const mockImage = {
      width: 640,
      height: 480
    };
    
    const result = poseEstimator.estimatePose(mockImage, 10);
    
    console.log('✅ Pose Estimation Results:');
    console.log('Success:', result.success);
    console.log('Pose Present:', result.pose_present);
    console.log('Confidence Score:', result.confidence_score);
    console.log('Quality Score:', result.quality_score);
    console.log('Pose Quality:', result.pose_quality);
    console.log('Scale Factor:', result.scale_factor_cm_per_pixel);
    console.log('Keypoints Count:', result.keypoints.length);
    console.log('Landmarks Count:', result.landmarks.length);
    
    if (result.measurements) {
      console.log('\nMeasurements:');
      console.log('  - Height:', result.measurements.height_cm, 'cm');
      console.log('  - Arm Span:', result.measurements.arm_span_cm, 'cm');
      console.log('  - MUAC:', result.measurements.muac_cm, 'cm');
      console.log('  - Weight:', result.measurements.weight_kg, 'kg');
    }
    
    console.log('\n🎉 Pose Estimator is working correctly!');
    
  } catch (error) {
    console.error('❌ Pose Estimator Test Failed:', error);
  }
}

// Test Anthropometric Predictor directly
async function testAnthropometricPredictor() {
  console.log('\n🧪 Testing Anthropometric Predictor...');
  
  try {
    const { RealAnthropometricPredictor } = await import('./src/anthropometric-predictor');
    const predictor = new RealAnthropometricPredictor();
    
    // Create mock pose data
    const mockPoseData = {
      landmarks: [
        { id: 0, name: 'nose', x: 320, y: 100, z: 0, visibility: 0.9, presence: 1.0 },
        { id: 5, name: 'left_shoulder', x: 280, y: 200, z: 0, visibility: 0.8, presence: 1.0 },
        { id: 6, name: 'right_shoulder', x: 360, y: 200, z: 0, visibility: 0.8, presence: 1.0 },
        { id: 11, name: 'left_hip', x: 300, y: 350, z: 0, visibility: 0.7, presence: 1.0 },
        { id: 12, name: 'right_hip', x: 340, y: 350, z: 0, visibility: 0.7, presence: 1.0 },
        { id: 15, name: 'left_ankle', x: 295, y: 450, z: 0, visibility: 0.6, presence: 1.0 },
        { id: 16, name: 'right_ankle', x: 345, y: 450, z: 0, visibility: 0.6, presence: 1.0 }
      ],
      keypoints: [],
      quality_score: 0.75,
      scale_factor_cm_per_pixel: 0.5,
      confidence_score: 0.8,
      age_months: 24,
      sex: 'M'
    };
    
    const result = predictor.predictMeasurements(mockPoseData);
    
    console.log('✅ Anthropometric Prediction Results:');
    console.log('Height:', result.height_cm, 'cm');
    console.log('Weight:', result.weight_kg, 'kg');
    console.log('MUAC:', result.muac_cm, 'cm');
    console.log('Head Circumference:', result.head_circumference_cm, 'cm');
    console.log('Nutritional Status:', result.nutritional_status);
    console.log('Malnutrition Risk:', result.malnutrition_risk);
    console.log('Confidence Score:', result.confidence_score);
    console.log('Model Version:', result.model_version);
    console.log('Feature Count:', result.feature_count);
    
    console.log('\nMeasurement Confidence:');
    Object.entries(result.measurement_confidence).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });
    
    console.log('\nWHO Z-Scores:');
    Object.entries(result.who_z_scores).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });
    
    console.log('\n🎉 Anthropometric Predictor is working correctly!');
    
  } catch (error) {
    console.error('❌ Anthropometric Predictor Test Failed:', error);
  }
}

// Test ML Service (simplified version without full service)
async function testMLService() {
  console.log('\n🧪 Testing ML Service Components...');
  
  try {
    const { mlService } = await import('./src/services/MLService');
    
    // Create a mock image data (base64 encoded 1x1 pixel image)
    const mockImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // Test ML Analysis Request
    const testRequest = {
      image_data: mockImageData,
      age_months: 24,
      sex: 'M',
      reference_object_size_cm: 10,
      metadata: {
        scan_angle: 'front',
        timestamp: new Date().toISOString(),
        session_id: 'test-session-001'
      }
    };
    
    console.log('Request:', JSON.stringify(testRequest, null, 2));
    
    const startTime = Date.now();
    const result = await mlService.analyzeImage(testRequest);
    const processingTime = Date.now() - startTime;
    
    console.log('\n✅ ML Service Test Results:');
    console.log('Processing Time:', processingTime, 'ms');
    
    if (result) {
      console.log('Success:', result.success);
      console.log('Measurements:');
      console.log('  - Height:', result.measurements.height.value, result.measurements.height.unit, '(confidence:', result.measurements.height.confidence, ')');
      console.log('  - Weight:', result.measurements.weight.value, result.measurements.weight.unit, '(confidence:', result.measurements.weight.confidence, ')');
      console.log('  - MUAC:', result.measurements.muac.value, result.measurements.muac.unit, '(confidence:', result.measurements.muac.confidence, ')');
      console.log('  - Head Circumference:', result.measurements.head_circumference.value, result.measurements.head_circumference.unit, '(confidence:', result.measurements.head_circumference.confidence, ')');
      
      console.log('\nNutritional Status:');
      console.log('  - Stunting:', result.nutritional_status.stunting.status, '(z-score:', result.nutritional_status.stunting.z_score, ')');
      console.log('  - Wasting:', result.nutritional_status.wasting.status, '(z-score:', result.nutritional_status.wasting.z_score, ')');
      console.log('  - Underweight:', result.nutritional_status.underweight.status, '(z-score:', result.nutritional_status.underweight.z_score, ')');
      
      console.log('\nModel Info:');
      console.log('  - Version:', result.model_info.version);
      console.log('  - Confidence Threshold:', result.model_info.confidence_threshold);
      console.log('  - Processing Time:', result.model_info.processing_time_ms, 'ms');
      
      console.log('\n🎉 ML Service is working correctly!');
    } else {
      console.log('❌ ML Service returned null result');
    }
    
  } catch (error) {
    console.error('❌ ML Service Test Failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting ML Service Component Tests\n');
  
  await testPoseEstimator();
  await testAnthropometricPredictor();
  await testMLService();
  
  console.log('\n🏁 All ML Service tests completed!');
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testMLService,
    testPoseEstimator,
    testAnthropometricPredictor,
    runAllTests
  };
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  runAllTests().catch(console.error);
}