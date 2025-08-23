import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@shared/types';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import mlService from '../services/MLService';

type ScanningScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Scanning'
>;

type ScanningScreenRouteProp = RouteProp<RootStackParamList, 'Scanning'>;

interface Props {
  navigation: ScanningScreenNavigationProp;
  route: ScanningScreenRouteProp;
}

type ScanType = 'front' | 'back' | 'side_left' | 'side_right';

const ScanningScreen: React.FC<Props> = ({ navigation, route }) => {
  const { childId, consentId } = route.params;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentScan, setCurrentScan] = useState<ScanType>('front');
  const [completedScans, setCompletedScans] = useState<ScanType[]>([]);
  const cameraRef = useRef<Camera>(null);

  const scanSequence: ScanType[] = ['front', 'back', 'side_left', 'side_right'];
  const scanInstructions = {
    front: 'Position the child facing the camera',
    back: 'Turn the child to face away from camera',
    side_left: 'Position the child sideways (left side)',
    side_right: 'Position the child sideways (right side)',
  };

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current && !isProcessing) {
      try {
        setIsProcessing(true);
        const photoData = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
        });

        // Process the taken picture
        await processScanData(photoData.base64, currentScan);

        // Mark current scan as completed
        setCompletedScans(prev => [...prev, currentScan]);

        // Move to next scan or finish
        const currentIndex = scanSequence.indexOf(currentScan);
        if (currentIndex < scanSequence.length - 1) {
          setCurrentScan(scanSequence[currentIndex + 1]);
        } else {
          // All scans completed
          navigation.navigate('Results', { sessionId: `session_${Date.now()}` });
        }

      } catch (error) {
        console.error('Taking picture failed:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const processScanData = async (base64Data: string | undefined, scanType: ScanType) => {
    if (!base64Data) {
      Alert.alert('Error', 'No image data captured.');
      return;
    }
    console.log(`Processing ${scanType} scan...`);

    try {
      const result = await mlService.analyzeImage({
        image_data: base64Data,
        metadata: { scan_angle: scanType as any },
      });

      if (result && result.success) {
        console.log('Analysis successful:', result);
        const { height, weight, muac } = result.measurements;
        Alert.alert(
          'Analysis Complete',
          `Height: ${height.value.toFixed(1)} cm\nWeight: ${weight.value.toFixed(1)} kg\nMUAC: ${muac.value.toFixed(1)} cm`,
        );
      } else {
        Alert.alert('Analysis Failed', result?.error || 'An unknown error occurred.');
      }
    } catch (error: any) {
      Alert.alert('Analysis Error', error.message || 'An unexpected error occurred.');
    }
  };

  const skipCurrentScan = () => {
    Alert.alert(
      'Skip Scan',
      `Are you sure you want to skip the ${currentScan} scan? This may reduce accuracy.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            const currentIndex = scanSequence.indexOf(currentScan);
            if (currentIndex < scanSequence.length - 1) {
              setCurrentScan(scanSequence[currentIndex + 1]);
            } else {
              navigation.navigate('Results', { sessionId: `session_${Date.now()}` });
            }
          },
        },
      ]
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Camera access is required for scanning. Please enable camera permissions in settings.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {scanSequence.map((scanType, index) => (
          <View
            key={scanType}
            style={[
              styles.progressDot,
              completedScans.includes(scanType) && styles.progressDotCompleted,
              currentScan === scanType && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionTitle}>
          Scan {completedScans.length + 1} of {scanSequence.length}
        </Text>
        <Text style={styles.instructionText}>
          {scanInstructions[currentScan]}
        </Text>
        <Text style={styles.instructionSubtext}>
          Keep the child in frame and hold steady for 5-10 seconds
        </Text>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={CameraType.back}
          flashMode={FlashMode.off}
        >
          {/* Overlay guides */}
          <View style={styles.overlay}>
            <View style={styles.frameGuide} />
          </View>
        </Camera>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={skipCurrentScan}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.recordButton,
            isProcessing && styles.recordButtonActive,
          ]}
          onPress={takePicture}
          disabled={isProcessing}
        >
          <View style={styles.recordButtonInner} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => {
            Alert.alert(
              'Scanning Tips',
              '• Ensure good lighting\n• Keep child still\n• Maintain 1-2 meter distance\n• Avoid complex backgrounds'
            );
          }}
        >
          <Text style={styles.helpButtonText}>?</Text>
        </TouchableOpacity>
      </View>

      {/* Safety Notice */}
      <View style={styles.safetyNotice}>
        <Text style={styles.safetyText}>
          🛡️ All scans are encrypted and processed according to privacy guidelines
        </Text>
      </View>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ddd',
    marginHorizontal: 5,
  },
  progressDotActive: {
    backgroundColor: '#2E8B57',
  },
  progressDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  instructionText: {
    fontSize: 16,
    color: '#2E8B57',
    textAlign: 'center',
    marginBottom: 5,
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameGuide: {
    width: width * 0.6,
    height: height * 0.4,
    borderWidth: 2,
    borderColor: '#2E8B57',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#2E8B57',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: {
    borderColor: '#ff4444',
  },
  recordButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2E8B57',
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
  },
  safetyNotice: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  safetyText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    padding: 20,
  },
});

export default ScanningScreen;
