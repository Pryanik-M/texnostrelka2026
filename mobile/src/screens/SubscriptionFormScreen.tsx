import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { RootStackParamList } from '../navigation/AppNavigator';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { createFromCandidate } from '../api/client';
import { CATEGORIES } from '../constants/categories';
import { Subscription, SubscriptionCategory } from '../types';
import { ScreenBackground } from '../components/ScreenBackground';
import { Theme } from '../theme';

type SubscriptionFormRouteProp = RouteProp<RootStackParamList, 'SubscriptionForm'>;

type BillingPeriod = 'month' | 'year';

interface FormValues {
  name: string;
  price: string;
  billingPeriod: BillingPeriod;
  nextChargeDate: Date;
  category: SubscriptionCategory;
  url: string;
  notes: string;
}

const schema = yup.object({
  name: yup.string().required('Введите название сервиса'),
  price: yup
    .number()
    .typeError('Укажите стоимость в рублях')
    .positive('Стоимость должна быть больше нуля')
    .required('Введите стоимость'),
  billingPeriod: yup.mixed<BillingPeriod>().oneOf(['month', 'year']).required(),
  nextChargeDate: yup.date().required('Выберите дату списания'),
  category: yup
    .mixed<SubscriptionCategory>()
    .oneOf(['streaming', 'software', 'delivery', 'music', 'cloud'])
    .required('Выберите категорию'),
  url: yup.string().url('Некорректная ссылка').nullable().transform((value) => value || ''),
  notes: yup.string().nullable().transform((value) => value || ''),
});

export const SubscriptionFormScreen: React.FC = () => {
  const route = useRoute<SubscriptionFormRouteProp>();
  const navigation = useNavigation();
  const { subscriptions, add, update, remove, fetchSubscriptions } = useSubscriptionStore();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const editingSubscription: Subscription | undefined = useMemo(
    () => subscriptions.find((s) => s.id === route.params?.subscriptionId),
    [subscriptions, route.params],
  );
  const candidateId = route.params?.candidateId;
  const candidateName = route.params?.candidateName;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: editingSubscription?.name ?? candidateName ?? '',
      price: editingSubscription ? String(editingSubscription.price) : '',
      billingPeriod: editingSubscription?.billingPeriod ?? 'month',
      nextChargeDate: editingSubscription
        ? new Date(editingSubscription.nextChargeDate)
        : new Date(),
      category: editingSubscription?.category ?? 'software',
      url: editingSubscription?.url ?? '',
      notes: editingSubscription?.notes ?? '',
    },
  });

  useEffect(() => {
    if (editingSubscription) {
      navigation.setOptions?.({
        headerShown: true,
        title: 'Редактирование подписки',
      });
    } else {
      navigation.setOptions?.({
        headerShown: true,
        title: 'Новая подписка',
      });
    }
  }, [editingSubscription, navigation]);

  const onSubmit = async (values: FormValues) => {
    const payload: Partial<Subscription> = {
      name: values.name.trim(),
      price: Number(values.price),
      billingPeriod: values.billingPeriod,
      nextChargeDate: values.nextChargeDate.toISOString().slice(0, 10),
      category: values.category,
      url: values.url.trim() || undefined,
      notes: values.notes.trim() || undefined,
    };

    if (candidateId) {
      const response = await createFromCandidate(candidateId, {
        name: payload.name ?? candidateName ?? 'Подписка',
        price: payload.price ?? 0,
        currency: 'RUB',
        billing_period: payload.billingPeriod ?? 'month',
        start_date: new Date().toISOString().slice(0, 10),
        next_payment_date: payload.nextChargeDate ?? new Date().toISOString().slice(0, 10),
        service_url: payload.url ?? '',
        notes: payload.notes ?? '',
      });
      if (response?.subscription) {
        await fetchSubscriptions();
        navigation.goBack();
      }
      return;
    }

    if (editingSubscription) {
      const updated = await update(editingSubscription.id, payload);
      if (updated) {
        navigation.goBack();
      }
    } else {
      const created = await add(payload);
      if (created) {
        navigation.goBack();
      }
    }
  };

  const handleDelete = () => {
    if (!editingSubscription) return;
    Alert.alert('Удалить подписку', `Вы уверены, что хотите удалить «${editingSubscription.name}»?`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await remove(editingSubscription.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const formattedDateLabel = (date: Date) =>
    date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>
            {editingSubscription ? 'Редактирование подписки' : 'Новая подписка'}
          </Text>
          <Text style={styles.subtitle}>
            Заполните детали сервиса, чтобы мы могли учитывать его в аналитике.
          </Text>

          <Text style={styles.label}>Название сервиса</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Например, Netflix, Яндекс Плюс"
                placeholderTextColor={Theme.colors.textMuted}
              />
            )}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

          <View style={styles.row}>
            <View style={[styles.column, { flex: 1.2 }]}>
              <Text style={styles.label}>Стоимость (руб)</Text>
              <Controller
                control={control}
                name="price"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.price && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="799"
                    placeholderTextColor={Theme.colors.textMuted}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.price && <Text style={styles.errorText}>{errors.price.message}</Text>}
            </View>

            <View style={[styles.column, { flex: 1 }]}>
              <Text style={styles.label}>Период</Text>
              <Controller
                control={control}
                name="billingPeriod"
                render={({ field: { value, onChange } }) => (
                  <View style={styles.segmentContainer}>
                    <TouchableOpacity
                      style={[styles.segment, value === 'month' && styles.segmentSelected]}
                      onPress={() => onChange('month')}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          value === 'month' && styles.segmentTextSelected,
                        ]}
                      >
                        Ежемесячно
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.segment, value === 'year' && styles.segmentSelected]}
                      onPress={() => onChange('year')}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          value === 'year' && styles.segmentTextSelected,
                        ]}
                      >
                        Ежегодно
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          </View>

          <Text style={styles.label}>Дата следующего списания</Text>
          <Controller
            control={control}
            name="nextChargeDate"
            render={({ field: { value } }) => (
              <>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateText}>{formattedDateLabel(value)}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={value}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setValue('nextChargeDate', selectedDate, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                )}
              </>
            )}
          />
          {errors.nextChargeDate && (
            <Text style={styles.errorText}>{errors.nextChargeDate.message}</Text>
          )}

          <Text style={styles.label}>Категория</Text>
          <Controller
            control={control}
            name="category"
            render={({ field: { value, onChange } }) => (
              <View style={styles.categoryContainer}>
                {CATEGORIES.map((cat) => {
                  const selected = value === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        selected && { backgroundColor: cat.color, borderColor: cat.color },
                      ]}
                      onPress={() => onChange(cat.id)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          selected && { color: Theme.colors.background, fontWeight: '700' },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />
          {errors.category && <Text style={styles.errorText}>{errors.category.message}</Text>}

          <Text style={styles.label}>Ссылка на сервис</Text>
          <Controller
            control={control}
            name="url"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={[styles.input, errors.url && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="https://service.com/account"
                placeholderTextColor={Theme.colors.textMuted}
                autoCapitalize="none"
              />
            )}
          />
          {errors.url && <Text style={styles.errorText}>{errors.url.message}</Text>}

          <Text style={styles.label}>Заметки об использовании</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Например, для семьи / рабочего проекта / учёбы"
                placeholderTextColor={Theme.colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            )}
          />

          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting
                ? editingSubscription
                  ? 'Сохраняем...'
                  : 'Добавляем...'
                : 'Сохранить'}
            </Text>
          </TouchableOpacity>

          {editingSubscription && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Удалить подписку</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    color: Theme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  label: {
    marginTop: 16,
    marginBottom: 4,
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  input: {
    borderRadius: Theme.radii.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Theme.colors.textPrimary,
    fontSize: 15,
    backgroundColor: Theme.colors.surfaceAlt,
  },
  inputError: {
    borderColor: Theme.colors.danger,
  },
  notesInput: {
    minHeight: 90,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: Theme.colors.danger,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  column: {
    flex: 1,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
    backgroundColor: Theme.colors.surfaceAlt,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  segmentSelected: {
    backgroundColor: Theme.colors.accent,
  },
  segmentText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  segmentTextSelected: {
    color: Theme.colors.background,
    fontWeight: '600',
  },
  dateInput: {
    borderRadius: Theme.radii.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Theme.colors.surfaceAlt,
  },
  dateText: {
    fontSize: 15,
    color: Theme.colors.textPrimary,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surfaceAlt,
  },
  categoryChipText: {
    fontSize: 12,
    color: Theme.colors.textPrimary,
  },
  primaryButton: {
    marginTop: 24,
    borderRadius: Theme.radii.md,
    backgroundColor: Theme.colors.accent,
    paddingVertical: 12,
    alignItems: 'center',
    ...Theme.shadow.glow,
  },
  primaryButtonText: {
    color: Theme.colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    marginTop: 12,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: '#b91c1c',
    paddingVertical: 11,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: Theme.colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});
