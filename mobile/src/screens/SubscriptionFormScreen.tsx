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

import { RootStackParamList } from '../navigation/types';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { createFromCandidate } from '../api/client';
import { mapCategoriesToConfig } from '../constants/categories';
import { BillingPeriod, Subscription } from '../types';
import { ScreenBackground } from '../components/ScreenBackground';
import { Theme } from '../theme';

type SubscriptionFormRouteProp = RouteProp<RootStackParamList, 'SubscriptionForm'>;

interface FormValues {
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: BillingPeriod;
  billingInterval: number;
  startDate: Date;
  nextChargeDate: Date;
  status: 'active' | 'paused' | 'cancelled';
  categoryId: number | null;
  url: string;
  notes: string;
}

const schema = yup.object({
  name: yup.string().required('Введите название сервиса'),
  description: yup.string().nullable().transform((value) => value || ''),
  price: yup
    .number()
    .typeError('Укажите стоимость в рублях')
    .positive('Стоимость должна быть больше нуля')
    .required('Введите стоимость'),
  currency: yup.string().required('Укажите валюту'),
  billingPeriod: yup.mixed<BillingPeriod>().oneOf(['day', 'week', 'month', 'year']).required(),
  billingInterval: yup
    .number()
    .typeError('Укажите частоту списания')
    .integer('Частота должна быть целым числом')
    .min(1, 'Частота должна быть больше нуля')
    .required('Укажите частоту списания'),
  startDate: yup.date().required('Выберите дату начала'),
  nextChargeDate: yup.date().required('Выберите дату списания'),
  status: yup.mixed<FormValues['status']>().oneOf(['active', 'paused', 'cancelled']).required(),
  categoryId: yup
    .number()
    .nullable()
    .required('Выберите категорию'),
  url: yup.string().url('Некорректная ссылка').nullable().transform((value) => value || ''),
  notes: yup.string().nullable().transform((value) => value || ''),
});

export const SubscriptionFormScreen: React.FC = () => {
  const route = useRoute<SubscriptionFormRouteProp>();
  const navigation = useNavigation();
  const { subscriptions, add, update, remove, fetchSubscriptions, categories, ensureCategories } =
    useSubscriptionStore();
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);

  useEffect(() => {
    ensureCategories();
  }, [ensureCategories]);

  const editingSubscription: Subscription | undefined = useMemo(
    () => subscriptions.find((s) => s.id === String(route.params?.subscriptionId)),
    [subscriptions, route.params],
  );
  const candidateId = route.params?.candidateId;
  const candidateName = route.params?.candidateName;

  const categoryOptions = useMemo(() => mapCategoriesToConfig(categories), [categories]);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as any,
    mode: 'onChange',
    defaultValues: {
      name: editingSubscription?.name ?? candidateName ?? '',
      description: editingSubscription?.description ?? '',
      price: editingSubscription?.price ?? 0,
      currency: editingSubscription?.currency ?? 'RUB',
      billingPeriod: editingSubscription?.billingPeriod ?? 'month',
      billingInterval: editingSubscription?.billingInterval ?? 1,
      startDate: editingSubscription?.startDate
        ? new Date(editingSubscription.startDate)
        : new Date(),
      nextChargeDate: editingSubscription
        ? new Date(editingSubscription.nextChargeDate)
        : new Date(),
      status:
        editingSubscription?.status ??
        (editingSubscription?.isActive ? 'active' : editingSubscription ? 'paused' : 'active'),
      categoryId: editingSubscription?.categoryId ?? categories[0]?.id ?? null,
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

  useEffect(() => {
    if (!editingSubscription && categories.length) {
      setValue('categoryId', categories[0].id, { shouldDirty: false });
    }
  }, [categories, editingSubscription, setValue]);

  const onSubmit = async (values: FormValues) => {
    const payload: Partial<Subscription> = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      price: values.price,
      currency: values.currency.trim(),
      billingPeriod: values.billingPeriod,
      billingInterval: values.billingInterval,
      startDate: values.startDate.toISOString().slice(0, 10),
      nextChargeDate: values.nextChargeDate.toISOString().slice(0, 10),
      status: values.status,
      categoryId: values.categoryId,
      url: values.url.trim() || undefined,
      notes: values.notes.trim() || undefined,
    };

    if (candidateId) {
      const response = await createFromCandidate(candidateId, {
        name: payload.name ?? candidateName ?? 'Подписка',
        description: payload.description ?? '',
        price: payload.price ?? 0,
        currency: payload.currency ?? 'RUB',
        billing_period: payload.billingPeriod ?? 'month',
        billing_interval: payload.billingInterval ?? 1,
        start_date: payload.startDate ?? new Date().toISOString().slice(0, 10),
        next_payment_date: payload.nextChargeDate ?? new Date().toISOString().slice(0, 10),
        status: payload.status ?? 'active',
        category: payload.categoryId ?? undefined,
        service_url: payload.url ?? '',
        notes: payload.notes ?? '',
      });
      if (response) {
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>
            {editingSubscription ? 'Редактирование подписки' : 'Новая подписка'}
          </Text>
          <Text style={styles.subtitle}>
            Заполните данные подписки.
          </Text>

          <Text style={styles.label}>Название подписки</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Название подписки"
                placeholderTextColor={Theme.colors.textMuted}
              />
            )}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

          <Text style={styles.label}>Краткое описание подписки</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Краткое описание подписки"
                placeholderTextColor={Theme.colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            )}
          />

          <View style={styles.row}>
            <View style={[styles.column, { flex: 1.1 }]}>
              <Text style={styles.label}>Стоимость</Text>
              <Controller
                control={control}
                name="price"
                render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                    style={[styles.input, errors.price && styles.inputError]}
                    value={String(value ?? '')}
                    onChangeText={(text) => onChange(Number(text.replace(',', '.')) || 0)}
                    onBlur={onBlur}
                    placeholder="Стоимость"
                    placeholderTextColor={Theme.colors.textMuted}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.price && <Text style={styles.errorText}>{errors.price.message}</Text>}
            </View>

            <View style={[styles.column, { flex: 0.9 }]}>
              <Text style={styles.label}>Валюта</Text>
              <Controller
                control={control}
                name="currency"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.currency && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Валюта"
                    placeholderTextColor={Theme.colors.textMuted}
                    autoCapitalize="characters"
                  />
                )}
              />
              {errors.currency && <Text style={styles.errorText}>{errors.currency.message}</Text>}
            </View>
          </View>

          <Text style={styles.label}>Период оплаты</Text>
          <Controller
            control={control}
            name="billingPeriod"
            render={({ field: { value, onChange } }) => (
              <View style={styles.segmentContainer}>
                {[
                  { id: 'day', label: 'День' },
                  { id: 'week', label: 'Неделя' },
                  { id: 'month', label: 'Месяц' },
                  { id: 'year', label: 'Год' },
                ].map((item) => {
                  const selected = value === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.segment, selected && styles.segmentSelected]}
                      onPress={() => onChange(item.id as BillingPeriod)}
                    >
                      <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />
          <Text style={styles.label}>Частота списания</Text>
          <Controller
            control={control}
            name="billingInterval"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={[styles.input, errors.billingInterval && styles.inputError]}
                value={String(value ?? 1)}
                onChangeText={(text) => {
                  const parsed = Number(text.replace(/[^\d]/g, ''));
                  onChange(Number.isFinite(parsed) && parsed > 0 ? parsed : 1);
                }}
                onBlur={onBlur}
                placeholder="1"
                placeholderTextColor={Theme.colors.textMuted}
                keyboardType="number-pad"
              />
            )}
          />
          {errors.billingInterval && (
            <Text style={styles.errorText}>{errors.billingInterval.message}</Text>
          )}

          <Text style={styles.label}>Дата начала</Text>
          <Controller
            control={control}
            name="startDate"
            render={({ field: { value } }) => (
              <>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.dateText}>{formattedDateLabel(value)}</Text>
                </TouchableOpacity>
                {showStartDatePicker && (
                  <DateTimePicker
                    value={value}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, selectedDate) => {
                      setShowStartDatePicker(false);
                      if (selectedDate) {
                        setValue('startDate', selectedDate, {
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
          {errors.startDate && <Text style={styles.errorText}>{errors.startDate.message}</Text>}

          <Text style={styles.label}>Дата следующего списания</Text>
          <Controller
            control={control}
            name="nextChargeDate"
            render={({ field: { value } }) => (
              <>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowNextDatePicker(true)}
                >
                  <Text style={styles.dateText}>{formattedDateLabel(value)}</Text>
                </TouchableOpacity>
                {showNextDatePicker && (
                  <DateTimePicker
                    value={value}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, selectedDate) => {
                      setShowNextDatePicker(false);
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

          <Text style={styles.label}>Статус подписки</Text>
          <Controller
            control={control}
            name="status"
            render={({ field: { value, onChange } }) => (
              <View style={styles.segmentContainer}>
                {[
                  { id: 'active', label: 'Активна' },
                  { id: 'paused', label: 'Пауза' },
                  { id: 'cancelled', label: 'Отключена' },
                ].map((item) => {
                  const selected = value === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.segment, selected && styles.segmentSelected]}
                      onPress={() => onChange(item.id as FormValues['status'])}
                    >
                      <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />

          <Text style={styles.label}>Категория</Text>
          <Controller
            control={control}
            name="categoryId"
            render={({ field: { value, onChange } }) => (
              <View style={styles.categoryContainer}>
                {categoryOptions.map((cat) => {
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
                          selected && { color: Theme.colors.textOnAccent, fontWeight: '700' },
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
          {errors.categoryId && <Text style={styles.errorText}>{errors.categoryId.message}</Text>}

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
                placeholder="Ссылка на сервис"
                placeholderTextColor={Theme.colors.textMuted}
                autoCapitalize="none"
              />
            )}
          />
          {errors.url && <Text style={styles.errorText}>{errors.url.message}</Text>}

          <Text style={styles.label}>Дополнительные заметки</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Дополнительные заметки"
                placeholderTextColor={Theme.colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            )}
          />

          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmit(onSubmit as any)}
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
    fontFamily: 'Benzin-Medium',
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
    color: Theme.colors.textOnAccent,
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
    color: Theme.colors.textOnAccent,
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    marginTop: 12,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.danger,
    paddingVertical: 11,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: Theme.colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});
