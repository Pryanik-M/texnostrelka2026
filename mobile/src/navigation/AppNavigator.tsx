import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { AUTH_TOKEN_KEY } from '../constants/auth';
import { RootStackParamList } from './types';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { MainTabs } from '../screens/MainTabs';
import { SubscriptionFormScreen } from '../screens/SubscriptionFormScreen';
import { SubscriptionDetailScreen } from '../screens/SubscriptionDetailScreen';
import { ImportEmailScreen } from '../screens/ImportEmailScreen';
import { ForecastScreen } from '../screens/ForecastScreen';
import { CandidatesScreen } from '../screens/CandidatesScreen';
import { clearTokens, getProfile, refreshAccessToken } from '../api/client';
import { Theme } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();



export const AppNavigator: React.FC = () => {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      console.log('[Nav] checkToken start');
      try {
        const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        console.log('[Nav] token', token ? 'present' : 'missing');
        if (!token) {
          setInitialRoute('Login');
          console.log('[Nav] route Login');
          return;
        }
        try {
          console.log('[Nav] getProfile');
          await getProfile();
          console.log('[Nav] getProfile ok');
          setInitialRoute('MainTabs');
          console.log('[Nav] route MainTabs');
        } catch {
          try {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
              await getProfile();
              setInitialRoute('MainTabs');
              console.log('[Nav] route MainTabs');
              return;
            }
          } catch {
            // ignore and fall back to logout
          }
          await clearTokens();
          setInitialRoute('Login');
          console.log('[Nav] route Login');
        }
      } catch {
        setInitialRoute('Login');
          console.log('[Nav] route Login');
      }
    };

    const timeout = setTimeout(() => {
      setInitialRoute((current) => {
        if (current) return current;
        console.log('[Nav] timeout -> Login');
        return 'Login';
      });
    }, 4000);

    checkToken().finally(() => clearTimeout(timeout));
  }, []);

  if (!initialRoute) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={Theme.colors.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SubscriptionDetail"
        component={SubscriptionDetailScreen}
        options={{
          headerTitle: 'Детали подписки',
          headerTintColor: Theme.colors.textPrimary,
          headerStyle: { backgroundColor: Theme.colors.background },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="SubscriptionForm"
        component={SubscriptionFormScreen}
        options={{
          headerTitle: 'Подписка',
          headerTintColor: Theme.colors.textPrimary,
          headerStyle: { backgroundColor: Theme.colors.background },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="ImportEmail"
        component={ImportEmailScreen}
        options={{
          headerTitle: 'Импорт из письма',
          headerTintColor: Theme.colors.textPrimary,
          headerStyle: { backgroundColor: Theme.colors.background },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="Forecast"
        component={ForecastScreen}
        options={{
          headerTitle: 'Прогноз расходов',
          headerTintColor: Theme.colors.textPrimary,
          headerStyle: { backgroundColor: Theme.colors.background },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="Candidates"
        component={CandidatesScreen}
        options={{
          headerTitle: 'Кандидаты подписок',
          headerTintColor: Theme.colors.textPrimary,
          headerStyle: { backgroundColor: Theme.colors.background },
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};







