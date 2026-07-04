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

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      // Considerăm offline DOAR când NetInfo spune explicit false.
      // `isInternetReachable` e `null` până se termină sondajul (și poate rămâne
      // null pe unele build-uri) — a-l trata ca offline dă un banner fals.
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
    });

    // Fetch initial state
    NetInfo.fetch().then((state) => {
      // Considerăm offline DOAR când NetInfo spune explicit false.
      // `isInternetReachable` e `null` până se termină sondajul (și poate rămâne
      // null pe unele build-uri) — a-l trata ca offline dă un banner fals.
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
    });

    return () => unsubscribe();
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
