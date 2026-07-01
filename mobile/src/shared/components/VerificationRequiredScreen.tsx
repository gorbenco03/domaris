/**
 * RIVA - Verification Required Screen
 * Prompt user to complete verification before access.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Shield } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import EmptyState from './EmptyState';

interface VerificationRequiredScreenProps {
  title?: string;
  message?: string;
  ctaLabel?: string;
}

const VerificationRequiredScreen: React.FC<VerificationRequiredScreenProps> = ({
  title = 'Verificare necesară',
  message = 'Finalizează verificarea proprietarului pentru a continua.',
  ctaLabel = 'Începe verificarea',
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const handleVerificationPress = () => {
    const parent = navigation.getParent?.();
    const root = parent?.getParent?.() ?? parent ?? navigation;
    // @ts-ignore - Root navigator route (nested params not statically typed)
    root.navigate('Main', {
      screen: 'ProfileTab',
      // @ts-ignore
      params: { screen: 'VerificationHub' },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <EmptyState
        icon={<Shield size={36} color={theme.colors.textTertiary} />}
        title={title}
        message={message}
        actionLabel={ctaLabel}
        onAction={handleVerificationPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});

export default VerificationRequiredScreen;
