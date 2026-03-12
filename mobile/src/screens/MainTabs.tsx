import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from './HomeScreen';
import { AnalyticsScreen } from './AnalyticsScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { ProfileScreen } from './ProfileScreen';
import { Theme } from '../theme';

export type MainTabParamList = {
  Subscriptions: undefined;
  Analytics: undefined;
  Notifications: undefined;
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
          backgroundColor: Theme.colors.surfaceAlt,
          borderTopColor: Theme.colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Theme.colors.accent,
        tabBarInactiveTintColor: Theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Subscriptions') {
            iconName = 'card-outline';
          } else if (route.name === 'Analytics') {
            iconName = 'analytics-outline';
          } else if (route.name === 'Notifications') {
            iconName = 'notifications-outline';
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
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Уведомления' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Профиль' }}
      />
    </Tab.Navigator>
  );
};
