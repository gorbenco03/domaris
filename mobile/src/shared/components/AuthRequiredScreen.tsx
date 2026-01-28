/**
 * IMOBI - Auth Required Screen
 * Simple guest prompt with CTA to authenticate
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Lock } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import EmptyState from './EmptyState';

interface AuthRequiredScreenProps {
  title?: string;
  message?: string;
  ctaLabel?: string;
}

const AuthRequiredScreen: React.FC<AuthRequiredScreenProps> = ({
  title = 'Autentificare necesară',
  message = 'Pentru această secțiune trebuie să te autentifici.',
  ctaLabel = 'Mergi la autentificare',
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const handleAuthPress = () => {
    const parent = navigation.getParent?.();
    const root = parent?.getParent?.() ?? parent ?? navigation;
    // @ts-ignore - Root navigator route
    root.navigate('Auth');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <EmptyState
        icon={<Lock size={36} color={theme.colors.textTertiary} />}
        title={title}
        message={message}
        actionLabel={ctaLabel}
        onAction={handleAuthPress}
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

export default AuthRequiredScreen;
