import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus, Linking, Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

import { useTheme } from '@/app/providers/ThemeProvider';
import { fetchAppStatus, type AppStatusResponse } from '@/core/appStatus/appStatusApi';
import MaintenanceScreen from '@/shared/components/MaintenanceScreen';
import UpdateRequiredScreen from '@/shared/components/UpdateRequiredScreen';

type Props = {
  children: React.ReactNode;
};

type GateMode = 'none' | 'maintenance' | 'update_required';

const AppStatusGate: React.FC<Props> = ({ children }) => {
  const { theme } = useTheme();

  const [mode, setMode] = useState<GateMode>('none');
  const [status, setStatus] = useState<AppStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const appVersion = useMemo(() => {
    return (
      (Constants.expoConfig as any)?.version ||
      (Constants.manifest as any)?.version ||
      '0.0.0'
    );
  }, []);

  const platform = (Platform.OS === 'ios' ? 'ios' : 'android') as 'ios' | 'android';

  const decideMode = useCallback((next: AppStatusResponse) => {
    if (next.maintenance?.enabled) {
      return 'maintenance' as const;
    }
    if (next.version?.updateRequired) {
      return 'update_required' as const;
    }
    return 'none' as const;
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAppStatus({ platform, version: appVersion });
      setStatus(res);
      setMode(decideMode(res));
    } catch (e) {
      // Fail-open: do not block app if status endpoint is unreachable.
      setStatus(null);
      setMode('none');
    } finally {
      setLoading(false);
    }
  }, [appVersion, decideMode, platform]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;
      if (prevState.match(/inactive|background/) && nextState === 'active') {
        checkStatus();
      }
    });

    return () => sub.remove();
  }, [checkStatus]);

  const storeUrl = platform === 'ios' ? status?.version?.iosStoreUrl : status?.version?.androidStoreUrl;

  const handleOpenStore = useCallback(async () => {
    if (!storeUrl) return;
    try {
      await Linking.openURL(storeUrl);
    } catch {
      // ignore
    }
  }, [storeUrl]);

  if (loading && mode !== 'none') {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  if (mode === 'maintenance') {
    return (
      <MaintenanceScreen
        message={status?.maintenance?.message}
        onRetry={checkStatus}
      />
    );
  }

  if (mode === 'update_required') {
    return (
      <UpdateRequiredScreen
        currentVersion={status?.version?.current}
        minSupportedVersion={status?.version?.minSupported}
        storeUrl={storeUrl}
        onOpenStore={handleOpenStore}
        onRetry={checkStatus}
      />
    );
  }

  return (
    <View style={styles.container}>
      {children}
      {status?.version?.updateAvailable ? (
        // optional: show nothing for now (non-blocking updates can be implemented as a toast/banner later)
        null
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppStatusGate;
