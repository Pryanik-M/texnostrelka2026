import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { HomeScreen } from './HomeScreen';
import { AnalyticsScreen } from './AnalyticsScreen';
import { NotificationsScreen } from './NotificationsScreen';

export type MainTabParamList = {
  Subscriptions: undefined;
  Analytics: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const SubscriptionsScreen: React.FC = () => <HomeScreen />;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#020617',
        paddingHorizontal: 32,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: '600',
          color: '#e5e7eb',
          marginBottom: 8,
        }}
      >
        Профиль
      </Text>
      <Text style={{ color: '#9ca3af', textAlign: 'center', marginBottom: 24 }}>
        Здесь будет управление аккаунтом и настройками подписок.
      </Text>
      <TouchableOpacity
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: '#38bdf8',
          paddingVertical: 11,
          paddingHorizontal: 18,
        }}
        onPress={() =>
          navigation.getParent()?.navigate('ImportEmail' as never)
        }
      >
        <Text
          style={{
            color: '#38bdf8',
            fontSize: 14,
            fontWeight: '600',
          }}
        >
          Импортировать из письма банка
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#020617',
          borderTopColor: '#111827',
        },
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#6b7280',
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

