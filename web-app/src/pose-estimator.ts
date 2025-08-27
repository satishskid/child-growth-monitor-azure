// TypeScript implementation of the RealPoseEstimator
// Based on the Python code in ml-service/models/pose_estimator.py

// --- Type Definitions ---

export interface Keypoint {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface Landmark {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  visibility: number;
  presence: number;
}

export interface AnthropometricMeasurements {
  height_cm?: number;
  arm_span_cm?: number;
  muac_cm?: number;
  weight_kg?: number;
  error?: string;
}

export interface PoseEstimationResult {
  success: boolean;
  landmarks: Landmark[];
  measurements: AnthropometricMeasurements;
  scale_factor_cm_per_pixel: number;
  confidence_score: number;
  pose_quality: string;
  keypoints: Keypoint[];
  pose_present: boolean;
  quality_score: number;
  error?: string;
}

// --- Class Definition ---

export class RealPoseEstimator {
  private isLoaded = false;
  private keypointNames: string[] = [
    'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
    'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
  ];

  constructor() {
    this.isLoaded = true;
    console.log('Real TypeScript pose estimator initialized');
  }

  public estimatePose(
    image: any, // This will be an HTMLImageElement or similar
    referenceObjectSizeCm?: number,
  ): PoseEstimationResult {
    try {
      // TODO: Implement body keypoint detection using opencv.js
      // For now, we'll use mock keypoints
      const keypoints = this._detectBodyKeypoints(image);

      if (!keypoints || keypoints.length === 0) {
        return {
          success: false,
          error: 'No human pose detected in image',
          landmarks: [],
          measurements: {},
          keypoints: [],
          pose_present: false,
          scale_factor_cm_per_pixel: 0,
          confidence_score: 0,
          pose_quality: 'unknown',
          quality_score: 0,
        };
      }

      const landmarks = this._keypointsToLandmarks(keypoints);
      const scaleFactor = this._calculateScaleFactor(landmarks, referenceObjectSizeCm);
      const measurements = this._calculateAnthropometricMeasurements(landmarks, scaleFactor);

      const confidence = this._calculateOverallConfidence(keypoints);
      return {
        success: true,
        landmarks,
        measurements,
        scale_factor_cm_per_pixel: scaleFactor,
        confidence_score: confidence,
        pose_quality: this._assessPoseQuality(landmarks),
        keypoints,
        pose_present: true,
        quality_score: confidence,
      };
    } catch (e: any) {
      return {
        success: false,
        error: `Pose estimation failed: ${e.message}`,
        landmarks: [],
        measurements: {},
        keypoints: [],
        pose_present: false,
        scale_factor_cm_per_pixel: 0,
        confidence_score: 0,
        pose_quality: 'unknown',
        quality_score: 0,
      };
    }
  }

  private _detectBodyKeypoints(image: any): Keypoint[] {
    // This is where the opencv.js logic will go.
    // For now, we will return default keypoints.
    const { width, height } = image;
    return this._generateDefaultKeypoints(width, height);
  }

  private _estimateKeypointsFromBodyRect(
    x: number, y: number, w: number, h: number,
    imgWidth: number, imgHeight: number,
  ): Keypoint[] {
    const headRatio = 0.13;
    const shoulderRatio = 0.25;
    const elbowRatio = 0.45;
    const wristRatio = 0.65;
    const hipRatio = 0.55;
    const kneeRatio = 0.78;
    const ankleRatio = 0.95;

    const centerX = x + w / 2;

    const positions: [number, number, number, number][] = [
      [centerX, y + h * headRatio, 0.0, 0.9], // nose
      [centerX - w * 0.08, y + h * headRatio - h * 0.02, 0.0, 0.8], // left_eye
      [centerX + w * 0.08, y + h * headRatio - h * 0.02, 0.0, 0.8], // right_eye
      [centerX - w * 0.12, y + h * headRatio, 0.0, 0.7], // left_ear
      [centerX + w * 0.12, y + h * headRatio, 0.0, 0.7], // right_ear
      [centerX - w * 0.35, y + h * shoulderRatio, 0.0, 0.9], // left_shoulder
      [centerX + w * 0.35, y + h * shoulderRatio, 0.0, 0.9], // right_shoulder
      [centerX - w * 0.25, y + h * elbowRatio, 0.0, 0.8], // left_elbow
      [centerX + w * 0.25, y + h * elbowRatio, 0.0, 0.8], // right_elbow
      [centerX - w * 0.20, y + h * wristRatio, 0.0, 0.7], // left_wrist
      [centerX + w * 0.20, y + h * wristRatio, 0.0, 0.7], // right_wrist
      [centerX - w * 0.15, y + h * hipRatio, 0.0, 0.9], // left_hip
      [centerX + w * 0.15, y + h * hipRatio, 0.0, 0.9], // right_hip
      [centerX - w * 0.12, y + h * kneeRatio, 0.0, 0.8], // left_knee
      [centerX + w * 0.12, y + h * kneeRatio, 0.0, 0.8], // right_knee
      [centerX - w * 0.10, y + h * ankleRatio, 0.0, 0.8], // left_ankle
      [centerX + w * 0.10, y + h * ankleRatio, 0.0, 0.8], // right_ankle
    ];

    return positions.map(([px, py, pz, v]) => ({ x: px, y: py, z: pz, visibility: v }));
  }

  private _generateDefaultKeypoints(width: number, height: number): Keypoint[] {
    const centerX = width / 2;
    const positions: [number, number, number, number][] = [
      [centerX, height * 0.15, 0.0, 0.5],      // nose
      [centerX - 20, height * 0.12, 0.0, 0.4], // left_eye
      [centerX + 20, height * 0.12, 0.0, 0.4], // right_eye
      [centerX - 30, height * 0.15, 0.0, 0.3], // left_ear
      [centerX + 30, height * 0.15, 0.0, 0.3], // right_ear
      [centerX - 60, height * 0.25, 0.0, 0.6], // left_shoulder
      [centerX + 60, height * 0.25, 0.0, 0.6], // right_shoulder
      [centerX - 45, height * 0.45, 0.0, 0.5], // left_elbow
      [centerX + 45, height * 0.45, 0.0, 0.5], // right_elbow
      [centerX - 35, height * 0.65, 0.0, 0.4], // left_wrist
      [centerX + 35, height * 0.65, 0.0, 0.4], // right_wrist
      [centerX - 25, height * 0.55, 0.0, 0.6], // left_hip
      [centerX + 25, height * 0.55, 0.0, 0.6], // right_hip
      [centerX - 20, height * 0.78, 0.0, 0.5], // left_knee
      [centerX + 20, height * 0.78, 0.0, 0.5], // right_knee
      [centerX - 15, height * 0.95, 0.0, 0.5], // left_ankle
      [centerX + 15, height * 0.95, 0.0, 0.5], // right_ankle
    ];
    return positions.map(([px, py, pz, v]) => ({ x: px, y: py, z: pz, visibility: v }));
  }

  private _keypointsToLandmarks(keypoints: Keypoint[]): Landmark[] {
    return keypoints.map((keypoint, idx) => ({
      id: idx,
      name: this.keypointNames[idx] || `keypoint_${idx}`,
      ...keypoint,
      presence: 1.0,
    }));
  }

  private _calculateScaleFactor(landmarks: Landmark[], referenceSizeCm?: number): number {
    if (referenceSizeCm) {
      // TODO: Implement logic to use reference object
      return 1.0;
    }
    try {
      const nose = landmarks.find(lm => lm.name === 'nose');
      const leftEar = landmarks.find(lm => lm.name === 'left_ear');
      if (nose && leftEar) {
        const headWidthPixels = Math.abs(leftEar.x - nose.x) * 2;
        const estimatedHeadWidthCm = 15.0;
        if (headWidthPixels > 0) {
          return estimatedHeadWidthCm / headWidthPixels;
        }
      }
    } catch (e) {
      // ignore
    }
    return 0.4; // Default scale factor
  }

  private _calculateAnthropometricMeasurements(
    landmarks: Landmark[],
    scaleFactor: number,
  ): AnthropometricMeasurements {
    const measurements: AnthropometricMeasurements = {};
    try {
      const landmarkDict = new Map(landmarks.map(lm => [lm.name, lm]));
      const heightPixels = this._calculateHeightPixels(landmarkDict);
      measurements.height_cm = heightPixels * scaleFactor;
      measurements.arm_span_cm = this._calculateArmSpanPixels(landmarkDict) * scaleFactor;
      measurements.muac_cm = this._estimateMuac(landmarkDict, scaleFactor);
      measurements.weight_kg = this._estimateWeightFromMeasurements(measurements);
    } catch (e: any) {
      measurements.error = e.message;
    }
    return measurements;
  }

  private _calculateHeightPixels(landmarks: Map<string, Landmark>): number {
    const nose = landmarks.get('nose');
    const leftAnkle = landmarks.get('left_ankle');
    const rightAnkle = landmarks.get('right_ankle');
    if (nose && (leftAnkle || rightAnkle)) {
      const footY = Math.max(leftAnkle?.y || 0, rightAnkle?.y || 0);
      return Math.abs(footY - nose.y);
    }
    return 0;
  }

  private _calculateArmSpanPixels(landmarks: Map<string, Landmark>): number {
    const leftWrist = landmarks.get('left_wrist');
    const rightWrist = landmarks.get('right_wrist');
    if (leftWrist && rightWrist) {
      const dx = leftWrist.x - rightWrist.x;
      const dy = leftWrist.y - rightWrist.y;
      return Math.sqrt(dx ** 2 + dy ** 2);
    }
    return 0;
  }

  private _estimateMuac(landmarks: Map<string, Landmark>, scaleFactor: number): number {
    const leftShoulder = landmarks.get('left_shoulder');
    const leftElbow = landmarks.get('left_elbow');
    if (leftShoulder && leftElbow) {
      const armLengthPixels = Math.sqrt(
        (leftShoulder.x - leftElbow.x) ** 2 + (leftShoulder.y - leftElbow.y) ** 2,
      );
      const armLengthCm = armLengthPixels * scaleFactor;
      const estimatedMuac = armLengthCm * 0.6;
      return Math.max(10.0, Math.min(25.0, estimatedMuac));
    }
    return 14.5; // Default value
  }

  private _estimateWeightFromMeasurements(measurements: AnthropometricMeasurements): number {
    const heightCm = measurements.height_cm || 0;
    if (heightCm > 50) {
      let weight: number;
      if (heightCm < 100) {
        weight = (heightCm - 60) * 0.5 + 3.0;
      } else {
        weight = (heightCm - 100) * 0.4 + 10.0;
      }
      return Math.max(3.0, Math.min(80.0, weight));
    }
    return 12.0; // Default value
  }

  private _calculateOverallConfidence(keypoints: Keypoint[]): number {
    if (!keypoints || keypoints.length === 0) {
      return 0.0;
    }
    const confidences = keypoints.map(kp => kp.visibility);
    return confidences.reduce((acc, val) => acc + val, 0) / confidences.length;
  }

  private _assessPoseQuality(landmarks: Landmark[]): string {
    try {
      const keyLandmarks = ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_ankle', 'right_ankle'];
      let visibleCount = 0;
      let totalVisibility = 0.0;
      for (const landmark of landmarks) {
        if (keyLandmarks.includes(landmark.name)) {
          if (landmark.visibility > 0.7) {
            visibleCount++;
          }
          totalVisibility += landmark.visibility;
        }
      }
      const avgVisibility = totalVisibility / keyLandmarks.length;
      if (visibleCount >= 6 && avgVisibility > 0.8) {
        return 'excellent';
      } else if (visibleCount >= 4 && avgVisibility > 0.6) {
        return 'good';
      } else if (visibleCount >= 3 && avgVisibility > 0.4) {
        return 'fair';
      } else {
        return 'poor';
      }
    } catch (e) {
      return 'unknown';
    }
  }
}
