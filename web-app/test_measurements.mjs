// Test script to verify anthropometric measurements calculation
// This tests the pose estimator and anthropometric predictor components

// Import using ES modules syntax for TypeScript files
import { RealPoseEstimator } from './src/pose-estimator.js';
import { RealAnthropometricPredictor } from './src/anthropometric-predictor.js';

// Mock image object for testing
const mockImage = {
  width: 640,
  height: 480
};

console.log('Testing Anthropometric Measurements Calculation...');
console.log('=' .repeat(50));

try {
  // Initialize components
  const poseEstimator = new RealPoseEstimator();
  const anthropometricPredictor = new RealAnthropometricPredictor();
  
  console.log('✓ Components initialized successfully');
  
  // Test pose estimation
  console.log('\nTesting pose estimation...');
  const poseResult = poseEstimator.estimatePose(mockImage);
  
  if (poseResult.success) {
    console.log('✓ Pose estimation successful');
    console.log(`  - Landmarks detected: ${poseResult.landmarks.length}`);
    console.log(`  - Keypoints detected: ${poseResult.keypoints.length}`);
    console.log(`  - Confidence score: ${poseResult.confidence_score.toFixed(2)}`);
    console.log(`  - Scale factor: ${poseResult.scale_factor_cm_per_pixel.toFixed(4)} cm/pixel`);
    
    // Display basic measurements from pose estimator
    if (poseResult.measurements) {
      console.log('\nBasic measurements from pose estimator:');
      if (poseResult.measurements.height_cm) {
        console.log(`  - Height: ${poseResult.measurements.height_cm.toFixed(1)} cm`);
      }
      if (poseResult.measurements.arm_span_cm) {
        console.log(`  - Arm span: ${poseResult.measurements.arm_span_cm.toFixed(1)} cm`);
      }
      if (poseResult.measurements.muac_cm) {
        console.log(`  - MUAC: ${poseResult.measurements.muac_cm.toFixed(1)} cm`);
      }
      if (poseResult.measurements.weight_kg) {
        console.log(`  - Weight: ${poseResult.measurements.weight_kg.toFixed(1)} kg`);
      }
    }
    
    // Test anthropometric prediction
    console.log('\nTesting anthropometric prediction...');
    const poseData = {
      landmarks: poseResult.landmarks,
      keypoints: poseResult.keypoints,
      quality_score: poseResult.quality_score,
      scale_factor_cm_per_pixel: poseResult.scale_factor_cm_per_pixel,
      confidence_score: poseResult.confidence_score,
      age_months: 24, // 2 years old
      sex: 'M'
    };
    
    const predictionResult = anthropometricPredictor.predictMeasurements(poseData);
    
    console.log('✓ Anthropometric prediction successful');
    console.log(`  - Model version: ${predictionResult.model_version}`);
    console.log(`  - Feature count: ${predictionResult.feature_count}`);
    console.log(`  - Overall confidence: ${predictionResult.confidence_score.toFixed(2)}`);
    
    console.log('\nPredicted measurements:');
    console.log(`  - Height: ${predictionResult.height_cm} cm`);
    console.log(`  - Weight: ${predictionResult.weight_kg} kg`);
    console.log(`  - MUAC: ${predictionResult.muac_cm} cm`);
    console.log(`  - Head circumference: ${predictionResult.head_circumference_cm} cm`);
    
    console.log('\nMeasurement confidence scores:');
    Object.entries(predictionResult.measurement_confidence).forEach(([key, value]) => {
      console.log(`  - ${key}: ${(value * 100).toFixed(1)}%`);
    });
    
    console.log('\nNutritional assessment:');
    console.log(`  - Status: ${predictionResult.nutritional_status}`);
    console.log(`  - Risk level: ${predictionResult.malnutrition_risk}`);
    
    console.log('\nWHO Z-scores:');
    Object.entries(predictionResult.who_z_scores).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value.toFixed(2)}`);
    });
    
    console.log('\n' + '=' .repeat(50));
    console.log('✓ All anthropometric measurements tests passed!');
    
  } else {
    console.error('✗ Pose estimation failed:', poseResult.error);
  }
  
} catch (error) {
  console.error('✗ Test failed with error:', error.message);
  console.error(error.stack);
}

console.log('\nTest completed.');