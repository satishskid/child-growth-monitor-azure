import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BatchUploadService, { BatchChild, BatchUploadResult } from '../services/BatchUploadService';
import { colors } from '../styles/colors';
// Typography styles will be defined inline

interface BatchUploadScreenProps {
  navigation: any;
}

const BatchUploadScreen: React.FC<BatchUploadScreenProps> = ({ navigation }) => {
  const [children, setChildren] = useState<BatchChild[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChildren, setFilteredChildren] = useState<BatchChild[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<BatchChild | null>(null);
  const [statistics, setStatistics] = useState({
    totalChildren: 0,
    totalMeasurements: 0,
    childrenWithMeasurements: 0,
    averageMeasurementsPerChild: 0
  });

  useEffect(() => {
    loadChildren();
    loadStatistics();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChildren(children);
    } else {
      const filtered = children.filter(child =>
        child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.uniqueId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.guardianName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChildren(filtered);
    }
  }, [searchQuery, children]);

  const loadChildren = async () => {
    try {
      const data = await BatchUploadService.getAllBatchChildren();
      setChildren(data);
    } catch (error) {
      console.error('Failed to load children:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await BatchUploadService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleFileUpload = () => {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.multiple = false;

    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      setLoading(true);
      try {
        const result: BatchUploadResult = await BatchUploadService.importFromFile(file);
        
        if (result.success) {
          Alert.alert(
            'Upload Successful',
            `Imported ${result.imported} children successfully.${result.errors.length > 0 ? `\n\nWarnings:\n${result.errors.join('\n')}` : ''}`,
            [{ text: 'OK', onPress: () => {
              loadChildren();
              loadStatistics();
            }}]
          );
        } else {
          Alert.alert(
            'Upload Failed',
            `Failed to import children:\n${result.errors.join('\n')}`,
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        Alert.alert(
          'Upload Error',
          `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
          [{ text: 'OK' }]
        );
      } finally {
        setLoading(false);
      }
    };

    input.click();
  };

  const handleExport = async () => {
    if (children.length === 0) {
      Alert.alert('No Data', 'No children data to export.', [{ text: 'OK' }]);
      return;
    }

    setLoading(true);
    try {
      await BatchUploadService.exportToExcel();
      Alert.alert('Export Successful', 'Data exported to Excel file successfully.', [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert(
        'Export Failed',
        `Failed to export data: ${error instanceof Error ? error.message : String(error)}`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      BatchUploadService.generateSampleCSV();
      Alert.alert('Template Downloaded', 'Sample CSV template has been downloaded.', [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert(
        'Download Failed',
        `Failed to download template: ${error instanceof Error ? error.message : String(error)}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleChildPress = (child: BatchChild) => {
    Alert.alert(
      child.name,
      'What would you like to do?',
      [
        { text: 'View QR Code', onPress: () => showQRCode(child) },
        { text: 'Start Measurement', onPress: () => startMeasurement(child) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const showQRCode = (child: BatchChild) => {
    setSelectedChild(child);
    setShowQRModal(true);
  };

  const startMeasurement = (child: BatchChild) => {
    navigation.navigate('Scanning', {
      childData: {
        name: child.name,
        dateOfBirth: child.dateOfBirth,
        gender: child.gender,
        uniqueId: child.uniqueId
      }
    });
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all batch data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await BatchUploadService.clearAllData();
              setChildren([]);
              setStatistics({
                totalChildren: 0,
                totalMeasurements: 0,
                childrenWithMeasurements: 0,
                averageMeasurementsPerChild: 0
              });
              Alert.alert('Data Cleared', 'All batch data has been cleared.', [{ text: 'OK' }]);
            } catch (error) {
              Alert.alert(
                'Clear Failed',
                `Failed to clear data: ${error instanceof Error ? error.message : String(error)}`,
                [{ text: 'OK' }]
              );
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderChild = ({ item }: { item: BatchChild }) => {
    const measurementCount = item.measurements?.length || 0;
    const hasQR = !!item.qrCode;

    return (
      <TouchableOpacity
        style={styles.childCard}
        onPress={() => handleChildPress(item)}
      >
        <View style={styles.childHeader}>
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{item.name}</Text>
            <Text style={styles.childDetails}>
              {item.gender} • {new Date().getFullYear() - new Date(item.dateOfBirth).getFullYear()} years
            </Text>
            <Text style={styles.childGuardian}>Guardian: {item.guardianName}</Text>
            {item.location && (
              <Text style={styles.childLocation}>📍 {item.location}</Text>
            )}
          </View>
          <View style={styles.childActions}>
            {hasQR && (
              <Ionicons name="qr-code" size={24} color={colors.primary} />
            )}
            <Text style={styles.measurementCount}>
              {measurementCount} measurements
            </Text>
          </View>
        </View>
        <Text style={styles.childId}>ID: {item.uniqueId}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Batch Upload</Text>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{statistics.totalChildren}</Text>
          <Text style={styles.statLabel}>Children</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{statistics.totalMeasurements}</Text>
          <Text style={styles.statLabel}>Measurements</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{statistics.childrenWithMeasurements}</Text>
          <Text style={styles.statLabel}>Measured</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{statistics.averageMeasurementsPerChild}</Text>
          <Text style={styles.statLabel}>Avg/Child</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleFileUpload}
          disabled={loading}
        >
          <Ionicons name="cloud-upload" size={20} color="white" />
          <Text style={styles.primaryButtonText}>Upload CSV/Excel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleDownloadTemplate}
        >
          <Ionicons name="download" size={20} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Template</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleExport}
          disabled={loading || children.length === 0}
        >
          <Ionicons name="document" size={20} color={children.length > 0 ? colors.primary : colors.textSecondary} />
          <Text style={[styles.secondaryButtonText, children.length === 0 && styles.disabledText]}>Export Excel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleClearData}
          disabled={loading || children.length === 0}
        >
          <Ionicons name="trash" size={20} color={children.length > 0 ? colors.error : colors.textSecondary} />
          <Text style={[styles.dangerButtonText, children.length === 0 && styles.disabledText]}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search children by name, ID, or guardian..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Children List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChildren}
          renderItem={renderChild}
          keyExtractor={(item) => item.uniqueId}
          style={styles.childrenList}
          contentContainerStyle={styles.childrenListContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Children Data</Text>
              <Text style={styles.emptyText}>
                Upload a CSV or Excel file to get started with batch measurements.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleDownloadTemplate}
              >
                <Text style={styles.emptyButtonText}>Download Template</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedChild?.name}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowQRModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {selectedChild?.qrCode && (
              <View style={styles.qrContainer}>
                <img
                  src={selectedChild.qrCode}
                  alt="QR Code"
                  style={styles.qrImage}
                />
                <Text style={styles.qrText}>ID: {selectedChild.uniqueId}</Text>
                <Text style={styles.qrInstructions}>
                  Scan this QR code to quickly start measurement for this child.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowQRModal(false);
                if (selectedChild) {
                  startMeasurement(selectedChild);
                }
              }}
            >
              <Text style={styles.modalButtonText}>Start Measurement</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.cardBackground,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  dangerButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.error,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  disabledText: {
    color: colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  childrenList: {
    flex: 1,
  },
  childrenListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  childCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  childDetails: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  childGuardian: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  childLocation: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  childActions: {
    alignItems: 'flex-end',
  },
  measurementCount: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  childId: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrImage: {
    width: 200,
    height: 200,
    marginBottom: 12,
  },
  qrText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  qrInstructions: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default BatchUploadScreen;