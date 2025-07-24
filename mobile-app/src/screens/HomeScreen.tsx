import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Child } from '@shared/types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      // TODO: Implement actual API call
      setIsLoading(false);
      // Mock data for now
      setChildren([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load children data');
      setIsLoading(false);
    }
  };

  const startNewScan = () => {
    Alert.alert(
      'New Scan',
      'To start a new scan, you need to first register a child and obtain parental consent.',
      [
        { text: 'Register Child', onPress: () => {
          // TODO: Navigate to child registration
          Alert.alert('Info', 'Child registration feature coming soon');
        }},
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const viewPreviousScans = () => {
    Alert.alert('Info', 'Previous scans feature coming soon');
  };

  const renderQuickAction = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.actionCard} onPress={item.onPress}>
      <Text style={styles.actionIcon}>{item.icon}</Text>
      <Text style={styles.actionTitle}>{item.title}</Text>
      <Text style={styles.actionDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  const quickActions = [
    {
      id: '1',
      icon: '📱',
      title: 'New Scan',
      description: 'Start a new child measurement scan',
      onPress: startNewScan,
    },
    {
      id: '2',
      icon: '📊',
      title: 'View Results',
      description: 'Review previous scan results',
      onPress: viewPreviousScans,
    },
    {
      id: '3',
      icon: '👶',
      title: 'Children',
      description: 'Manage child records',
      onPress: () => Alert.alert('Info', 'Child management feature coming soon'),
    },
    {
      id: '4',
      icon: '📋',
      title: 'Reports',
      description: 'Generate and export reports',
      onPress: () => Alert.alert('Info', 'Reports feature coming soon'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, Healthcare Worker</Text>
        <Text style={styles.missionText}>
          Together, we're working towards Zero Hunger by 2030
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Children Scanned</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <FlatList
          data={quickActions}
          renderItem={renderQuickAction}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.actionRow}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>🛡️ Privacy & Data Protection</Text>
        <Text style={styles.infoText}>
          All child data is encrypted and handled according to GDPR and healthcare 
          data protection standards. Parental consent is required for all scans.
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.emergencyButton}
        onPress={() => {
          Alert.alert(
            'Emergency Resources',
            'For immediate medical emergencies, contact local emergency services.\n\nFor malnutrition support: [Contact Information]'
          );
        }}
      >
        <Text style={styles.emergencyButtonText}>🚨 Emergency Resources</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 20,
    paddingVertical: 25,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  missionText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#ffffff',
    flex: 1,
    marginHorizontal: 5,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionRow: {
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#ffffff',
    width: '48%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  infoSection: {
    margin: 20,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2E8B57',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  emergencyButton: {
    backgroundColor: '#ff6b6b',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
