import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '@shared/types';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('access_token');
      const storedUser = await AsyncStorage.getItem('user_data');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // TODO: Replace with actual API endpoint
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const { access_token, user: userData } = data.data;
        
        // Store authentication data
        await AsyncStorage.setItem('access_token', access_token);
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        
        setToken(access_token);
        setUser(userData);
        
        return true;
      } else {
        Alert.alert('Login Failed', data.error?.message || 'Invalid credentials');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear stored authentication data
      await AsyncStorage.multiRemove(['access_token', 'user_data']);
      
      // TODO: Call logout endpoint to invalidate token on server
      if (token) {
        fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(console.error); // Don't block logout on network error
      }
      
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAuthenticated = !!user && !!token;

  const contextValue: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated,
    token,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Utility function to get headers with authentication
export const getAuthHeaders = (token: string | null) => ({
  'Authorization': token ? `Bearer ${token}` : '',
  'Content-Type': 'application/json',
});

// HTTP client with authentication
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {},
  token: string | null
) => {
  const headers = {
    ...getAuthHeaders(token),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle token expiration
  if (response.status === 401) {
    // Token might be expired, logout user
    await AsyncStorage.multiRemove(['access_token', 'user_data']);
    throw new Error('Authentication expired. Please login again.');
  }

  return response;
};
