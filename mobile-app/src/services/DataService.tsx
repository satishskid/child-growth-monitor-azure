import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnthropometricPredictions, Child, Consent, ScanData, ScanSession } from '@shared/types';
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { authenticatedFetch, useAuth } from './AuthService';

interface DataContextType {
  // Children management
  children: Child[];
  loadChildren: () => Promise<void>;
  createChild: (childData: Partial<Child>) => Promise<Child | null>;
  updateChild: (childId: string, childData: Partial<Child>) => Promise<boolean>;
  deleteChild: (childId: string) => Promise<boolean>;
  
  // Consent management
  createConsent: (consentData: Partial<Consent>) => Promise<Consent | null>;
  getConsent: (consentId: string) => Promise<Consent | null>;
  
  // Scan sessions
  scanSessions: ScanSession[];
  loadScanSessions: () => Promise<void>;
  createScanSession: (sessionData: Partial<ScanSession>) => Promise<ScanSession | null>;
  updateScanSession: (sessionId: string, sessionData: Partial<ScanSession>) => Promise<boolean>;
  
  // Scan data
  uploadScanData: (scanData: ScanData) => Promise<boolean>;
  processScanSession: (sessionId: string) => Promise<AnthropometricPredictions | null>;
  
  // Offline data management
  syncOfflineData: () => Promise<void>;
  hasOfflineData: boolean;
  
  // Loading states
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { token } = useAuth();
  const [childrenData, setChildrenData] = useState<Child[]>([]);
  const [scanSessions, setScanSessions] = useState<ScanSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasOfflineData, setHasOfflineData] = useState(false);

  const API_BASE_URL = 'http://localhost:5000/api';

  // Children management
  const loadChildren = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await authenticatedFetch(
        `${API_BASE_URL}/children`,
        { method: 'GET' },
        token
      );
      
      const data = await response.json();
      
      if (response.ok) {
        setChildrenData(data.data || []);
        
        // Cache children data locally for offline access
        await AsyncStorage.setItem('cached_children', JSON.stringify(data.data || []));
      } else {
        throw new Error(data.error?.message || 'Failed to load children');
      }
    } catch (error) {
      console.error('Load children error:', error);
      
      // Try to load from cache if network fails
      try {
        const cachedChildren = await AsyncStorage.getItem('cached_children');
        if (cachedChildren) {
          setChildrenData(JSON.parse(cachedChildren));
        }
      } catch (cacheError) {
        console.error('Cache load error:', cacheError);
      }
      
      Alert.alert('Error', 'Failed to load children data. Showing cached data if available.');
    } finally {
      setIsLoading(false);
    }
  };

  const createChild = async (childData: Partial<Child>): Promise<Child | null> => {
    try {
      setIsLoading(true);
      
      const response = await authenticatedFetch(
        `${API_BASE_URL}/children`,
        {
          method: 'POST',
          body: JSON.stringify(childData),
        },
        token
      );
      
      const data = await response.json();
      
      if (response.ok) {
        const newChild = data.data;
        setChildrenData(prev => [...prev, newChild]);
        
        // Update cache
        const updatedChildren = [...childrenData, newChild];
        await AsyncStorage.setItem('cached_children', JSON.stringify(updatedChildren));
        
        return newChild;
      } else {
        throw new Error(data.error?.message || 'Failed to create child');
      }
    } catch (error) {
      console.error('Create child error:', error);
      
      // Store for offline sync
      await storeOfflineAction('create_child', childData);
      setHasOfflineData(true);
      
      Alert.alert('Offline Mode', 'Child data saved locally. Will sync when online.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateChild = async (childId: string, childData: Partial<Child>): Promise<boolean> => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/children/${childId}`,
        {
          method: 'PUT',
          body: JSON.stringify(childData),
        },
        token
      );
      
      const data = await response.json();
      
      if (response.ok) {
        setChildrenData(prev => 
          prev.map(child => 
            child.id === childId ? { ...child, ...childData } : child
          )
        );
        
        // Update cache
        const updatedChildren = childrenData.map(child => 
          child.id === childId ? { ...child, ...childData } : child
        );
        await AsyncStorage.setItem('cached_children', JSON.stringify(updatedChildren));
        
        return true;
      } else {
        throw new Error(data.error?.message || 'Failed to update child');
      }
    } catch (error) {
      console.error('Update child error:', error);
      
      // Store for offline sync
      await storeOfflineAction('update_child', { childId, ...childData });
      setHasOfflineData(true);
      
      Alert.alert('Offline Mode', 'Child data updated locally. Will sync when online.');
      return false;
    }
  };

  const deleteChild = async (childId: string): Promise<boolean> => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/children/${childId}`,
        { method: 'DELETE' },
        token
      );
      
      if (response.ok) {
        setChildrenData(prev => prev.filter(child => child.id !== childId));
        
        // Update cache
        const updatedChildren = childrenData.filter(child => child.id !== childId);
        await AsyncStorage.setItem('cached_children', JSON.stringify(updatedChildren));
        
        return true;
      } else {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to delete child');
      }
    } catch (error) {
      console.error('Delete child error:', error);
      Alert.alert('Error', 'Failed to delete child. Please try again.');
      return false;
    }
  };

  // Consent management
  const createConsent = async (consentData: Partial<Consent>): Promise<Consent | null> => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/consent`,
        {
          method: 'POST',
          body: JSON.stringify(consentData),
        },
        token
      );
      
      const data = await response.json();
      
      if (response.ok) {
        return data.data;
      } else {
        throw new Error(data.error?.message || 'Failed to create consent');
      }
    } catch (error) {
      console.error('Create consent error:', error);
      
      // Store for offline sync
      await storeOfflineAction('create_consent', consentData);
      setHasOfflineData(true);
      
      Alert.alert('Offline Mode', 'Consent recorded locally. Will sync when online.');
      return null;
    }
  };

  const getConsent = async (consentId: string): Promise<Consent | null> => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/consent/${consentId}`,
        { method: 'GET' },
        token
      );
      
      const data = await response.json();
      
      if (response.ok) {
        return data.data;
      } else {
        throw new Error(data.error?.message || 'Failed to get consent');
      }
    } catch (error) {
      console.error('Get consent error:', error);
      return null;
    }
  };

  // Scan sessions
  const loadScanSessions = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await authenticatedFetch(
        `${API_BASE_URL}/scan-sessions`,
        { method: 'GET' },
        token
      );
      
      const data = await response.json();
      
      if (response.ok) {
        setScanSessions(data.data || []);
        
        // Cache scan sessions
        await AsyncStorage.setItem('cached_scan_sessions', JSON.stringify(data.data || []));
      } else {
        throw new Error(data.error?.message || 'Failed to load scan sessions');
      }
    } catch (error) {
      console.error('Load scan sessions error:', error);
      
      // Try to load from cache
      try {
        const cachedSessions = await AsyncStorage.getItem('cached_scan_sessions');
        if (cachedSessions) {
          setScanSessions(JSON.parse(cachedSessions));
        }
      } catch (cacheError) {
        console.error('Cache load error:', cacheError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createScanSession = async (sessionData: Partial<ScanSession>): Promise<ScanSession | null> => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/scan-sessions`,
        {
          method: 'POST',
          body: JSON.stringify(sessionData),
        },
        token
      );
      
      const data = await response.json();
      
      if (response.ok) {
        const newSession = data.data;
        setScanSessions(prev => [...prev, newSession]);
        return newSession;
      } else {
        throw new Error(data.error?.message || 'Failed to create scan session');
      }
    } catch (error) {
      console.error('Create scan session error:', error);
      
      // Store for offline sync
      await storeOfflineAction('create_scan_session', sessionData);
      setHasOfflineData(true);
      
      return null;
    }
  };

  const updateScanSession = async (sessionId: string, sessionData: Partial<ScanSession>): Promise<boolean> => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/scan-sessions/${sessionId}`,
        {
          method: 'PUT',
          body: JSON.stringify(sessionData),
        },
        token
      );
      
      if (response.ok) {
        setScanSessions(prev =>
          prev.map(session =>
            session.id === sessionId ? { ...session, ...sessionData } : session
          )
        );
        return true;
      } else {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to update scan session');
      }
    } catch (error) {
      console.error('Update scan session error:', error);
      
      // Store for offline sync
      await storeOfflineAction('update_scan_session', { sessionId, ...sessionData });
      setHasOfflineData(true);
      
      return false;
    }
  };

  // Scan data management
  const uploadScanData = async (scanData: ScanData): Promise<boolean> => {
    try {
      // TODO: Implement actual file upload
      const response = await authenticatedFetch(
        `${API_BASE_URL}/scan-data`,
        {
          method: 'POST',
          body: JSON.stringify(scanData),
        },
        token
      );
      
      if (response.ok) {
        return true;
      } else {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to upload scan data');
      }
    } catch (error) {
      console.error('Upload scan data error:', error);
      
      // Store for offline sync
      await storeOfflineAction('upload_scan_data', scanData);
      setHasOfflineData(true);
      
      return false;
    }
  };

  const processScanSession = async (sessionId: string): Promise<AnthropometricPredictions | null> => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/scan-sessions/${sessionId}/process`,
        { method: 'POST' },
        token
      );
      
      const data = await response.json();
      
      if (response.ok) {
        return data.data;
      } else {
        throw new Error(data.error?.message || 'Failed to process scan session');
      }
    } catch (error) {
      console.error('Process scan session error:', error);
      return null;
    }
  };

  // Offline data management
  const storeOfflineAction = async (action: string, data: any) => {
    try {
      const offlineActions = await AsyncStorage.getItem('offline_actions');
      const actions = offlineActions ? JSON.parse(offlineActions) : [];
      
      actions.push({
        id: Date.now().toString(),
        action,
        data,
        timestamp: new Date().toISOString(),
      });
      
      await AsyncStorage.setItem('offline_actions', JSON.stringify(actions));
    } catch (error) {
      console.error('Store offline action error:', error);
    }
  };

  const syncOfflineData = async (): Promise<void> => {
    try {
      const offlineActions = await AsyncStorage.getItem('offline_actions');
      if (!offlineActions) return;
      
      const actions = JSON.parse(offlineActions);
      if (actions.length === 0) return;
      
      setIsLoading(true);
      
      // Process each offline action
      for (const actionItem of actions) {
        try {
          switch (actionItem.action) {
            case 'create_child':
              await createChild(actionItem.data);
              break;
            case 'update_child':
              await updateChild(actionItem.data.childId, actionItem.data);
              break;
            case 'create_consent':
              await createConsent(actionItem.data);
              break;
            case 'create_scan_session':
              await createScanSession(actionItem.data);
              break;
            case 'update_scan_session':
              await updateScanSession(actionItem.data.sessionId, actionItem.data);
              break;
            case 'upload_scan_data':
              await uploadScanData(actionItem.data);
              break;
          }
        } catch (error) {
          console.error(`Failed to sync action ${actionItem.action}:`, error);
        }
      }
      
      // Clear offline actions after successful sync
      await AsyncStorage.removeItem('offline_actions');
      setHasOfflineData(false);
      
      Alert.alert('Sync Complete', 'All offline data has been synchronized.');
    } catch (error) {
      console.error('Sync offline data error:', error);
      Alert.alert('Sync Error', 'Some data could not be synchronized. Will retry later.');
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: DataContextType = {
    children: childrenData,
    loadChildren,
    createChild,
    updateChild,
    deleteChild,
    createConsent,
    getConsent,
    scanSessions,
    loadScanSessions,
    createScanSession,
    updateScanSession,
    uploadScanData,
    processScanSession,
    syncOfflineData,
    hasOfflineData,
    isLoading,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
