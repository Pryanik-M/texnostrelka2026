import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { MainTabs } from '../screens/MainTabs';
import { SubscriptionFormScreen } from '../screens/SubscriptionFormScreen';
import { SubscriptionDetailScreen } from '../screens/SubscriptionDetailScreen';
import { ImportEmailScreen } from '../screens/ImportEmailScreen';
import { ForecastScreen } from '../screens/ForecastScreen';
import { CandidatesScreen } from '../screens/CandidatesScreen';
import { getProfile } from '../api/client';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  SubscriptionDetail: { subscriptionId: string };
  SubscriptionForm: { subscriptionId?: string; candidateId?: number; candidateName?: string } | undefined;
  ImportEmail: undefined;
  Forecast: undefined;
  Candidates: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AUTH_TOKEN_KEY = 'authToken';

export const AppNavigator: React.FC = () => {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        if (!token) {
          setInitialRoute('Login');
          return;
        }
        try {
          await getProfile();
          setInitialRoute('MainTabs');
        } catch {
          await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
          setInitialRoute('Login');
        }
      } catch {
        setInitialRoute('Login');
      }
    };

    checkToken();
  }, []);

  if (!initialRoute) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#050816',
        }}
      >
        <ActivityIndicator size="large" color="#38bdf8" />
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
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SubscriptionDetail"
        component={SubscriptionDetailScreen}
        options={{
          headerTitle: 'Детали подписки',
          headerTintColor: '#e5e7eb',
          headerStyle: { backgroundColor: '#020617' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="SubscriptionForm"
        component={SubscriptionFormScreen}
        options={{
          headerTitle: 'Подписка',
          headerTintColor: '#e5e7eb',
          headerStyle: { backgroundColor: '#020617' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="ImportEmail"
        component={ImportEmailScreen}
        options={{
          headerTitle: 'Импорт из письма',
          headerTintColor: '#e5e7eb',
          headerStyle: { backgroundColor: '#020617' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="Forecast"
        component={ForecastScreen}
        options={{
          headerTitle: 'Прогноз расходов',
          headerTintColor: '#e5e7eb',
          headerStyle: { backgroundColor: '#020617' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="Candidates"
        component={CandidatesScreen}
        options={{
          headerTitle: 'Кандидаты подписок',
          headerTintColor: '#e5e7eb',
          headerStyle: { backgroundColor: '#020617' },
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};
