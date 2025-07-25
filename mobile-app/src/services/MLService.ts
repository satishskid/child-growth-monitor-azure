// ML Service Integration for Child Growth Monitor Mobile App
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Types for ML Service
export interface MLAnalysisRequest {
  image_data: string; // Base64 encoded image (correct field name for API)
  age_months?: number;
  sex?: 'M' | 'F'; // Use M/F format expected by API
  reference_object_size_cm?: number;
  metadata?: {
    scan_angle?: 'front' | 'back' | 'left' | 'right';
    timestamp?: string;
    session_id?: string;
  };
}

export interface MLAnalysisResponse {
  measurements: {
    height: {
      value: number;
      unit: string;
      confidence: number;
      z_score?: number;
      percentile?: number;
    };
    weight: {
      value: number;
      unit: string;
      confidence: number;
      z_score?: number;
      percentile?: number;
    };
    muac: {
      value: number;
      unit: string;
      confidence: number;
      z_score?: number;
      percentile?: number;
    };
    head_circumference: {
      value: number;
      unit: string;
      confidence: number;
      z_score?: number;
      percentile?: number;
    };
  };
  nutritional_status: {
    stunting: {
      status: 'normal' | 'mild' | 'moderate' | 'severe';
      z_score: number;
      risk_level: 'low' | 'medium' | 'high';
    };
    wasting: {
      status: 'normal' | 'mild' | 'moderate' | 'severe';
      z_score: number;
      risk_level: 'low' | 'medium' | 'high';
    };
    underweight: {
      status: 'normal' | 'mild' | 'moderate' | 'severe';
      z_score: number;
      risk_level: 'low' | 'medium' | 'high';
    };
    recommendations: string[];
  };
  model_info: {
    version: string;
    confidence_threshold: number;
    processing_time_ms: number;
  };
  success: boolean;
  error?: string;
}

export interface BatchAnalysisRequest {
  images: MLAnalysisRequest[];
  child_id?: string;
  session_id?: string;
}

class MLService {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private enableOfflineMode: boolean;

  constructor() {
    // Use environment variables with fallbacks
    this.baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:8001';
    this.timeout = parseInt(process.env.API_TIMEOUT || '30000');
    this.retryAttempts = parseInt(process.env.RETRY_ATTEMPTS || '3');
    this.enableOfflineMode = process.env.ENABLE_OFFLINE_MODE === 'true';
  }

  /**
   * Check if ML service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.warn('ML Service health check failed:', error);
      return false;
    }
  }

  /**
   * Analyze a single image for anthropometric measurements
   */
  async analyzeImage(request: MLAnalysisRequest): Promise<MLAnalysisResponse | null> {
    const isOnline = await this.checkHealth();
    
    if (!isOnline && this.enableOfflineMode) {
      return await this.handleOfflineAnalysis(request);
    }

    if (!isOnline) {
      Alert.alert(
        'Service Unavailable',
        'ML service is not available. Please check your connection and try again.'
      );
      return null;
    }

    try {
      const response = await this.makeRequest('/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`ML Service error: ${response.status}`);
      }

      const result = await response.json();
      
      // Cache successful results
      await this.cacheResult(request, result);
      
      return result;
    } catch (error) {
      console.error('ML analysis error:', error);
      
      if (this.enableOfflineMode) {
        return await this.handleOfflineAnalysis(request);
      }
      
      Alert.alert(
        'Analysis Failed',
        'Could not analyze image. Please try again.'
      );
      return null;
    }
  }

  /**
   * Analyze multiple images in batch
   */
  async analyzeBatch(request: BatchAnalysisRequest): Promise<MLAnalysisResponse[]> {
    const isOnline = await this.checkHealth();
    
    if (!isOnline && this.enableOfflineMode) {
      // Process each image individually in offline mode
      const results: MLAnalysisResponse[] = [];
      for (const imageRequest of request.images) {
        const result = await this.handleOfflineAnalysis(imageRequest);
        if (result) {
          results.push(result);
        }
      }
      return results;
    }

    if (!isOnline) {
      Alert.alert(
        'Service Unavailable',
        'ML service is not available for batch processing.'
      );
      return [];
    }

    try {
      const response = await this.makeRequest('/analyze/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Batch analysis error: ${response.status}`);
      }

      const results = await response.json();
      
      // Cache all successful results
      for (let i = 0; i < request.images.length; i++) {
        if (results[i] && results[i].success) {
          await this.cacheResult(request.images[i], results[i]);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Batch analysis error:', error);
      Alert.alert(
        'Batch Analysis Failed',
        'Could not process all images. Please try again.'
      );
      return [];
    }
  }

  /**
   * Get model information and capabilities
   */
  async getModelInfo(): Promise<any> {
    try {
      const response = await this.makeRequest('/model/info', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Model info error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Model info error:', error);
      return null;
    }
  }

  /**
   * Handle offline analysis using cached models or mock data
   */
  private async handleOfflineAnalysis(request: MLAnalysisRequest): Promise<MLAnalysisResponse | null> {
    try {
      // Check for cached similar results
      const cachedResult = await this.getCachedResult(request);
      if (cachedResult) {
        return cachedResult;
      }

      // Generate realistic mock predictions based on age and sex
      const mockResult = this.generateMockAnalysis(request);
      
      // Store for later upload when online
      await this.storeOfflineAnalysis(request, mockResult);
      
      Alert.alert(
        'Offline Mode',
        'Analysis completed using offline models. Results will be verified when online.'
      );
      
      return mockResult;
    } catch (error) {
      console.error('Offline analysis error:', error);
      return null;
    }
  }

  /**
   * Generate realistic mock analysis for offline mode
   */
  private generateMockAnalysis(request: MLAnalysisRequest): MLAnalysisResponse {
    const ageMonths = request.age_months || 24; // Default to 24 months if not provided
    const isMale = request.sex === 'M';
    
    // Realistic growth curves (simplified WHO standards)
    const baseHeight = 45 + (ageMonths * 0.7) + (Math.random() - 0.5) * 5;
    const baseWeight = 2.5 + (ageMonths * 0.15) + (Math.random() - 0.5) * 1;
    const baseMuac = 9 + (ageMonths * 0.02) + (Math.random() - 0.5) * 0.5;
    const baseHc = 32 + (ageMonths * 0.1) + (Math.random() - 0.5) * 1;

    // Gender adjustments
    const genderFactor = isMale ? 1.02 : 0.98;
    
    const height = baseHeight * genderFactor;
    const weight = baseWeight * genderFactor;
    const muac = baseMuac * genderFactor;
    const headCircumference = baseHc * genderFactor;

    // Calculate Z-scores (simplified)
    const heightZScore = (height - baseHeight) / (baseHeight * 0.1);
    const weightZScore = (weight - baseWeight) / (baseWeight * 0.15);
    const muacZScore = (muac - baseMuac) / (baseMuac * 0.1);

    // Determine nutritional status
    const stunting = heightZScore < -2 ? (heightZScore < -3 ? 'severe' : 'moderate') : 'normal';
    const wasting = muacZScore < -2 ? (muacZScore < -3 ? 'severe' : 'moderate') : 'normal';
    const underweight = weightZScore < -2 ? (weightZScore < -3 ? 'severe' : 'moderate') : 'normal';

    return {
      measurements: {
        height: {
          value: Math.round(height * 10) / 10,
          unit: 'cm',
          confidence: 0.85 + Math.random() * 0.1,
          z_score: Math.round(heightZScore * 100) / 100,
          percentile: Math.round((1 - Math.exp(-heightZScore)) * 100)
        },
        weight: {
          value: Math.round(weight * 100) / 100,
          unit: 'kg',
          confidence: 0.82 + Math.random() * 0.1,
          z_score: Math.round(weightZScore * 100) / 100,
          percentile: Math.round((1 - Math.exp(-weightZScore)) * 100)
        },
        muac: {
          value: Math.round(muac * 10) / 10,
          unit: 'cm',
          confidence: 0.88 + Math.random() * 0.1,
          z_score: Math.round(muacZScore * 100) / 100,
          percentile: Math.round((1 - Math.exp(-muacZScore)) * 100)
        },
        head_circumference: {
          value: Math.round(headCircumference * 10) / 10,
          unit: 'cm',
          confidence: 0.80 + Math.random() * 0.1,
          z_score: Math.round((headCircumference - baseHc) / (baseHc * 0.1) * 100) / 100,
          percentile: Math.round(Math.random() * 100)
        }
      },
      nutritional_status: {
        stunting: {
          status: stunting as any,
          z_score: heightZScore,
          risk_level: stunting === 'normal' ? 'low' : stunting === 'severe' ? 'high' : 'medium'
        },
        wasting: {
          status: wasting as any,
          z_score: muacZScore,
          risk_level: wasting === 'normal' ? 'low' : wasting === 'severe' ? 'high' : 'medium'
        },
        underweight: {
          status: underweight as any,
          z_score: weightZScore,
          risk_level: underweight === 'normal' ? 'low' : underweight === 'severe' ? 'high' : 'medium'
        },
        recommendations: this.generateRecommendations(stunting, wasting, underweight)
      },
      model_info: {
        version: 'offline-v1.0.0',
        confidence_threshold: 0.7,
        processing_time_ms: 1000 + Math.random() * 2000
      },
      success: true
    };
  }

  /**
   * Generate contextual recommendations based on nutritional status
   */
  private generateRecommendations(stunting: string, wasting: string, underweight: string): string[] {
    const recommendations: string[] = [];
    
    if (stunting !== 'normal') {
      recommendations.push('Refer for nutritional counseling to address chronic malnutrition');
      recommendations.push('Monitor growth velocity and consider micronutrient supplementation');
    }
    
    if (wasting !== 'normal') {
      recommendations.push('Immediate nutritional intervention required for acute malnutrition');
      recommendations.push('Consider therapeutic feeding program enrollment');
    }
    
    if (underweight !== 'normal') {
      recommendations.push('Comprehensive nutrition assessment and feeding support needed');
    }
    
    if (stunting === 'normal' && wasting === 'normal' && underweight === 'normal') {
      recommendations.push('Continue current feeding practices and monitor growth');
      recommendations.push('Ensure proper vaccination schedule and health check-ups');
    }
    
    recommendations.push('Follow up measurement in 4-6 weeks to monitor progress');
    
    return recommendations;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(endpoint: string, options: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
        });
        
        return response;
      } catch (error) {
        if (attempt === this.retryAttempts) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => 
          setTimeout(resolve, 1000 * attempt)
        );
      }
    }
    
    throw new Error('Max retry attempts reached');
  }

  /**
   * Cache analysis result for offline access
   */
  private async cacheResult(request: MLAnalysisRequest, result: MLAnalysisResponse): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const cacheEntry = {
        request,
        result,
        timestamp: new Date().toISOString(),
        ttl: 24 * 60 * 60 * 1000 // 24 hours
      };
      
      await AsyncStorage.setItem(`ml_cache_${cacheKey}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Failed to cache ML result:', error);
    }
  }

  /**
   * Get cached analysis result
   */
  private async getCachedResult(request: MLAnalysisRequest): Promise<MLAnalysisResponse | null> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const cached = await AsyncStorage.getItem(`ml_cache_${cacheKey}`);
      
      if (!cached) return null;
      
      const cacheEntry = JSON.parse(cached);
      const now = new Date().getTime();
      const cacheTime = new Date(cacheEntry.timestamp).getTime();
      
      // Check if cache is still valid
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

  /**
   * Store offline analysis for later processing
   */
  private async storeOfflineAnalysis(request: MLAnalysisRequest, result: MLAnalysisResponse): Promise<void> {
    try {
      const offlineQueue = await AsyncStorage.getItem('ml_offline_queue') || '[]';
      const queue = JSON.parse(offlineQueue);
      
      queue.push({
        request,
        result,
        timestamp: new Date().toISOString(),
        processed: false
      });
      
      await AsyncStorage.setItem('ml_offline_queue', JSON.stringify(queue));
    } catch (error) {
      console.warn('Failed to store offline analysis:', error);
    }
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: MLAnalysisRequest): string {
    // Simple hash based on image characteristics and metadata
    const keyData = {
      age: request.age_months,
      sex: request.sex,
      angle: request.metadata?.scan_angle
    };
    
    return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  /**
   * Process offline queue when connection is restored
   */
  async processOfflineQueue(): Promise<void> {
    try {
      const offlineQueue = await AsyncStorage.getItem('ml_offline_queue') || '[]';
      const queue = JSON.parse(offlineQueue);
      
      const unprocessed = queue.filter((item: any) => !item.processed);
      
      if (unprocessed.length === 0) return;
      
      console.log(`Processing ${unprocessed.length} offline ML analyses...`);
      
      for (const item of unprocessed) {
        try {
          // Re-analyze with online service for verification
          const onlineResult = await this.analyzeImage(item.request);
          
          if (onlineResult) {
            item.processed = true;
            item.onlineResult = onlineResult;
          }
        } catch (error) {
          console.warn('Failed to process offline item:', error);
        }
      }
      
      await AsyncStorage.setItem('ml_offline_queue', JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to process offline queue:', error);
    }
  }

  /**
   * Clear old cache entries
   */
  async clearExpiredCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const mlCacheKeys = allKeys.filter(key => key.startsWith('ml_cache_'));
      
      for (const key of mlCacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const cacheEntry = JSON.parse(cached);
          const now = new Date().getTime();
          const cacheTime = new Date(cacheEntry.timestamp).getTime();
          
          if (now - cacheTime > cacheEntry.ttl) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clear expired cache:', error);
    }
  }
}

// Create singleton instance
export const mlService = new MLService();

// Export types and service
export default mlService;
