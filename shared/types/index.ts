// Core data types for Child Growth Monitor application

export interface Child {
  id: string;
  name: string;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  guardianName: string;
  guardianContact: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Consent {
  id: string;
  childId: string;
  guardianSignature: string; // Base64 encoded signature
  qrCode: string; // QR code data for verification
  consentGiven: boolean;
  dataUsageAgreed: boolean;
  privacyPolicyAccepted: boolean;
  consentDate: Date;
  expiryDate?: Date;
  withdrawnAt?: Date;
}

export interface ScanData {
  id: string;
  childId: string;
  consentId: string;
  scanType: 'front' | 'back' | 'side_left' | 'side_right';
  videoPath: string; // Local file path or cloud URL
  depthMapPath?: string;
  rgbImagePaths: string[];
  metadata: {
    deviceInfo: DeviceInfo;
    scanSettings: ScanSettings;
    environmentalConditions: EnvironmentalConditions;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  uploadedAt?: Date;
}

export interface ScanSession {
  id: string;
  childId: string;
  consentId: string;
  scans: ScanData[];
  status: 'in_progress' | 'completed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  predictions?: AnthropometricPredictions;
}

export interface AnthropometricPredictions {
  height: Measurement;
  weight: Measurement;
  armCircumference: Measurement;
  headCircumference: Measurement;
  nutritionalStatus: NutritionalStatus;
  confidence: number; // 0-1 confidence score
  predictionDate: Date;
  modelVersion: string;
}

export interface Measurement {
  value: number;
  unit: string;
  percentile?: number;
  zScore?: number;
  confidence: number;
}

export interface NutritionalStatus {
  stunting: {
    status: 'normal' | 'mild' | 'moderate' | 'severe';
    zScore: number;
  };
  wasting: {
    status: 'normal' | 'mild' | 'moderate' | 'severe';
    zScore: number;
  };
  underweight: {
    status: 'normal' | 'mild' | 'moderate' | 'severe';
    zScore: number;
  };
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface DeviceInfo {
  platform: string;
  osVersion: string;
  deviceModel: string;
  appVersion: string;
  hasDepthSensor: boolean;
  cameraSpecs: {
    resolution: string;
    hasFlash: boolean;
    hasAutofocus: boolean;
  };
}

export interface ScanSettings {
  videoQuality: 'low' | 'medium' | 'high';
  frameRate: number;
  enableDepthMapping: boolean;
  compressionLevel: number;
  autoExposure: boolean;
}

export interface EnvironmentalConditions {
  lightingLevel: 'low' | 'medium' | 'high';
  backgroundComplexity: 'simple' | 'medium' | 'complex';
  estimatedDistance: number; // in centimeters
  timestamp: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'healthcare_worker' | 'administrator' | 'volunteer';
  organization?: string;
  permissions: string[];
  lastLogin: Date;
}

// Navigation types
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Home: undefined;
  Consent: { childId?: string };
  Scanning: { childId: string; consentId: string };
  Results: { sessionId: string };
};

// Form types
export interface ChildFormData {
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  guardianName: string;
  guardianContact: string;
}

export interface ConsentFormData {
  guardianSignature: string;
  dataUsageAgreed: boolean;
  privacyPolicyAccepted: boolean;
  qrCodeScanned: boolean;
}
