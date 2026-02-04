/**
 * RIVA - Debug Push Token
 * Script pentru a obține și afișa push token-ul
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

export const PushTokenDebug: React.FC = () => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPushToken();
  }, []);

  const getPushToken = async () => {
    try {
      setLoading(true);
      
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Push notifications permission is required');
        return;
      }

      // Get token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '5986308b-82d0-4d84-af05-6e614efc3263',
      });

      setPushToken(token.data);
      console.log('🔔 Push Token:', token.data);
      
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      Alert.alert('Error', 'Failed to get push token');
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (pushToken) {
      // Într-o app reală, am folosi Clipboard
      console.log('📋 Token to copy:', pushToken);
      Alert.alert('Token Copied', 'Token copied to console');
    }
  };

  const sendTestNotification = async () => {
    if (!pushToken) {
      Alert.alert('No Token', 'Please get push token first');
      return;
    }

    try {
      await fetch('https://api.expo.dev/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: pushToken,
          title: '🎯 Test Sprint 1',
          body: 'Notificare test de la RIVA',
          data: { type: 'test', timestamp: Date.now() },
        }),
      });

      Alert.alert('✅ Sent', 'Test notification sent!');
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      Alert.alert('❌ Error', 'Failed to send notification');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading push token...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Push Token Debug</Text>
      
      <View style={styles.tokenContainer}>
        <Text style={styles.label}>Push Token:</Text>
        <Text style={styles.token} selectable>
          {pushToken || 'No token'}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={copyToken}>
        <Text style={styles.buttonText}>📋 Copy Token</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.testButton]} 
        onPress={sendTestNotification}
      >
        <Text style={styles.buttonText}>📱 Send Test Notification</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.refreshButton]} 
        onPress={getPushToken}
      >
        <Text style={styles.buttonText}>🔄 Refresh Token</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  tokenContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  token: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#1e3a5f',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  testButton: {
    backgroundColor: '#28a745',
  },
  refreshButton: {
    backgroundColor: '#ffc107',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
