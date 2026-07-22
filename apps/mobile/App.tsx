import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from './src/providers/AppProviders';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationTheme } from './src/navigation/navigationTheme';

export default function App() {
  return (
    <AppProviders>
      <NavigationContainer theme={navigationTheme}>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style="auto" />
    </AppProviders>
  );
}
