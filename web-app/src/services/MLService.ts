// New ML Service implementation that runs on the client-side

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { RealPoseEstimator } from '../pose-estimator';
import { RealAnthropometricPredictor, PoseData, PredictionResult } from '../anthropometric-predictor';

// --- Type Definitions (re-exporting from original for compatibility) ---

export interface MLAnalysisRequest {
  image_data: string; // Base64 encoded image
  age_months?: number;
  sex?: 'M' | 'F';
  reference_object_size_cm?: number;
  metadata?: {
    scan_angle?: 'front' | 'back' | 'left' | 'right';
    timestamp?: string;
    session_id?: string;
  };
}

export interface MLAnalysisResponse {
  success: boolean;
  measurements: {
    height: { value: number; unit: string; confidence: number; };
    weight: { value: number; unit: string; confidence: number; };
    muac: { value: number; unit: string; confidence: number; };
    head_circumference: { value: number; unit: string; confidence: number; };
  };
  nutritional_status: any; // Simplified for now
  model_info: {
    version: string;
    confidence_threshold: number;
    processing_time_ms: number;
  };
  error?: string;
}


// --- Client-side ML Service ---

class ClientMLService {
  private poseEstimator: RealPoseEstimator;
  private anthropometricPredictor: RealAnthropometricPredictor;

  constructor() {
    this.poseEstimator = new RealPoseEstimator();
    this.anthropometricPredictor = new RealAnthropometricPredictor();
  }

  public async analyzeImage(request: MLAnalysisRequest): Promise<MLAnalysisResponse | null> {
    const startTime = Date.now();
    try {
      const cachedResult = await this.getCachedResult(request);
      if (cachedResult) {
        return cachedResult;
      }

      const image = await this.getImageFromBase64(request.image_data);
      const poseResult = this.poseEstimator.estimatePose(image);

      if (!poseResult.success) {
        throw new Error(poseResult.error || 'Pose estimation failed');
      }

      const poseData: PoseData = {
        ...poseResult,
        age_months: request.age_months,
        sex: request.sex,
      };

      const predictionResult = this.anthropometricPredictor.predictMeasurements(poseData);
      const processingTime = Date.now() - startTime;
      const response = this.formatResponse(predictionResult, processingTime);

      await this.cacheResult(request, response);
      return response;

    } catch (error: any) {
      console.error('Client-side ML analysis error:', error);
      Alert.alert('Analysis Failed', error.message || 'Could not analyze image.');
      return null;
    }
  }

  private async getImageFromBase64(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = base64.startsWith('data:image') ? base64 : `data:image/jpeg;base64,${base64}`;
    });
  }

  private formatResponse(
    prediction: PredictionResult,
    processing_time_ms: number
  ): MLAnalysisResponse {
    return {
      success: true,
      measurements: {
        height: { value: prediction.height_cm, unit: 'cm', confidence: prediction.measurement_confidence?.height || 0 },
        weight: { value: prediction.weight_kg, unit: 'kg', confidence: prediction.measurement_confidence?.weight || 0 },
        muac: { value: prediction.muac_cm, unit: 'cm', confidence: prediction.measurement_confidence?.muac || 0 },
        head_circumference: { value: prediction.head_circumference_cm, unit: 'cm', confidence: prediction.measurement_confidence?.head_circumference || 0 },
      },
      nutritional_status: { // Replicating original structure
        stunting: { status: 'normal', z_score: prediction.who_z_scores?.hfa || 0, risk_level: 'low' },
        wasting: { status: 'normal', z_score: prediction.who_z_scores?.wfh || 0, risk_level: 'low' },
        underweight: { status: 'normal', z_score: prediction.who_z_scores?.wfa || 0, risk_level: 'low' },
        recommendations: [],
      },
      model_info: {
        version: prediction.model_version,
        confidence_threshold: 0.5,
        processing_time_ms,
      },
    };
  }

  // --- Caching Logic ---

  private async cacheResult(request: MLAnalysisRequest, result: MLAnalysisResponse): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const cacheEntry = {
        request,
        result,
        timestamp: new Date().toISOString(),
        ttl: 24 * 60 * 60 * 1000, // 24 hours
      };
      await AsyncStorage.setItem(`ml_cache_${cacheKey}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Failed to cache ML result:', error);
    }
  }

  private async getCachedResult(request: MLAnalysisRequest): Promise<MLAnalysisResponse | null> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const cached = await AsyncStorage.getItem(`ml_cache_${cacheKey}`);
      if (!cached) return null;
      const cacheEntry = JSON.parse(cached);
      const now = new Date().getTime();
      const cacheTime = new Date(cacheEntry.timestamp).getTime();
      if (now - cacheTime > cacheEntry.ttl) {
        await AsyncStorage.removeItem(`ml_cache_${cacheKey}`);
        return null;
      }
      return cacheEntry.result;
    } catch (error) {
      console.warn('Failed to get cached ML result:', error);
      return null;
    }
  }

  private generateCacheKey(request: MLAnalysisRequest): string {
    const keyData = {
      age: request.age_months,
      sex: request.sex,
      angle: request.metadata?.scan_angle,
      image_size: request.image_data.length,
    };
    const stringToHash = JSON.stringify(keyData);
    let hash = 0;
    for (let i = 0; i < stringToHash.length; i++) {
        const char = stringToHash.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return 'key_' + Math.abs(hash);
  }
}

export const mlService = new ClientMLService();
export default mlService;
