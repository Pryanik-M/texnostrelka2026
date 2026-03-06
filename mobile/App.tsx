import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { AppNavigator } from './src/navigation/AppNavigator';
import { useSubscriptionStore } from './src/store/useSubscriptionStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const daysUntil = (isoDate: string) => {
  const target = new Date(isoDate);
  const now = new Date();
  if (Number.isNaN(target.getTime())) return null;
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export default function App() {
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const fetchSubscriptions = useSubscriptionStore((s) => s.fetchSubscriptions);

  useEffect(() => {
    const setupNotifications = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return;
      }

      if (!subscriptions.length) {
        await fetchSubscriptions();
      }

      const currentSubs = useSubscriptionStore.getState().subscriptions;
      const upcoming = currentSubs
        .map((s) => ({ sub: s, days: daysUntil(s.nextChargeDate) }))
        .filter(
          (item) =>
            item.days !== null && item.days >= 1 && item.days <= 3 && item.sub.isActive,
        );

      await Notifications.cancelAllScheduledNotificationsAsync();

      for (const item of upcoming) {
        const { sub, days } = item;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Скоро списание по подписке',
            body: `Через ${days} д. спишется ${sub.price} руб. за ${sub.name}`,
          },
          trigger: null,
        });
      }
    };

    setupNotifications();
  }, [subscriptions.length, fetchSubscriptions]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

