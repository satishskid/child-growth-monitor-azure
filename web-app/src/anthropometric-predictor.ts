// TypeScript implementation of the RealAnthropometricPredictor
// Based on the Python code in ml-service/models/anthropometric_predictor.py

import { Landmark, Keypoint } from './pose-estimator';

// --- Type Definitions ---

export interface PoseData {
  landmarks: Landmark[];
  keypoints: Keypoint[];
  quality_score?: number;
  scale_factor_cm_per_pixel?: number;
  confidence_score?: number;
  age_months?: number;
  sex?: 'M' | 'F';
}

export interface PredictionResult {
  height_cm: number;
  weight_kg: number;
  muac_cm: number;
  head_circumference_cm: number;
  nutritional_status: string;
  malnutrition_risk: string;
  confidence_score: number;
  measurement_confidence: { [key: string]: number };
  who_z_scores: { [key: string]: number };
  model_version: string;
  feature_count: number;
}

// --- Predictor Classes (fallback logic) ---

class HeightPredictor {
  predict(features: number[]): number[] {
    if (features.length > 40) {
      const heightPixels = features[40] || 150.0;
      const scaleFactor = features[features.length - 2] || 0.5;
      return [heightPixels * scaleFactor];
    }
    return [75.0];
  }
}

class WeightPredictor {
  predict(features: number[]): number[] {
    const height = (features.length > 40 ? features[40] * features[features.length - 2] : 75.0);
    let weight: number;
    if (height < 100) {
      weight = (height - 60) * 0.5 + 3.0;
    } else {
      weight = (height - 100) * 0.4 + 10.0;
    }
    return [Math.max(3.0, Math.min(80.0, weight))];
  }
}

class MUACPredictor {
  predict(features: number[]): number[] {
    const height = (features.length > 40 ? features[40] * features[features.length - 2] : 75.0);
    const muac = height * 0.18;
    return [Math.max(10.0, Math.min(25.0, muac))];
  }
}

class HeadCircumferencePredictor {
  predict(features: number[]): number[] {
    const height = (features.length > 40 ? features[40] * features[features.length - 2] : 75.0);
    const hc = height * 0.62;
    return [Math.max(40.0, Math.min(60.0, hc))];
  }
}


// --- Main Class ---

export class RealAnthropometricPredictor {
  private model_version = "3.0.0-ts-real";
  private is_loaded = false;
  private models: { [key: string]: any } = {};

  constructor() {
    this._create_basic_models();
    this.is_loaded = true;
    console.log(`Real anthropometric predictor initialized (v${this.model_version})`);
  }

  private _create_basic_models() {
    this.models = {
      'height': new HeightPredictor(),
      'weight': new WeightPredictor(),
      'muac': new MUACPredictor(),
      'head_circumference': new HeadCircumferencePredictor(),
    };
  }

  public predictMeasurements(poseData: PoseData): PredictionResult {
    if (!this.is_loaded) {
      throw new Error("Models not loaded");
    }

    const features = this._extractAnthropometricFeatures(poseData);

    if (!features || features.length === 0) {
      return this._getDefaultMeasurements();
    }

    const predictions: { [key: string]: number } = {};
    const confidence_scores: { [key: string]: number } = {};

    for (const measurement_type of ['height', 'weight', 'muac', 'head_circumference']) {
      try {
        const model = this.models[measurement_type];
        if (model) {
          const pred_value = model.predict(features)[0];
          predictions[measurement_type] = Math.max(0, pred_value);
          confidence_scores[measurement_type] = this._calculatePredictionConfidence(features, measurement_type);
        }
      } catch (e: any) {
        console.warn(`Error predicting ${measurement_type}: ${e.message}`);
        predictions[measurement_type] = this._getDefaultValue(measurement_type);
        confidence_scores[measurement_type] = 0.3;
      }
    }

    const nutritional_assessment = this._assessNutritionalStatus(predictions, poseData);

    const confidenceValues = Object.values(confidence_scores);
    const avgConfidence = confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length;

    return {
      height_cm: parseFloat(predictions['height']?.toFixed(1) || '75.0'),
      weight_kg: parseFloat(predictions['weight']?.toFixed(1) || '12.0'),
      muac_cm: parseFloat(predictions['muac']?.toFixed(1) || '14.5'),
      head_circumference_cm: parseFloat(predictions['head_circumference']?.toFixed(1) || '48.0'),
      nutritional_status: nutritional_assessment.status,
      malnutrition_risk: nutritional_assessment.risk_level,
      confidence_score: avgConfidence,
      measurement_confidence: confidence_scores,
      who_z_scores: nutritional_assessment.z_scores,
      model_version: this.model_version,
      feature_count: features.length,
    };
  }

  private _extractAnthropometricFeatures(poseData: PoseData): number[] {
    const landmarks = poseData.landmarks || [];
    const keypoints = poseData.keypoints || [];
    const posePoints = landmarks.length > 0 ? landmarks : keypoints;

    if (posePoints.length === 0) {
      return [];
    }

    let features: number[] = [];
    if (landmarks.length > 0) {
      features = this._extractFromLandmarks(landmarks as Landmark[]);
    } else {
      features = this._extractFromKeypoints(keypoints as Keypoint[]);
    }

    features.push(...this._calculateDerivedFeatures(posePoints, poseData));
    return features;
  }

  private _extractFromLandmarks(landmarks: Landmark[]): number[] {
    const features: number[] = [];
    const keyLandmarkNames = ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_ankle', 'right_ankle', 'left_wrist', 'right_wrist'];
    const landmarkDict = new Map(landmarks.map(lm => [lm.name, lm]));

    for (const name of keyLandmarkNames) {
      const lm = landmarkDict.get(name);
      features.push(lm?.x || 0, lm?.y || 0, lm?.z || 0, lm?.visibility || 0);
    }

    const nose = landmarkDict.get('nose');
    const ankle = landmarkDict.get('left_ankle');
    if (nose && ankle) {
      const heightProxy = Math.sqrt((nose.x - ankle.x) ** 2 + (nose.y - ankle.y) ** 2);
      features.push(heightProxy);
    }
    return features;
  }

  private _extractFromKeypoints(keypoints: Keypoint[]): number[] {
    const features: number[] = [];
    for (let i = 0; i < 17; i++) {
      const kp = keypoints[i];
      features.push(kp?.x || 0, kp?.y || 0, kp?.z || 0);
    }

    if (keypoints.length > 16) {
      const headKp = keypoints[0];
      const footKp = keypoints[16];
      if (headKp && footKp) {
        const heightProxy = Math.sqrt((headKp.x - footKp.x) ** 2 + (headKp.y - footKp.y) ** 2);
        features.push(heightProxy);
      }
    }
    return features;
  }

  private _calculateDerivedFeatures(posePoints: (Landmark | Keypoint)[], poseData: PoseData): number[] {
    const derivedFeatures: number[] = [];
    derivedFeatures.push(poseData.quality_score || 0.5);
    derivedFeatures.push(poseData.scale_factor_cm_per_pixel || 0.5);
    derivedFeatures.push(poseData.confidence_score || 0.5);
    derivedFeatures.push(this._estimateAgeFromPose(posePoints));
    return derivedFeatures;
  }

  private _estimateAgeFromPose(posePoints: (Landmark | Keypoint)[]): number {
    return 3.0; // Simplified
  }

  private _assessNutritionalStatus(predictions: { [key: string]: number }, poseData: PoseData) {
    const heightCm = predictions['height'] || 75.0;
    const weightKg = predictions['weight'] || 12.0;
    const muacCm = predictions['muac'] || 14.5;
    const ageMonths = poseData.age_months || 36;

    const zScores = this._calculateWhoZScores(heightCm, weightKg, muacCm, ageMonths);

    let status = "normal";
    let risk_level = "low";

    if (zScores['wfh'] < -3 || zScores['muac'] < -3) {
      status = "severely_malnourished";
      risk_level = "high";
    } else if (zScores['wfh'] < -2 || zScores['muac'] < -2) {
      status = "moderately_malnourished";
      risk_level = "medium";
    } else if (zScores['hfa'] < -2) {
      status = "stunted";
      risk_level = "medium";
    } else if (zScores['wfh'] > 2) {
      status = "overweight";
      risk_level = "low";
    }

    return {
      status,
      risk_level,
      z_scores: zScores,
      assessment_confidence: 0.85,
    };
  }

  private _calculateWhoZScores(heightCm: number, weightKg: number, muacCm: number, ageMonths: number): { [key: string]: number } {
    const refHeight = 92.0;
    const refWeight = 13.5;
    const refMuac = 15.5;
    const sdHeight = 3.5;
    const sdWeight = 1.8;
    const sdMuac = 1.2;

    return {
      hfa: (heightCm - refHeight) / sdHeight,
      wfh: (weightKg - (refWeight * heightCm / refHeight)) / sdWeight,
      muac: (muacCm - refMuac) / sdMuac,
      wfa: (weightKg - refWeight) / sdWeight,
    };
  }

  private _calculatePredictionConfidence(features: number[], measurementType: string): number {
    const featureQuality = Math.min(1.0, features.length / 50.0);
    const adjustments: { [key: string]: number } = {
      'height': 0.9,
      'weight': 0.7,
      'muac': 0.6,
      'head_circumference': 0.75
    };
    const baseConfidence = adjustments[measurementType] || 0.7;
    return Math.min(0.95, featureQuality * baseConfidence);
  }

  private _getDefaultMeasurements(): PredictionResult {
    return {
      height_cm: 75.0,
      weight_kg: 12.0,
      muac_cm: 14.5,
      head_circumference_cm: 48.0,
      nutritional_status: 'unknown',
      malnutrition_risk: 'medium',
      confidence_score: 0.3,
      measurement_confidence: {},
      who_z_scores: {},
      model_version: this.model_version,
      feature_count: 0
    };
  }

  private _getDefaultValue(measurementType: string): number {
    const defaults: { [key: string]: number } = {
      'height': 75.0,
      'weight': 12.0,
      'muac': 14.5,
      'head_circumference': 48.0,
    };
    return defaults[measurementType] || 0.0;
  }
}
