/**
 * WebAssembly Components Test
 * Tests WebAssembly support and opencv.js availability
 */

console.log('=== WebAssembly Components Test ===\n');

// Test 1: Check WebAssembly support
console.log('1. Testing WebAssembly Support...');
try {
  if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
    console.log('✅ WebAssembly is supported');
    
    // Test basic WASM functionality
    const wasmCode = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, // WASM header
      0x01, 0x07, 0x01, 0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f, // type section
      0x03, 0x02, 0x01, 0x00, // function section
      0x0a, 0x09, 0x01, 0x07, 0x00, 0x20, 0x00, 0x20, 0x01, 0x6a, 0x0b // code section
    ]);
    
    WebAssembly.instantiate(wasmCode).then(result => {
      console.log('✅ WebAssembly instantiation successful');
      const addFunction = result.instance.exports[Object.keys(result.instance.exports)[0]];
      if (typeof addFunction === 'function') {
        const testResult = addFunction(5, 3);
        console.log(`✅ WASM function execution: 5 + 3 = ${testResult}`);
      }
    }).catch(error => {
      console.log('❌ WebAssembly instantiation failed:', error.message);
    });
    
  } else {
    console.log('❌ WebAssembly is not supported in this environment');
  }
} catch (error) {
  console.log('❌ WebAssembly test failed:', error.message);
}

// Test 2: Check opencv.js availability
console.log('\n2. Testing opencv.js Availability...');
try {
  // Try to import opencv.js if it exists
  if (typeof window !== 'undefined') {
    // Browser environment
    if (typeof cv !== 'undefined') {
      console.log('✅ opencv.js is available globally');
      console.log(`   OpenCV version: ${cv.getBuildInformation ? 'Available' : 'Unknown'}`);
    } else {
      console.log('❌ opencv.js is not available globally');
      console.log('   Note: opencv.js needs to be installed and loaded');
    }
  } else {
    // Node.js environment
    console.log('⚠️  Running in Node.js environment - opencv.js requires browser context');
  }
} catch (error) {
  console.log('❌ opencv.js test failed:', error.message);
}

// Test 3: Check pose-estimator implementation
console.log('\n3. Testing Pose Estimator Implementation...');
try {
  // This will work in Node.js with ts-node
  const fs = require('fs');
  const path = require('path');
  
  const poseEstimatorPath = path.join(__dirname, 'src', 'pose-estimator.ts');
  if (fs.existsSync(poseEstimatorPath)) {
    const content = fs.readFileSync(poseEstimatorPath, 'utf8');
    
    if (content.includes('TODO: Implement body keypoint detection using opencv.js')) {
      console.log('⚠️  Pose estimator contains TODO for opencv.js implementation');
      console.log('   Current implementation uses mock data');
    } else {
      console.log('✅ Pose estimator appears to be implemented');
    }
    
    if (content.includes('opencv') || content.includes('cv.')) {
      console.log('✅ opencv.js references found in pose estimator');
    } else {
      console.log('❌ No opencv.js references found in pose estimator');
    }
  } else {
    console.log('❌ pose-estimator.ts file not found');
  }
} catch (error) {
  console.log('❌ Pose estimator test failed:', error.message);
}

// Test 4: Check package dependencies
console.log('\n4. Testing Package Dependencies...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const allDeps = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };
    
    const wasmRelated = Object.keys(allDeps).filter(dep => 
      dep.includes('opencv') || 
      dep.includes('wasm') || 
      dep.includes('webassembly')
    );
    
    if (wasmRelated.length > 0) {
      console.log('✅ WebAssembly/OpenCV related dependencies found:');
      wasmRelated.forEach(dep => {
        console.log(`   - ${dep}: ${allDeps[dep]}`);
      });
    } else {
      console.log('❌ No WebAssembly/OpenCV dependencies found in package.json');
      console.log('   Consider installing opencv.js for computer vision functionality');
    }
  }
} catch (error) {
  console.log('❌ Package dependencies test failed:', error.message);
}

// Test 5: Recommendations
console.log('\n5. Recommendations...');
console.log('To enable full WebAssembly functionality:');
console.log('1. Install opencv.js: npm install opencv.js');
console.log('2. Load opencv.js in your HTML or component');
console.log('3. Implement the TODO sections in pose-estimator.ts');
console.log('4. Test computer vision functionality with real images');

console.log('\n=== WebAssembly Test Complete ===');