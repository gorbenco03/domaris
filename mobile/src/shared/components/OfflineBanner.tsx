/**
 * RIVA - Offline Banner
 * Shows a persistent banner when the device has no network connectivity.
 * Uses @react-native-community/netinfo.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const OfflineBanner: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [isOffline, setIsOffline] = React.useState(false);
  const translateY = useRef(new Animated.Value(-60)).current;
  const offlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Offline DOAR când nu există interfață de rețea (isConnected === false).
    // NU folosim `isInternetReachable`: acela face un sondaj HTTP către un URL
    // extern care eșuează fals pe multe rețele (URL blocat/lent, ex. în Moldova),
    // afișând un banner „fără internet" deși conexiunea funcționează.
    // În plus, afișăm bannerul doar dacă starea offline persistă ~3s, ca să
    // evităm clipirea la tranziții momentane (pornire aplicație, schimbare rețea).
    const apply = (state: NetInfoState) => {
      const offline = state.isConnected === false;
      if (offline) {
        if (!offlineTimer.current) {
          offlineTimer.current = setTimeout(() => setIsOffline(true), 3000);
        }
      } else {
        if (offlineTimer.current) {
          clearTimeout(offlineTimer.current);
          offlineTimer.current = null;
        }
        setIsOffline(false);
      }
    };

    const unsubscribe = NetInfo.addEventListener(apply);
    NetInfo.fetch().then(apply);

    return () => {
      unsubscribe();
      if (offlineTimer.current) clearTimeout(offlineTimer.current);
    };
  }, []);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isOffline ? 0 : -60,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, translateY]);

  return (
    <Animated.View
      style={[
        styles.banner,
        { top: insets.top, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        <Text style={styles.text}>Nu există conexiune la internet</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#1E3A5F',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  content: {
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default OfflineBanner;
