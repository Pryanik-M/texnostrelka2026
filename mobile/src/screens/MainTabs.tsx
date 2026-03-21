import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from './HomeScreen';
import { AnalyticsScreen } from './AnalyticsScreen';
import { ForecastScreen } from './ForecastScreen';
import { ProfileScreen } from './ProfileScreen';
import { Theme } from '../theme';

export type MainTabParamList = {
  Subscriptions: undefined;
  Analytics: undefined;
  Forecast: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const SubscriptionsScreen: React.FC = () => <HomeScreen />;

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: Theme.colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          elevation: 2,
          shadowOpacity: 0.1,
        },
        tabBarActiveTintColor: Theme.colors.accent,
        tabBarInactiveTintColor: Theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          fontFamily: 'Montserrat-Medium',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Subscriptions') {
            iconName = 'card-outline';
          } else if (route.name === 'Analytics') {
            iconName = 'analytics-outline';
          } else if (route.name === 'Forecast') {
            iconName = 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = 'person-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Subscriptions"
        component={SubscriptionsScreen}
        options={{ title: 'Подписки' }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ title: 'Аналитика' }}
      />
      <Tab.Screen
        name="Forecast"
        component={ForecastScreen}
        options={{ title: 'Прогноз' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Профиль' }}
      />
    </Tab.Navigator>
  );
};
