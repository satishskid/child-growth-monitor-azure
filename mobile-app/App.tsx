import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Development utilities
import './src/utils/devUtils';

// Screens
import ConsentScreen from './src/screens/ConsentScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import ScanningScreen from './src/screens/ScanningScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';

// Services
import { AuthProvider } from './src/services/AuthService';
import { DataProvider } from './src/services/DataService';

// Development components
import DevComponent from './src/components/DevComponent';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <DevComponent />
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
