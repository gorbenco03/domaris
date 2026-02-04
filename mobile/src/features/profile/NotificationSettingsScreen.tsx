/**
 * RIVA - Notification Settings Screen
 * Sprint 1: Notification preferences with quiet hours
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../config/useTheme';
import Button from '../../shared/components/Button';
import { updateNotificationPreferences, updateQuietHours } from '../../core/api/userApi';
import type {
  IUpdateNotificationPreferencesRequest,
  IUpdateQuietHoursRequest,
} from '../../core/api/types';
import { useAuthStore } from '../../core/stores/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TimePickerProps {
  label: string;
  value: string;
  onChange: (time: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ label, value, onChange }) => {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const [selectedHour, setSelectedHour] = useState(value.split(':')[0]);
  const [selectedMinute, setSelectedMinute] = useState(value.split(':')[1]);

  const handleConfirm = () => {
    onChange(`${selectedHour}:${selectedMinute}`);
    setShowPicker(false);
  };

  if (showPicker) {
    return (
      <View style={{ backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16 }}>
        <Text style={[theme.typography.body2, { marginBottom: 12, color: theme.colors.textSecondary }]}>
          {label}
        </Text>
        
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          {/* Hours */}
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[theme.typography.caption, { marginBottom: 8, textAlign: 'center' }]}>Ore</Text>
            <ScrollView style={{ maxHeight: 120 }}>
              {hours.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[
                    {
                      padding: 8,
                      borderRadius: 8,
                      marginBottom: 4,
                      backgroundColor: selectedHour === hour ? theme.colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => setSelectedHour(hour)}
                >
                  <Text
                    style={[
                      theme.typography.body2,
                      {
                        textAlign: 'center',
                        color: selectedHour === hour ? theme.colors.background : theme.colors.text,
                      },
                    ]}
                  >
                    {hour}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Minutes */}
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[theme.typography.caption, { marginBottom: 8, textAlign: 'center' }]}>Minute</Text>
            <ScrollView style={{ maxHeight: 120 }}>
              {minutes.map((minute) => (
                <TouchableOpacity
                  key={minute}
                  style={[
                    {
                      padding: 8,
                      borderRadius: 8,
                      marginBottom: 4,
                      backgroundColor: selectedMinute === minute ? theme.colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => setSelectedMinute(minute)}
                >
                  <Text
                    style={[
                      theme.typography.body2,
                      {
                        textAlign: 'center',
                        color: selectedMinute === minute ? theme.colors.background : theme.colors.text,
                      },
                    ]}
                  >
                    {minute}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <Button
            title="Anulează"
            onPress={() => setShowPicker(false)}
            variant="outline"
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            title="Confirmă"
            onPress={handleConfirm}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
      onPress={() => setShowPicker(true)}
    >
      <Text style={[theme.typography.body2, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[theme.typography.body2, { color: theme.colors.text }]}>{value}</Text>
    </TouchableOpacity>
  );
};

export const NotificationSettingsScreen: React.FC = () => {
  const theme = useTheme();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    email: user?.notificationPreferences?.email ?? true,
    push: user?.notificationPreferences?.push ?? true,
    sms: user?.notificationPreferences?.sms ?? false,
    marketing: user?.notificationPreferences?.marketing ?? false,
    newMessages: user?.notificationPreferences?.newMessages ?? true,
    viewingReminders: user?.notificationPreferences?.viewingReminders ?? true,
    priceDrops: user?.notificationPreferences?.priceDrops ?? true,
    newListingsAlerts: user?.notificationPreferences?.newListingsAlerts ?? true,
    quietHoursEnabled: user?.notificationPreferences?.quietHoursEnabled ?? false,
  });

  const [quietHours, setQuietHours] = useState({
    start: user?.notificationQuietHoursStart ?? '22:00',
    end: user?.notificationQuietHoursEnd ?? '08:00',
  });

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      const response = await updateNotificationPreferences(preferences);
      if (response.success) {
        // Update local user state
        updateUser({
          ...user!,
          notificationPreferences: response.notificationPreferences,
        });
        Alert.alert('Succes', 'Preferințele de notificare au fost actualizate');
      }
    } catch (error: any) {
      Alert.alert('Eroare', error.message || 'Nu am putut actualiza preferințele');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuietHours = async () => {
    setLoading(true);
    try {
      const response = await updateQuietHours(quietHours);
      if (response.success) {
        // Update local user state
        updateUser({
          ...user!,
          notificationQuietHoursStart: response.quietHours.start,
          notificationQuietHoursEnd: response.quietHours.end,
        });
        Alert.alert('Succes', 'Orele de liniște au fost actualizate');
      }
    } catch (error: any) {
      Alert.alert('Eroare', error.message || 'Nu am putut actualiza orele de liniște');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (key: keyof typeof preferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const updateQuietHour = (type: 'start' | 'end', value: string) => {
    setQuietHours(prev => ({ ...prev, [type]: value }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20 }}>
          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <Text style={[theme.typography.h2, { marginBottom: 8 }]}>
              Setări Notificări
            </Text>
            <Text style={[theme.typography.body2, { color: theme.colors.textSecondary }]}>
              Personalizează cum și când primești notificări
            </Text>
          </View>

          {/* Notification Channels */}
          <View style={{ marginBottom: 32 }}>
            <Text style={[theme.typography.h6, { marginBottom: 16 }]}>
              Canale de Notificare
            </Text>
            
            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: theme.colors.surface,
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <View>
                  <Text style={[theme.typography.body1]}>Email</Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                    Primește notificări pe email
                  </Text>
                </View>
                <Switch
                  value={preferences.email}
                  onValueChange={(value) => updatePreference('email', value)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: theme.colors.surface,
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <View>
                  <Text style={[theme.typography.body1]}>Push Notifications</Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                    Notificări pe dispozitivul mobil
                  </Text>
                </View>
                <Switch
                  value={preferences.push}
                  onValueChange={(value) => updatePreference('push', value)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: theme.colors.surface,
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <View>
                  <Text style={[theme.typography.body1]}>SMS</Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                    Notificări prin mesaje text
                  </Text>
                </View>
                <Switch
                  value={preferences.sms}
                  onValueChange={(value) => updatePreference('sms', value)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
              </View>
            </View>
          </View>

          {/* Notification Types */}
          <View style={{ marginBottom: 32 }}>
            <Text style={[theme.typography.h6, { marginBottom: 16 }]}>
              Tipuri de Notificări
            </Text>
            
            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: theme.colors.surface,
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <View>
                  <Text style={[theme.typography.body1]}>Mesaje Noi</Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                    Când primești mesaje noi
                  </Text>
                </View>
                <Switch
                  value={preferences.newMessages}
                  onValueChange={(value) => updatePreference('newMessages', value)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: theme.colors.surface,
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <View>
                  <Text style={[theme.typography.body1]}>Reamintiri Vizionări</Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                    Înainte de vizionările programate
                  </Text>
                </View>
                <Switch
                  value={preferences.viewingReminders}
                  onValueChange={(value) => updatePreference('viewingReminders', value)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: theme.colors.surface,
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <View>
                  <Text style={[theme.typography.body1]}>Scăderi de Preț</Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                    Când prețul proprietăților favorite scade
                  </Text>
                </View>
                <Switch
                  value={preferences.priceDrops}
                  onValueChange={(value) => updatePreference('priceDrops', value)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: theme.colors.surface,
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <View>
                  <Text style={[theme.typography.body1]}>Alerte Noi</Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                    Proprietăți noi conform căutărilor tale
                  </Text>
                </View>
                <Switch
                  value={preferences.newListingsAlerts}
                  onValueChange={(value) => updatePreference('newListingsAlerts', value)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: theme.colors.surface,
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <View>
                  <Text style={[theme.typography.body1]}>Marketing</Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                    Oferte și noutăți RIVA
                  </Text>
                </View>
                <Switch
                  value={preferences.marketing}
                  onValueChange={(value) => updatePreference('marketing', value)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
              </View>
            </View>
          </View>

          {/* Quiet Hours */}
          <View style={{ marginBottom: 32 }}>
            <Text style={[theme.typography.h6, { marginBottom: 16 }]}>
              Ore de Liniște
            </Text>
            
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <View>
                <Text style={[theme.typography.body1]}>Activează Ore de Liniște</Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  Nu deranja în intervalul selectat
                </Text>
              </View>
              <Switch
                value={preferences.quietHoursEnabled}
                onValueChange={(value) => updatePreference('quietHoursEnabled', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              />
            </View>

            {preferences.quietHoursEnabled && (
              <View style={{ marginBottom: 16 }}>
                <TimePicker
                  label="Ora de început"
                  value={quietHours.start}
                  onChange={(value) => updateQuietHour('start', value)}
                />
                <View style={{ height: 8 }} />
                <TimePicker
                  label="Ora de sfârșit"
                  value={quietHours.end}
                  onChange={(value) => updateQuietHour('end', value)}
                />
              </View>
            )}
          </View>

          {/* Save Buttons */}
          <Button
            title={loading ? 'Se salvează...' : 'Salvează Preferințele'}
            onPress={handleSavePreferences}
            disabled={loading}
            style={{ marginBottom: 12 }}
          />

          {preferences.quietHoursEnabled && (
            <Button
              title={loading ? 'Se salvează...' : 'Salvează Orele de Liniște'}
              onPress={handleSaveQuietHours}
              disabled={loading}
              variant="outline"
              style={{ marginBottom: 20 }}
            />
          )}

          {loading && (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
