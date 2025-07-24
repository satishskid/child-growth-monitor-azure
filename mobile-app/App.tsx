import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ConsentScreen from './src/screens/ConsentScreen';
import ScanningScreen from './src/screens/ScanningScreen';
import ResultsScreen from './src/screens/ResultsScreen';

// Services
import { AuthProvider } from './src/services/AuthService';
import { DataProvider } from './src/services/DataService';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DataProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Welcome"
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#2E8B57', // Forest green - health/growth theme
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              <Stack.Screen 
                name="Welcome" 
                component={WelcomeScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Login" 
                component={LoginScreen}
                options={{ title: 'Sign In' }}
              />
              <Stack.Screen 
                name="Home" 
                component={HomeScreen}
                options={{ title: 'Child Growth Monitor' }}
              />
              <Stack.Screen 
                name="Consent" 
                component={ConsentScreen}
                options={{ title: 'Consent & Privacy' }}
              />
              <Stack.Screen 
                name="Scanning" 
                component={ScanningScreen}
                options={{ 
                  title: 'Child Scanning',
                  headerBackTitleVisible: false 
                }}
              />
              <Stack.Screen 
                name="Results" 
                component={ResultsScreen}
                options={{ title: 'Scan Results' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar style="light" />
        </DataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
