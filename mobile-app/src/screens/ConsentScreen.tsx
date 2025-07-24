import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@shared/types';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type ConsentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Consent'>;
type ConsentScreenRouteProp = RouteProp<RootStackParamList, 'Consent'>;

interface Props {
  navigation: ConsentScreenNavigationProp;
  route: ConsentScreenRouteProp;
}

const ConsentScreen: React.FC<Props> = ({ navigation, route }) => {
  const [dataUsageAgreed, setDataUsageAgreed] = useState(false);
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
  const [qrCodeScanned, setQrCodeScanned] = useState(false);

  const handleConsentSubmit = () => {
    if (!dataUsageAgreed || !privacyPolicyAccepted || !qrCodeScanned) {
      Alert.alert(
        'Incomplete Consent',
        'All consent requirements must be completed before proceeding.'
      );
      return;
    }

    // Mock child ID for demonstration
    const childId = 'demo-child-123';
    const consentId = `consent-${Date.now()}`;

    Alert.alert(
      'Consent Recorded',
      'Parental consent has been successfully recorded. You may now proceed with scanning.',
      [
        {
          text: 'Start Scanning',
          onPress: () => navigation.navigate('Scanning', { childId, consentId }),
        },
      ]
    );
  };

  const scanQRCode = () => {
    // Mock QR code scanning
    Alert.alert(
      'QR Code Scan',
      'In a real implementation, this would open the camera to scan the QR code on the consent form.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate Scan',
          onPress: () => {
            setQrCodeScanned(true);
            Alert.alert('Success', 'QR code verification completed.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Parental Consent & Privacy</Text>
          <Text style={styles.subtitle}>
            Protecting children's data is our highest priority
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Consent Requirements</Text>
          <Text style={styles.sectionText}>
            Before proceeding with any child scan, we must obtain proper parental 
            consent and ensure all privacy requirements are met.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Data Usage Agreement</Text>
          <Text style={styles.sectionText}>
            • Child data will be used only for malnutrition assessment{'\n'}
            • All data is encrypted and stored securely{'\n'}
            • Data will be anonymized for research purposes{'\n'}
            • Parents can request data deletion at any time{'\n'}
            • Data is retained for maximum 7 years as per medical standards
          </Text>
          
          <TouchableOpacity
            style={[
              styles.checkboxContainer,
              dataUsageAgreed && styles.checkboxChecked,
            ]}
            onPress={() => setDataUsageAgreed(!dataUsageAgreed)}
          >
            <Text style={styles.checkboxText}>
              {dataUsageAgreed ? '✓' : '○'} Parent/Guardian agrees to data usage
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ Privacy Policy</Text>
          <Text style={styles.sectionText}>
            Our privacy policy ensures:{'\n'}
            • GDPR compliance for all child data{'\n'}
            • Healthcare-grade security standards{'\n'}
            • No data sharing without explicit consent{'\n'}
            • Transparent data processing practices
          </Text>
          
          <TouchableOpacity
            style={[
              styles.checkboxContainer,
              privacyPolicyAccepted && styles.checkboxChecked,
            ]}
            onPress={() => setPrivacyPolicyAccepted(!privacyPolicyAccepted)}
          >
            <Text style={styles.checkboxText}>
              {privacyPolicyAccepted ? '✓' : '○'} Privacy policy acknowledged
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 QR Code Verification</Text>
          <Text style={styles.sectionText}>
            Scan the QR code on the signed consent form to verify the document 
            and link it to this digital record.
          </Text>
          
          <TouchableOpacity
            style={[
              styles.qrButton,
              qrCodeScanned && styles.qrButtonScanned,
            ]}
            onPress={scanQRCode}
          >
            <Text style={styles.qrButtonText}>
              {qrCodeScanned ? '✓ QR Code Verified' : '📷 Scan QR Code'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.warningSection}>
          <Text style={styles.warningTitle}>⚠️ Important Notice</Text>
          <Text style={styles.warningText}>
            This application handles sensitive child health data. All team members 
            must follow ethical guidelines and data protection regulations. 
            Unauthorized use or sharing of child data is strictly prohibited.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.proceedButton,
            (!dataUsageAgreed || !privacyPolicyAccepted || !qrCodeScanned) &&
              styles.proceedButtonDisabled,
          ]}
          onPress={handleConsentSubmit}
          disabled={!dataUsageAgreed || !privacyPolicyAccepted || !qrCodeScanned}
        >
          <Text style={styles.proceedButtonText}>
            Proceed to Scanning
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 25,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  checkboxContainer: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  checkboxChecked: {
    backgroundColor: '#e8f5e8',
    borderColor: '#2E8B57',
  },
  checkboxText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  qrButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  qrButtonScanned: {
    backgroundColor: '#e8f5e8',
    borderColor: '#2E8B57',
  },
  qrButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  warningSection: {
    backgroundColor: '#fff3cd',
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  proceedButton: {
    backgroundColor: '#2E8B57',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  proceedButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  proceedButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ConsentScreen;
