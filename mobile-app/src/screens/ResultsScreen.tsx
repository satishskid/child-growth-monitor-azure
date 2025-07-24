import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AnthropometricPredictions, NutritionalStatus, RootStackParamList, ScanSession } from '@shared/types';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Results'>;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

interface Props {
  navigation: ResultsScreenNavigationProp;
  route: ResultsScreenRouteProp;
}

const ResultsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const [scanSession, setScanSession] = useState<ScanSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Replace with actual API call
      // Simulate loading and processing
      setTimeout(() => {
        // Mock scan session data
        const mockSession: ScanSession = {
          id: sessionId,
          childId: 'demo-child-123',
          consentId: 'consent-123',
          scans: [],
          status: 'completed',
          startedAt: new Date(),
          completedAt: new Date(),
          predictions: generateMockPredictions(),
        };
        
        setScanSession(mockSession);
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to load scan results');
      setIsLoading(false);
    }
  };

  const generateMockPredictions = (): AnthropometricPredictions => {
    return {
      height: {
        value: 85.4,
        unit: 'cm',
        percentile: 45,
        zScore: -0.3,
        confidence: 0.92,
      },
      weight: {
        value: 12.8,
        unit: 'kg',
        percentile: 35,
        zScore: -0.8,
        confidence: 0.88,
      },
      armCircumference: {
        value: 14.2,
        unit: 'cm',
        percentile: 40,
        zScore: -0.5,
        confidence: 0.85,
      },
      headCircumference: {
        value: 47.8,
        unit: 'cm',
        percentile: 50,
        zScore: 0.1,
        confidence: 0.90,
      },
      nutritionalStatus: {
        stunting: {
          status: 'mild',
          zScore: -1.2,
        },
        wasting: {
          status: 'normal',
          zScore: -0.5,
        },
        underweight: {
          status: 'mild',
          zScore: -1.1,
        },
        overallRisk: 'medium',
        recommendations: [
          'Ensure adequate protein intake',
          'Monitor growth monthly',
          'Consider vitamin supplements',
          'Increase caloric density of meals',
        ],
      },
      confidence: 0.89,
      predictionDate: new Date(),
      modelVersion: 'CGM-v2.1.0',
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#4CAF50';
      case 'mild': return '#FF9800';
      case 'moderate': return '#FF5722';
      case 'severe': return '#F44336';
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#FF5722';
      case 'critical': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': case 'low': return '✓';
      case 'mild': case 'medium': return '⚠️';
      case 'moderate': case 'high': return '🔶';
      case 'severe': case 'critical': return '🔴';
      default: return '❓';
    }
  };

  const shareResults = async () => {
    if (!scanSession?.predictions) return;

    const { predictions } = scanSession;
    const reportText = `
Child Growth Monitor - Scan Results

Height: ${predictions.height.value} ${predictions.height.unit} (${predictions.height.percentile}th percentile)
Weight: ${predictions.weight.value} ${predictions.weight.unit} (${predictions.weight.percentile}th percentile)
Arm Circumference: ${predictions.armCircumference.value} ${predictions.armCircumference.unit}
Head Circumference: ${predictions.headCircumference.value} ${predictions.headCircumference.unit}

Nutritional Status:
- Overall Risk: ${predictions.nutritionalStatus.overallRisk}
- Stunting: ${predictions.nutritionalStatus.stunting.status}
- Wasting: ${predictions.nutritionalStatus.wasting.status}
- Underweight: ${predictions.nutritionalStatus.underweight.status}

Recommendations:
${predictions.nutritionalStatus.recommendations.map(rec => `• ${rec}`).join('\n')}

Scan Date: ${predictions.predictionDate.toLocaleDateString()}
Model Version: ${predictions.modelVersion}
`;

    try {
      await Share.share({
        message: reportText,
        title: 'Child Growth Monitor Results',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share results');
    }
  };

  const retakeScans = () => {
    Alert.alert(
      'Retake Scans',
      'This will discard current results and start a new scanning session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retake',
          style: 'destructive',
          onPress: () => navigation.navigate('Scanning', { 
            childId: scanSession?.childId || '', 
            consentId: scanSession?.consentId || '' 
          }),
        },
      ]
    );
  };

  const renderMeasurement = (title: string, measurement: any) => (
    <View style={styles.measurementCard} key={title}>
      <Text style={styles.measurementTitle}>{title}</Text>
      <View style={styles.measurementValue}>
        <Text style={styles.valueText}>
          {measurement.value} {measurement.unit}
        </Text>
        {measurement.percentile && (
          <Text style={styles.percentileText}>
            {measurement.percentile}th percentile
          </Text>
        )}
      </View>
      <View style={styles.confidenceBar}>
        <View 
          style={[
            styles.confidenceFill, 
            { width: `${measurement.confidence * 100}%` }
          ]} 
        />
      </View>
      <Text style={styles.confidenceText}>
        {Math.round(measurement.confidence * 100)}% confidence
      </Text>
    </View>
  );

  const renderNutritionalStatus = (status: NutritionalStatus) => (
    <View style={styles.statusSection}>
      <Text style={styles.sectionTitle}>🍎 Nutritional Assessment</Text>
      
      <View style={styles.statusGrid}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Stunting</Text>
          <View style={styles.statusValue}>
            <Text style={styles.statusIcon}>
              {getStatusIcon(status.stunting.status)}
            </Text>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(status.stunting.status) }
            ]}>
              {status.stunting.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.zScoreText}>
            Z-score: {status.stunting.zScore.toFixed(1)}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Wasting</Text>
          <View style={styles.statusValue}>
            <Text style={styles.statusIcon}>
              {getStatusIcon(status.wasting.status)}
            </Text>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(status.wasting.status) }
            ]}>
              {status.wasting.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.zScoreText}>
            Z-score: {status.wasting.zScore.toFixed(1)}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Underweight</Text>
          <View style={styles.statusValue}>
            <Text style={styles.statusIcon}>
              {getStatusIcon(status.underweight.status)}
            </Text>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(status.underweight.status) }
            ]}>
              {status.underweight.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.zScoreText}>
            Z-score: {status.underweight.zScore.toFixed(1)}
          </Text>
        </View>
      </View>

      <View style={[
        styles.overallRiskCard,
        { borderLeftColor: getStatusColor(status.overallRisk) }
      ]}>
        <Text style={styles.overallRiskLabel}>Overall Risk Level</Text>
        <Text style={[
          styles.overallRiskValue,
          { color: getStatusColor(status.overallRisk) }
        ]}>
          {getStatusIcon(status.overallRisk)} {status.overallRisk.toUpperCase()}
        </Text>
      </View>
    </View>
  );

  const renderRecommendations = (recommendations: string[]) => (
    <View style={styles.recommendationsSection}>
      <Text style={styles.sectionTitle}>💡 Recommendations</Text>
      {recommendations.map((recommendation, index) => (
        <View key={index} style={styles.recommendationItem}>
          <Text style={styles.recommendationBullet}>•</Text>
          <Text style={styles.recommendationText}>{recommendation}</Text>
        </View>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>Processing scan results...</Text>
          <Text style={styles.loadingSubtext}>
            Our AI is analyzing the measurements
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!scanSession?.predictions) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>No results available</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.retryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { predictions } = scanSession;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scan Results</Text>
          <Text style={styles.subtitle}>
            Analysis completed • {Math.round(predictions.confidence * 100)}% confidence
          </Text>
          <Text style={styles.scanDate}>
            {predictions.predictionDate.toLocaleDateString()}
          </Text>
        </View>

        {/* Measurements */}
        <View style={styles.measurementsSection}>
          <Text style={styles.sectionTitle}>📏 Anthropometric Measurements</Text>
          <View style={styles.measurementsGrid}>
            {renderMeasurement('Height', predictions.height)}
            {renderMeasurement('Weight', predictions.weight)}
            {renderMeasurement('Arm Circumference', predictions.armCircumference)}
            {renderMeasurement('Head Circumference', predictions.headCircumference)}
          </View>
        </View>

        {/* Nutritional Status */}
        {renderNutritionalStatus(predictions.nutritionalStatus)}

        {/* Recommendations */}
        {renderRecommendations(predictions.nutritionalStatus.recommendations)}

        {/* Model Info */}
        <View style={styles.modelInfoSection}>
          <Text style={styles.modelInfoTitle}>Technical Details</Text>
          <Text style={styles.modelInfoText}>
            Model Version: {predictions.modelVersion}
          </Text>
          <Text style={styles.modelInfoText}>
            Session ID: {sessionId}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={shareResults}
          >
            <Text style={styles.shareButtonText}>📤 Share Results</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.retakeButton}
            onPress={retakeScans}
          >
            <Text style={styles.retakeButtonText}>🔄 Retake Scans</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.homeButtonText}>🏠 Back to Home</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyText}>
            🛡️ All data is encrypted and handled according to privacy guidelines. 
            Results are stored locally and can be deleted at any time.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#2E8B57',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  scanDate: {
    fontSize: 14,
    color: '#999',
  },
  measurementsSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  measurementCard: {
    width: (width - 70) / 2,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  measurementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  measurementValue: {
    alignItems: 'center',
    marginBottom: 10,
  },
  valueText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  percentileText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 5,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#2E8B57',
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  statusSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  zScoreText: {
    fontSize: 11,
    color: '#666',
  },
  overallRiskCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  overallRiskLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  overallRiskValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  recommendationsSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  recommendationBullet: {
    fontSize: 16,
    color: '#2E8B57',
    marginRight: 10,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  modelInfoSection: {
    backgroundColor: '#f8f9fa',
    margin: 15,
    padding: 15,
    borderRadius: 8,
  },
  modelInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  modelInfoText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  actionsSection: {
    margin: 15,
    marginBottom: 30,
  },
  shareButton: {
    backgroundColor: '#2E8B57',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  retakeButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2E8B57',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  retakeButtonText: {
    color: '#2E8B57',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  homeButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 15,
    borderRadius: 8,
  },
  homeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  privacyNotice: {
    backgroundColor: '#e8f5e8',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  privacyText: {
    fontSize: 12,
    color: '#2E8B57',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default ResultsScreen;
