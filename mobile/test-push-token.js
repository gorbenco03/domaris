/**
 * RIVA - Test Push Token Script
 * Rulează acest script pentru a obține push token-ul
 */

import * as Notifications from 'expo-notifications';

async function getPushToken() {
  try {
    console.log('🔔 Getting push token...');
    
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('❌ Push notifications permission not granted');
      return;
    }

    // Get token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: '5986308b-82d0-4d84-af05-6e614efc3263',
    });

    console.log('✅ Push Token:', token.data);
    console.log('📋 Use this token to send test notifications:');
    console.log(`curl -X POST https://api.expo.dev/v2/push/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "${token.data}",
    "title": "Test Sprint 1",
    "body": "Notificare test RIVA"
  }'`);
    
    return token.data;
  } catch (error) {
    console.error('❌ Error getting push token:', error);
  }
}

// Run the function
getPushToken();
